import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type CallType = "voice" | "video";
export type CallStatus =
  | "idle"
  | "calling"
  | "ringing"
  | "connecting"
  | "connected"
  | "ended"
  | "declined"
  | "busy";

export interface CallPeerInfo {
  id: string;
  name: string;
  handle?: string;
  avatar?: string;
}

export interface SignalingPayload {
  callId: string;
  chatId: string;
  from: CallPeerInfo;
  to?: CallPeerInfo;
  type: CallType;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  reason?: string;
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
  private remoteStream: MediaStream | null = null;
  private channel: RealtimeChannel | null = null;
  private currentFacingMode: "user" | "environment" = "user";
  private iceCandidateQueue: RTCIceCandidateInit[] = [];
  private remoteDescSet = false;

  public onRemoteStream?: (stream: MediaStream) => void;
  public onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
  public onSignalMessage?: (event: string, payload: SignalingPayload) => void;

  constructor() {
    if (typeof window !== "undefined" && typeof MediaStream !== "undefined") {
      this.remoteStream = new MediaStream();
    }
  }

  async getLocalMedia(type: CallType): Promise<MediaStream> {
    if (this.localStream) {
      this.stopLocalMedia();
    }

    const constraints: MediaStreamConstraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video:
        type === "video"
          ? {
              facingMode: this.currentFacingMode,
              width: { ideal: 1280, max: 1920 },
              height: { ideal: 720, max: 1080 },
            }
          : false,
    };

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      return this.localStream;
    } catch (err: any) {
      console.warn("Media devices error, attempting audio-only fallback:", err);
      if (type === "video") {
        try {
          this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          return this.localStream;
        } catch (audioErr) {
          throw audioErr;
        }
      }
      throw err;
    }
  }

  createPeerConnection(
    onIceCandidate: (candidate: RTCIceCandidateInit) => void
  ): RTCPeerConnection {
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }

    this.remoteDescSet = false;
    this.iceCandidateQueue = [];
    if (typeof MediaStream !== "undefined") {
      this.remoteStream = new MediaStream();
    }

    const pc = new RTCPeerConnection(RTC_CONFIG);
    this.pc = pc;

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        event.streams[0].getTracks().forEach((track) => {
          if (!this.remoteStream?.getTracks().some((t) => t.id === track.id)) {
            this.remoteStream?.addTrack(track);
          }
        });
      } else if (event.track) {
        this.remoteStream?.addTrack(event.track);
      }
      if (this.onRemoteStream && this.remoteStream) {
        this.onRemoteStream(this.remoteStream);
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        onIceCandidate(event.candidate.toJSON());
      }
    };

    pc.onconnectionstatechange = () => {
      if (this.onConnectionStateChange) {
        this.onConnectionStateChange(pc.connectionState);
      }
    };

    return pc;
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.pc) throw new Error("RTCPeerConnection not initialized");
    const offer = await this.pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });
    await this.pc.setLocalDescription(offer);
    return offer;
  }

  async handleOffer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    if (!this.pc) throw new Error("RTCPeerConnection not initialized");
    await this.pc.setRemoteDescription(new RTCSessionDescription(offer));
    this.remoteDescSet = true;
    await this.processQueuedCandidates();

    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    return answer;
  }

  async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.pc) return;
    await this.pc.setRemoteDescription(new RTCSessionDescription(answer));
    this.remoteDescSet = true;
    await this.processQueuedCandidates();
  }

  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.pc || !this.remoteDescSet) {
      this.iceCandidateQueue.push(candidate);
      return;
    }
    try {
      await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (e) {
      console.warn("Failed to add ICE candidate:", e);
    }
  }

  private async processQueuedCandidates(): Promise<void> {
    if (!this.pc) return;
    while (this.iceCandidateQueue.length > 0) {
      const candidate = this.iceCandidateQueue.shift();
      if (candidate) {
        try {
          await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn("Failed to add queued candidate:", e);
        }
      }
    }
  }

  toggleAudio(enabled?: boolean): boolean {
    if (!this.localStream) return false;
    const tracks = this.localStream.getAudioTracks();
    const newState = enabled !== undefined ? enabled : !tracks[0]?.enabled;
    tracks.forEach((track) => {
      track.enabled = newState;
    });
    return newState;
  }

  toggleVideo(enabled?: boolean): boolean {
    if (!this.localStream) return false;
    const tracks = this.localStream.getVideoTracks();
    const newState = enabled !== undefined ? enabled : !tracks[0]?.enabled;
    tracks.forEach((track) => {
      track.enabled = newState;
    });
    return newState;
  }

  async switchCamera(): Promise<MediaStream | null> {
    if (!this.localStream) return null;
    this.currentFacingMode = this.currentFacingMode === "user" ? "environment" : "user";

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: this.currentFacingMode },
      });
      const newVideoTrack = newStream.getVideoTracks()[0];
      if (!newVideoTrack) return this.localStream;

      const oldVideoTrack = this.localStream.getVideoTracks()[0];
      if (oldVideoTrack) {
        this.localStream.removeTrack(oldVideoTrack);
        oldVideoTrack.stop();
      }
      this.localStream.addTrack(newVideoTrack);

      if (this.pc) {
        const senders = this.pc.getSenders();
        const videoSender = senders.find((s) => s.track?.kind === "video");
        if (videoSender) {
          await videoSender.replaceTrack(newVideoTrack);
        }
      }
      return this.localStream;
    } catch (err) {
      console.warn("Failed to switch camera:", err);
      return this.localStream;
    }
  }

  subscribeSignaling(
    chatId: string,
    onSignal: (event: string, payload: SignalingPayload) => void
  ): RealtimeChannel {
    this.unsubscribeSignaling();

    const channelName = `call_${chatId}`;
    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    });

    const signalEvents = [
      "call_invite",
      "call_accept",
      "call_reject",
      "call_end",
      "webrtc_offer",
      "webrtc_answer",
      "webrtc_ice_candidate",
    ];

    signalEvents.forEach((eventName) => {
      channel.on("broadcast", { event: eventName }, ({ payload }) => {
        onSignal(eventName, payload as SignalingPayload);
      });
    });

    channel.subscribe((status) => {
      console.log(`[WebRTC] Channel ${channelName} status:`, status);
    });

    this.channel = channel;
    return channel;
  }

  async sendSignal(event: string, payload: SignalingPayload): Promise<void> {
    if (!this.channel) return;
    try {
      await this.channel.send({
        type: "broadcast",
        event,
        payload,
      });
    } catch (err) {
      console.warn(`[WebRTC] Error sending signal ${event}:`, err);
    }
  }

  unsubscribeSignaling(): void {
    if (this.channel) {
      try {
        supabase.removeChannel(this.channel);
      } catch (e) {}
      this.channel = null;
    }
  }

  stopLocalMedia(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      this.localStream = null;
    }
  }

  cleanup(): void {
    this.stopLocalMedia();
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      this.remoteStream = null;
    }
    if (this.pc) {
      try {
        this.pc.close();
      } catch {}
      this.pc = null;
    }
    this.remoteDescSet = false;
    this.iceCandidateQueue = [];
    this.unsubscribeSignaling();
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  getPeerConnection(): RTCPeerConnection | null {
    return this.pc;
  }
}

export const webrtc = new WebRTCManager();
