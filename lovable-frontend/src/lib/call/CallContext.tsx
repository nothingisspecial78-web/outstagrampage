import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import {
  webrtc,
  type CallType,
  type CallStatus,
  type CallPeerInfo,
  type SignalingPayload,
} from "./webrtc";
import { callSounds } from "./sound";
import { toast } from "sonner";
import { useStore } from "@/lib/store";

export interface CallContextType {
  status: CallStatus;
  callType: CallType;
  chatId: string | null;
  callId: string | null;
  peer: CallPeerInfo | null;
  isMuted: boolean;
  isCameraOff: boolean;
  duration: number;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  incomingCall: SignalingPayload | null;
  startCall: (chatId: string, peer: CallPeerInfo, type: CallType) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: (reason?: string) => Promise<void>;
  endCall: () => void;
  toggleMic: () => void;
  toggleCamera: () => void;
  switchCamera: () => Promise<void>;
  simulateAnswer: () => void;
}

const CallContext = createContext<CallContextType | null>(null);

export function CallProvider({ children }: { children: React.ReactNode }) {
  const { session, logCallEvent } = useStore();
  const [status, setStatus] = useState<CallStatus>("idle");
  const [callType, setCallType] = useState<CallType>("video");
  const [chatId, setChatId] = useState<string | null>(null);
  const [callId, setCallId] = useState<string | null>(null);
  const [peer, setPeer] = useState<CallPeerInfo | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [duration, setDuration] = useState(0);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [incomingCall, setIncomingCall] = useState<SignalingPayload | null>(null);

  const durationTimerRef = useRef<number | null>(null);
  const autoConnectTimerRef = useRef<number | null>(null);
  const callStartTimeRef = useRef<number | null>(null);

  // Self identity
  const currentSelf: CallPeerInfo = {
    id: session?.email || "self_user",
    name: session?.name || "Sam Okafor",
    avatar: "",
  };

  // Keep remote stream updated
  useEffect(() => {
    webrtc.onRemoteStream = (stream) => {
      setRemoteStream(typeof MediaStream !== "undefined" ? new MediaStream(stream.getTracks()) : stream);
    };

    webrtc.onConnectionStateChange = (state) => {
      console.log("[WebRTC] Peer Connection State:", state);
      if (state === "connected") {
        setStatus("connected");
        callSounds.playConnectedTone();
      } else if (state === "disconnected" || state === "failed" || state === "closed") {
        if (status === "connected") {
          toast.info("Call disconnected");
          endCall();
        }
      }
    };

    return () => {
      webrtc.cleanup();
      callSounds.stopRingtone();
    };
  }, []);

  // Duration counter when connected
  useEffect(() => {
    if (status === "connected") {
      callStartTimeRef.current = Date.now();
      setDuration(0);
      durationTimerRef.current = window.setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (durationTimerRef.current !== null) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
    }

    return () => {
      if (durationTimerRef.current !== null) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
    };
  }, [status]);

  // Handle incoming signaling messages
  const handleSignal = useCallback(
    async (event: string, payload: SignalingPayload) => {
      console.log(`[WebRTC] Received signal: ${event}`, payload);

      // Verify if signal belongs to current user or chat
      if (event === "call_invite") {
        // Someone is calling us!
        if (status !== "idle") {
          // We are busy
          await webrtc.sendSignal("call_reject", {
            ...payload,
            from: currentSelf,
            reason: "busy",
          });
          return;
        }

        setIncomingCall(payload);
        callSounds.startIncomingRingtone();
        return;
      }

      // Check callId match for existing session
      if (callId && payload.callId !== callId) return;

      if (event === "call_accept") {
        // Peer accepted! Initiate WebRTC offer
        callSounds.stopRingtone();
        if (autoConnectTimerRef.current) {
          clearTimeout(autoConnectTimerRef.current);
          autoConnectTimerRef.current = null;
        }

        setStatus("connecting");
        try {
          const pc = webrtc.createPeerConnection((candidate) => {
            webrtc.sendSignal("webrtc_ice_candidate", {
              callId: payload.callId,
              chatId: payload.chatId,
              from: currentSelf,
              type: payload.type,
              candidate,
            });
          });

          const offer = await webrtc.createOffer();
          await webrtc.sendSignal("webrtc_offer", {
            callId: payload.callId,
            chatId: payload.chatId,
            from: currentSelf,
            type: payload.type,
            sdp: offer,
          });
        } catch (err) {
          console.error("Error creating WebRTC offer:", err);
          toast.error("Failed to connect call");
          endCall();
        }
      } else if (event === "webrtc_offer") {
        // Callee receives offer -> create answer
        try {
          const answer = await webrtc.handleOffer(payload.sdp!);
          await webrtc.sendSignal("webrtc_answer", {
            callId: payload.callId,
            chatId: payload.chatId,
            from: currentSelf,
            type: payload.type,
            sdp: answer,
          });
          setStatus("connected");
          callSounds.playConnectedTone();
        } catch (err) {
          console.error("Error handling WebRTC offer:", err);
        }
      } else if (event === "webrtc_answer") {
        // Caller receives answer -> set remote description
        try {
          await webrtc.handleAnswer(payload.sdp!);
          setStatus("connected");
          callSounds.playConnectedTone();
        } catch (err) {
          console.error("Error handling WebRTC answer:", err);
        }
      } else if (event === "webrtc_ice_candidate") {
        if (payload.candidate) {
          await webrtc.addIceCandidate(payload.candidate);
        }
      } else if (event === "call_reject") {
        callSounds.stopRingtone();
        callSounds.playEndTone();
        toast.info(`${peer?.name || "User"} declined the call.`);
        if (chatId) {
          logCallEvent(chatId, callType, "declined");
        }
        cleanupCall();
      } else if (event === "call_end") {
        callSounds.stopRingtone();
        callSounds.playEndTone();
        toast.info("Call ended");
        if (chatId && duration > 0) {
          logCallEvent(chatId, callType, "completed", duration);
        }
        cleanupCall();
      }
    },
    [status, callId, peer, chatId, callType, duration, currentSelf]
  );

  // Subscribe to chat signaling channel when in a chat or on root
  const activeChatId = chatId;
  useEffect(() => {
    if (activeChatId) {
      webrtc.subscribeSignaling(activeChatId, handleSignal);
    }
  }, [activeChatId, handleSignal]);

  // Start outgoing call
  const startCall = async (targetChatId: string, targetPeer: CallPeerInfo, type: CallType) => {
    try {
      const newCallId = `call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      setChatId(targetChatId);
      setCallId(newCallId);
      setPeer(targetPeer);
      setCallType(type);
      setStatus("calling");
      setIsMuted(false);
      setIsCameraOff(false);

      // Subscribe signaling
      webrtc.subscribeSignaling(targetChatId, handleSignal);

      // Acquire local media
      const stream = await webrtc.getLocalMedia(type);
      setLocalStream(stream);

      // Start outgoing ringtone
      callSounds.startOutgoingRingtone();

      // Dispatch invite signal
      await webrtc.sendSignal("call_invite", {
        callId: newCallId,
        chatId: targetChatId,
        from: currentSelf,
        to: targetPeer,
        type,
      });

      // Solo demo fallback: If no response after 6 seconds, simulate auto-answer
      // This allows immediate testing of call controls, timer, camera & audio
      autoConnectTimerRef.current = window.setTimeout(() => {
        simulateAnswer();
      }, 6000);
    } catch (err: any) {
      console.error("Failed to start call:", err);
      toast.error(err.name === "NotAllowedError" ? "Camera/Microphone permission denied" : "Could not access media devices");
      cleanupCall();
    }
  };

  // Callee accepts incoming call
  const acceptCall = async () => {
    if (!incomingCall) return;
    callSounds.stopRingtone();

    const incoming = incomingCall;
    setIncomingCall(null);
    setChatId(incoming.chatId);
    setCallId(incoming.callId);
    setPeer(incoming.from);
    setCallType(incoming.type);
    setStatus("connecting");
    setIsMuted(false);
    setIsCameraOff(false);

    try {
      webrtc.subscribeSignaling(incoming.chatId, handleSignal);

      // Callee acquires local media
      const stream = await webrtc.getLocalMedia(incoming.type);
      setLocalStream(stream);

      // Callee creates RTCPeerConnection
      webrtc.createPeerConnection((candidate) => {
        webrtc.sendSignal("webrtc_ice_candidate", {
          callId: incoming.callId,
          chatId: incoming.chatId,
          from: currentSelf,
          type: incoming.type,
          candidate,
        });
      });

      // Callee sends call_accept signal
      await webrtc.sendSignal("call_accept", {
        callId: incoming.callId,
        chatId: incoming.chatId,
        from: currentSelf,
        type: incoming.type,
      });
    } catch (err: any) {
      console.error("Failed to accept call:", err);
      toast.error("Failed to access media devices");
      cleanupCall();
    }
  };

  // Reject incoming call
  const rejectCall = async (reason = "declined") => {
    callSounds.stopRingtone();
    if (incomingCall) {
      await webrtc.sendSignal("call_reject", {
        ...incomingCall,
        from: currentSelf,
        reason,
      });
      setIncomingCall(null);
    }
    cleanupCall();
  };

  // Simulate answer for solo test / demo
  const simulateAnswer = () => {
    if (autoConnectTimerRef.current) {
      clearTimeout(autoConnectTimerRef.current);
      autoConnectTimerRef.current = null;
    }
    callSounds.stopRingtone();
    setStatus("connected");
    callSounds.playConnectedTone();

    // In simulated solo mode, mirror local stream as remote stream for testing preview
    const currentLocal = webrtc.getLocalStream();
    if (currentLocal) {
      setRemoteStream(currentLocal);
    }
  };

  // End active call
  const endCall = () => {
    if (autoConnectTimerRef.current) {
      clearTimeout(autoConnectTimerRef.current);
      autoConnectTimerRef.current = null;
    }
    callSounds.stopRingtone();
    callSounds.playEndTone();

    if (callId && chatId) {
      webrtc.sendSignal("call_end", {
        callId,
        chatId,
        from: currentSelf,
        type: callType,
      });

      if (duration > 0) {
        logCallEvent(chatId, callType, "completed", duration);
      } else {
        logCallEvent(chatId, callType, "missed");
      }
    }

    cleanupCall();
  };

  const cleanupCall = () => {
    webrtc.cleanup();
    callSounds.stopRingtone();
    if (durationTimerRef.current !== null) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    if (autoConnectTimerRef.current !== null) {
      clearTimeout(autoConnectTimerRef.current);
      autoConnectTimerRef.current = null;
    }
    setStatus("idle");
    setPeer(null);
    setCallId(null);
    setChatId(null);
    setLocalStream(null);
    setRemoteStream(null);
    setIsMuted(false);
    setIsCameraOff(false);
    setDuration(0);
  };

  // In-call toggles
  const toggleMic = () => {
    const newState = !isMuted;
    const isAudioActive = !newState;
    webrtc.toggleAudio(isAudioActive);
    setIsMuted(newState);
  };

  const toggleCamera = () => {
    const newState = !isCameraOff;
    const isVideoActive = !newState;
    webrtc.toggleVideo(isVideoActive);
    setIsCameraOff(newState);
  };

  const switchCamera = async () => {
    const newStream = await webrtc.switchCamera();
    if (newStream) {
      setLocalStream(new MediaStream(newStream.getTracks()));
    }
  };

  return (
    <CallContext.Provider
      value={{
        status,
        callType,
        chatId,
        callId,
        peer,
        isMuted,
        isCameraOff,
        duration,
        localStream,
        remoteStream,
        incomingCall,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMic,
        toggleCamera,
        switchCamera,
        simulateAnswer,
      }}
    >
      {children}
    </CallContext.Provider>
  );
}

export function useCall() {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error("useCall must be used within a CallProvider");
  return ctx;
}
