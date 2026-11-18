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
      }
    };
  }, [status]);

  // Start outgoing call
  const startCall = async (targetChatId: string, targetPeer: CallPeerInfo, type: CallType) => {
    try {
      const newCallId = `call_${Date.now()}`;
      setChatId(targetChatId);
      setCallId(newCallId);
      setPeer(targetPeer);
      setCallType(type);
      setStatus("calling");
      setIsMuted(false);
      setIsCameraOff(false);

      callSounds.startOutgoingRingtone();

      // Acquire media streams
      const stream = await webrtc.initLocalMedia(type === "video");
      setLocalStream(stream);

      // Listen for signaling in this chat channel
      webrtc.listenSignaling(targetChatId, async (payload) => {
        if (payload.callId !== newCallId && payload.type !== "call-reject") return;

        if (payload.type === "call-accept") {
          callSounds.stopRingtone();
          setStatus("connecting");
          // If remote sent an answer
          if (payload.sdp) {
            await webrtc.handleAnswer(payload.sdp);
          }
        } else if (payload.type === "call-reject") {
          callSounds.stopRingtone();
          callSounds.playEndTone();
          toast.info(`${targetPeer.name} is busy`);
          logCallEvent(targetChatId, type, "declined");
          resetState();
        } else if (payload.type === "call-end") {
          callSounds.stopRingtone();
          callSounds.playEndTone();
          toast.info("Call ended");
          logCallEvent(targetChatId, type, "completed", duration);
          resetState();
        } else if (payload.type === "ice-candidate" && payload.candidate) {
          await webrtc.handleIceCandidate(payload.candidate);
        }
      });

      // Create RTC offer
      const offer = await webrtc.createOffer();

      // Broadcast call invitation signal
      await webrtc.sendSignal({
        type: "call-invite",
        callId: newCallId,
        chatId: targetChatId,
        caller: currentSelf,
        target: targetPeer,
        callType: type,
        sdp: offer,
      });

      // Simulation timeout fallback for demo/single-browser testing
      // If no real peer responds within 8s, offer a simulated connection or ring until timeout
      if (autoConnectTimerRef.current) clearTimeout(autoConnectTimerRef.current);
      autoConnectTimerRef.current = window.setTimeout(() => {
        if (status === "calling") {
          // Provide gentle prompt or keep ringing
          console.log("[WebRTC] Call ringing... Waiting for peer response.");
        }
      }, 8000);
    } catch (err: any) {
      console.error("[WebRTC] Failed to start call:", err);
      callSounds.stopRingtone();
      toast.error(err.message || "Could not access microphone or camera");
      resetState();
    }
  };

  // Answer incoming call
  const acceptCall = async () => {
    if (!incomingCall) return;
    try {
      callSounds.stopRingtone();
      setStatus("connecting");

      const stream = await webrtc.initLocalMedia(incomingCall.callType === "video");
      setLocalStream(stream);

      if (incomingCall.sdp) {
        const answer = await webrtc.handleOffer(incomingCall.sdp);
        await webrtc.sendSignal({
          type: "call-accept",
          callId: incomingCall.callId,
          chatId: incomingCall.chatId,
          caller: incomingCall.caller,
          target: currentSelf,
          callType: incomingCall.callType,
          sdp: answer,
        });
      }

      setStatus("connected");
      callSounds.playConnectedTone();
    } catch (err: any) {
      console.error("[WebRTC] Error answering call:", err);
      toast.error("Could not connect call");
      rejectCall();
    }
  };

  // Reject incoming call
  const rejectCall = async (reason = "declined") => {
    if (incomingCall) {
      callSounds.stopRingtone();
      callSounds.playEndTone();
      await webrtc.sendSignal({
        type: "call-reject",
        callId: incomingCall.callId,
        chatId: incomingCall.chatId,
        caller: incomingCall.caller,
        target: currentSelf,
        callType: incomingCall.callType,
      });
      logCallEvent(incomingCall.chatId, incomingCall.callType, "declined");
    }
    resetState();
  };

  // End active call
  const endCall = () => {
    callSounds.stopRingtone();
    callSounds.playEndTone();

    if (chatId && callId && peer) {
      webrtc.sendSignal({
        type: "call-end",
        callId,
        chatId,
        caller: currentSelf,
        target: peer,
        callType,
      });
      logCallEvent(chatId, callType, "completed", duration);
    }

    resetState();
  };

  // Toggle microphone
  const toggleMic = () => {
    const active = webrtc.toggleAudio();
    setIsMuted(!active);
  };

  // Toggle camera
  const toggleCamera = () => {
    const active = webrtc.toggleVideo();
    setIsCameraOff(!active);
  };

  // Switch camera between front and back
  const switchCamera = async () => {
    try {
      const stream = await webrtc.switchCamera();
      setLocalStream(stream);
      setIsCameraOff(false);
      toast.info("Camera flipped");
    } catch {
      toast.error("No alternative camera found");
    }
  };

  // Simulate remote answer for instant testing in demo mode
  const simulateAnswer = () => {
    callSounds.stopRingtone();
    callSounds.playConnectedTone();
    setStatus("connected");
    toast.success("Call connected (simulation)");
  };

  const resetState = () => {
    if (autoConnectTimerRef.current) {
      clearTimeout(autoConnectTimerRef.current);
      autoConnectTimerRef.current = null;
    }
    webrtc.cleanup();
    setStatus("idle");
    setChatId(null);
    setCallId(null);
    setPeer(null);
    setDuration(0);
    setLocalStream(null);
    setRemoteStream(null);
    setIncomingCall(null);
    setIsMuted(false);
    setIsCameraOff(false);
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