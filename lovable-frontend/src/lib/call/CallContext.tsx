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
import { supabase } from "@/lib/supabase";

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
  const ringTimeoutRef = useRef<number | null>(null);
  const autoConnectTimerRef = useRef<number | null>(null);
  const callStartTimeRef = useRef<number | null>(null);

  // Self identity
  const currentSelf: CallPeerInfo = {
    id: session?.id || session?.email || "self_user",
    name: session?.name || "Member",
    avatar: "",
  };

  // Dedicated incoming call listener on the logged-in user's personal channel(s)
  useEffect(() => {
    const rawIds = [
      session?.id,
      session?.email,
      session?.friendCode,
      session?.name,
    ].filter(Boolean) as string[];

    if (rawIds.length === 0) return;

    const uniqueClean = Array.from(
      new Set(rawIds.map((id) => id.replace(/[^a-zA-Z0-9_-]/g, "_")))
    );

    const channels = uniqueClean.map((cleanId) => {
      const channelName = `user_call_${cleanId}`;
      const ch = supabase.channel(channelName, {
        config: { broadcast: { self: false } },
      });

      ch.on("broadcast", { event: "call_invite" }, ({ payload }) => {
        console.log(`[CallContext] Incoming call invite on ${channelName}:`, payload);
        if (status !== "idle") {
          const roomId = payload.roomId || `call_room_${payload.callId}`;
          webrtc.sendSignalToChannel(roomId, "call_reject", {
            ...payload,
            from: currentSelf,
            reason: "busy",
          });
          return;
        }
        setIncomingCall(payload as SignalingPayload);
        callSounds.startIncomingRingtone();
      });

      ch.subscribe();
      return ch;
    });

    return () => {
      channels.forEach((ch) => {
        try {
          supabase.removeChannel(ch);
        } catch {}
      });
    };
  }, [session?.id, session?.email, session?.friendCode, session?.name, status, currentSelf]);

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

      if (event === "call_invite") {
        if (status !== "idle") {
          const roomId = payload.roomId || `call_room_${payload.callId}`;
          await webrtc.sendSignalToChannel(roomId, "call_reject", {
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

      // Check callId match for active session
      if (callId && payload.callId !== callId) return;

      if (event === "call_accept") {
        // Peer accepted! Initiate WebRTC offer
        callSounds.stopRingtone();
        if (ringTimeoutRef.current) {
          clearTimeout(ringTimeoutRef.current);
          ringTimeoutRef.current = null;
        }

        setStatus("connecting");
        try {
          const callRoom = payload.roomId || `call_room_${payload.callId}`;
          const pc = webrtc.createPeerConnection((candidate) => {
            webrtc.sendSignal("webrtc_ice_candidate", {
              callId: payload.callId,
              roomId: callRoom,
              chatId: payload.chatId,
              from: currentSelf,
              type: payload.type,
              candidate,
            });
          });

          const offer = await webrtc.createOffer();
          await webrtc.sendSignal("webrtc_offer", {
            callId: payload.callId,
            roomId: callRoom,
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
          const callRoom = payload.roomId || `call_room_${payload.callId}`;
          const answer = await webrtc.handleOffer(payload.sdp!);
          await webrtc.sendSignal("webrtc_answer", {
            callId: payload.callId,
            roomId: callRoom,
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

  // Start outgoing call to peer
  const startCall = async (targetChatId: string, targetPeer: CallPeerInfo, type: CallType) => {
    try {
      cleanupCall();

      const newCallId = `call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const callRoom = `call_room_${newCallId}`;
      setChatId(targetChatId);
      setCallId(newCallId);
      setPeer(targetPeer);
      setCallType(type);
      setStatus("calling");
      setIsMuted(false);
      setIsCameraOff(false);

      // Subscribe caller to the dedicated call room for WebRTC negotiation
      webrtc.subscribeSignaling(callRoom, handleSignal);

      // Acquire local media
      const stream = await webrtc.getLocalMedia(type);
      setLocalStream(stream);

      // Start outgoing ringtone
      callSounds.startOutgoingRingtone();

      const invitePayload: SignalingPayload = {
        callId: newCallId,
        chatId: targetChatId,
        roomId: callRoom,
        from: currentSelf,
        to: targetPeer,
        type,
      };

      // 1. Dispatch invite directly to peer's personal user channel
      const targetUserId = (targetPeer.id || "").replace(/[^a-zA-Z0-9_-]/g, "_");
      if (targetUserId) {
        await webrtc.sendSignalToChannel(`user_call_${targetUserId}`, "call_invite", invitePayload);
      }
      const cleanPeerName = (targetPeer.name || "").replace(/[^a-zA-Z0-9_-]/g, "_");
      if (cleanPeerName && cleanPeerName !== targetUserId) {
        await webrtc.sendSignalToChannel(`user_call_${cleanPeerName}`, "call_invite", invitePayload);
      }

      // 2. Also dispatch to chat channel for fallback
      const cleanChatId = targetChatId.replace(/[^a-zA-Z0-9_-]/g, "_");
      if (cleanChatId && cleanChatId !== targetUserId && cleanChatId !== cleanPeerName) {
        await webrtc.sendSignalToChannel(`user_call_${cleanChatId}`, "call_invite", invitePayload);
        await webrtc.sendSignalToChannel(`call_${cleanChatId}`, "call_invite", invitePayload);
      }

      // 3. Ring timeout (35 seconds) - NO simulated auto answer!
      ringTimeoutRef.current = window.setTimeout(() => {
        setStatus((curr) => {
          if (curr === "calling") {
            callSounds.stopRingtone();
            callSounds.playEndTone();
            toast.info(`${targetPeer.name || "User"} did not answer.`);
            cleanupCall();
          }
          return curr;
        });
      }, 35000);
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
      const callRoom = incoming.roomId || `call_room_${incoming.callId}`;
      webrtc.subscribeSignaling(callRoom, handleSignal);

      // Callee acquires local media
      const stream = await webrtc.getLocalMedia(incoming.type);
      setLocalStream(stream);

      // Callee creates RTCPeerConnection
      webrtc.createPeerConnection((candidate) => {
        webrtc.sendSignal("webrtc_ice_candidate", {
          callId: incoming.callId,
          roomId: callRoom,
          chatId: incoming.chatId,
          from: currentSelf,
          type: incoming.type,
          candidate,
        });
      });

      // Callee sends call_accept signal
      await webrtc.sendSignal("call_accept", {
        callId: incoming.callId,
        roomId: callRoom,
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
      const callRoom = incomingCall.roomId || `call_room_${incomingCall.callId}`;
      await webrtc.sendSignalToChannel(callRoom, "call_reject", {
        ...incomingCall,
        from: currentSelf,
        reason,
      });
      setIncomingCall(null);
    }
    cleanupCall();
  };

  // Simulate answer for unit testing only
  const simulateAnswer = () => {
    if (ringTimeoutRef.current) {
      clearTimeout(ringTimeoutRef.current);
      ringTimeoutRef.current = null;
    }
    callSounds.stopRingtone();
    setStatus("connected");
    callSounds.playConnectedTone();
  };

  // End active call
  const endCall = () => {
    if (ringTimeoutRef.current) {
      clearTimeout(ringTimeoutRef.current);
      ringTimeoutRef.current = null;
    }
    callSounds.stopRingtone();
    callSounds.playEndTone();

    if (callId) {
      webrtc.sendSignal("call_end", {
        callId,
        chatId: chatId || "chat",
        from: currentSelf,
        type: callType,
      });

      if (chatId && duration > 0) {
        logCallEvent(chatId, callType, "completed", duration);
      } else if (chatId) {
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
    if (ringTimeoutRef.current !== null) {
      clearTimeout(ringTimeoutRef.current);
      ringTimeoutRef.current = null;
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
