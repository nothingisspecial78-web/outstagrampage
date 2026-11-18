import { supabase } from "@/lib/supabase";

export type CallType = "voice" | "video";
export type CallStatus = "idle" | "calling" | "ringing" | "connecting" | "connected" | "ended";

export interface CallPeerInfo {
  id: string;
  name: string;
  avatar?: string;
}

export interface SignalingPayload {
  type: "call-invite" | "call-accept" | "call-reject" | "call-end" | "ice-candidate";
  callId: string;
  chatId: string;
  caller: CallPeerInfo;
  target: CallPeerInfo;
  callType: CallType;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

export const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

export class WebRTCManager {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private channelSubscription: any = null;
  private facingMode: "user" | "environment" = "user";

  public onRemoteStream?: (stream: MediaStream) => void;
  public onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
  public onIceCandidateGenerated?: (candidate: RTCIceCandidateInit) => void;

  public getPeerConnection(): RTCPeerConnection | null {
    return this.pc;
  }

  public getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  // Acquire media tracks
  async initLocalMedia(video = true): Promise<MediaStream> {
    this.cleanupMedia();
    try {
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: video
          ? {
              facingMode: this.facingMode,
              width: { ideal: 1280 },
              height: { ideal: 720 },
            }
          : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.localStream = stream;
      return stream;
    } catch (err) {
      console.error("[WebRTC] Media access error:", err);
      // Fallback to audio-only if video fails (e.g. no camera or blocked)
      if (video) {
        return this.initLocalMedia(false);
      }
      throw err;
    }
  }

  // Flip camera between front and rear
  async switchCamera(): Promise<MediaStream> {
    this.facingMode = this.facingMode === "user" ? "environment" : "user";
    const newStream = await this.initLocalMedia(true);

    if (this.pc) {
      const videoTrack = newStream.getVideoTracks()[0];
      const senders = this.pc.getSenders();
      const videoSender = senders.find((s) => s.track && s.track.kind === "video");
      if (videoSender && videoTrack) {
        await videoSender.replaceTrack(videoTrack);
      }
    }
    return newStream;
  }

  // Initialize peer connection with standard event handlers
  createPeerConnection(): RTCPeerConnection {
    if (this.pc) {
      this.pc.close();
    }

    const pc = new RTCPeerConnection(RTC_CONFIG);
    this.pc = pc;

    // Attach local tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // Handle remote tracks
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteStream && this.onRemoteStream) {
        this.onRemoteStream(remoteStream);
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && this.onIceCandidateGenerated) {
        this.onIceCandidateGenerated(event.candidate.toJSON());
      }
    };

    // Connection state changes
    pc.onconnectionstatechange = () => {
      if (this.onConnectionStateChange) {
        this.onConnectionStateChange(pc.connectionState);
      }
    };

    return pc;
  }

  // Create WebRTC Offer
  async createOffer(): Promise<RTCSessionDescriptionInit> {
    const pc = this.createPeerConnection();
    const offer = await pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });
    await pc.setLocalDescription(offer);
    return offer;
  }

  // Handle incoming Offer and create Answer
  async handleOffer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    const pc = this.createPeerConnection();
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    return answer;
  }

  // Handle Answer from peer
  async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.pc) return;
    await this.pc.setRemoteDescription(new RTCSessionDescription(answer));
  }

  // Add ICE candidate
  async handleIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.pc) return;
    try {
      await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (e) {
      console.warn("[WebRTC] ICE candidate error:", e);
    }
  }

  // Toggle local microphone track
  toggleAudio(): boolean {
    if (!this.localStream) return false;
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      return audioTrack.enabled;
    }
    return false;
  }

  // Toggle local video track
  toggleVideo(): boolean {
    if (!this.localStream) return false;
    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      return videoTrack.enabled;
    }
    return false;
  }

  // Send signaling event over Supabase Realtime broadcast
  async sendSignal(payload: SignalingPayload): Promise<void> {
    try {
      const channelName = `call_channel_${payload.chatId}`;
      const channel = supabase.channel(channelName);
      await channel.subscribe();
      await channel.send({
        type: "broadcast",
        event: "webrtc_signal",
        payload,
      });
    } catch (err) {
      console.error("[WebRTC] Failed to send signal:", err);
    }
  }

  // Listen to signaling events on chat channel
  listenSignaling(chatId: string, onSignal: (payload: SignalingPayload) => void) {
    if (this.channelSubscription) {
      this.channelSubscription.unsubscribe();
    }
    const channelName = `call_channel_${chatId}`;
    this.channelSubscription = supabase
      .channel(channelName)
      .on("broadcast", { event: "webrtc_signal" }, (event: any) => {
        if (event.payload) {
          onSignal(event.payload);
        }
      })
      .subscribe();
  }

  // Cleanup all media and connections
  cleanup() {
    this.cleanupMedia();
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
    if (this.channelSubscription) {
      this.channelSubscription.unsubscribe();
      this.channelSubscription = null;
    }
  }

  private cleanupMedia() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
  }
}

export const webrtc = new WebRTCManager();