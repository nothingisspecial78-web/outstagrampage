import React, { useEffect, useRef, useState } from "react";
import { useCall } from "@/lib/call/CallContext";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  SwitchCamera,
  Volume2,
  VolumeX,
  Maximize2,
  Sparkles,
  ShieldCheck,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CallModal() {
  const {
    status,
    callType,
    peer,
    isMuted,
    isCameraOff,
    duration,
    localStream,
    remoteStream,
    toggleMic,
    toggleCamera,
    switchCamera,
    endCall,
    simulateAnswer,
  } = useCall();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [speakerMuted, setSpeakerMuted] = useState(false);
  const [pipMinimized, setPipMinimized] = useState(false);

  // Attach local stream to local preview
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, status]);

  // Attach remote stream to remote video
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, status]);

  // Do not render if idle or only receiving incoming call (incoming call has its own dialog)
  if (status === "idle" || status === "ringing") {
    return null;
  }

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${rem.toString().padStart(2, "0")}`;
  };

  const isConnected = status === "connected";
  const isVideo = callType === "video";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${isVideo ? "Video" : "Voice"} call with ${peer?.name || "Friend"}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90 p-2 sm:p-4 md:p-6 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative flex h-full max-h-[860px] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-sand/20 bg-ink text-paper shadow-2xl">
        {/* Top Header Bar */}
        <header className="absolute top-0 right-0 left-0 z-20 flex items-center justify-between bg-gradient-to-b from-ink/90 via-ink/60 to-transparent px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              {peer?.avatar ? (
                <img
                  src={peer.avatar}
                  alt={peer.name}
                  className="size-11 rounded-full border-2 border-paper/40 object-cover shadow"
                />
              ) : (
                <div className="grid size-11 place-items-center rounded-full border-2 border-paper/40 bg-sand/30 font-semibold text-paper">
                  {peer?.name?.charAt(0) || <User className="size-5" />}
                </div>
              )}
              {isConnected && (
                <span className="absolute right-0 bottom-0 size-3 rounded-full border-2 border-ink bg-emerald-500" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-lg font-bold text-paper md:text-xl">{peer?.name || "Friend"}</h2>
                <span className="hidden items-center gap-1 rounded-full bg-sand/20 px-2 py-0.5 text-[10px] font-semibold text-paper/80 sm:inline-flex">
                  <ShieldCheck className="size-3 text-emerald-400" /> Peer-to-Peer
                </span>
              </div>
              <p className="text-xs text-paper/70 font-mono">
                {status === "calling"
                  ? "Calling…"
                  : isConnected
                  ? `${isVideo ? "Video" : "Audio"} · ${formatDuration(duration)}`
                  : "Connecting…"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Demo Simulator for Testing if calling */}
            {status === "calling" && (
              <Button
                size="sm"
                variant="outline"
                onClick={simulateAnswer}
                className="border-sand/40 bg-sand/20 text-xs text-paper hover:bg-sand/30"
              >
                <Sparkles className="mr-1 size-3 text-amber-300" /> Simulate Answer
              </Button>
            )}

            <Button
              size="icon"
              variant="ghost"
              onClick={() => setSpeakerMuted((v) => !v)}
              className="text-paper/80 hover:bg-sand/20 hover:text-paper"
              aria-label={speakerMuted ? "Unmute speaker" : "Mute speaker"}
            >
              {speakerMuted ? <VolumeX className="size-5 text-rose-400" /> : <Volume2 className="size-5" />}
            </Button>
          </div>
        </header>

        {/* Call Body: Video canvas or audio representation */}
        <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-gradient-to-b from-stone-900 via-stone-950 to-black">
          {isVideo ? (
            /* Video Mode */
            <div className="relative h-full w-full">
              {/* Remote Video Stream or Avatar Placeholder */}
              {isConnected && remoteStream ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  muted={speakerMuted}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-4 text-center p-6">
                  <div className="relative">
                    <img
                      src={peer?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"}
                      alt=""
                      className="size-32 rounded-full border-4 border-sand/30 object-cover shadow-2xl animate-pulse"
                    />
                    <div className="absolute inset-0 rounded-full ring-4 ring-stamp/40 animate-ping" />
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl font-bold text-paper">{peer?.name}</h3>
                    <p className="text-sm text-paper/70 mt-1">
                      {status === "calling" ? "Waiting for friend to answer…" : "Connecting peer stream…"}
                    </p>
                  </div>
                </div>
              )}

              {/* Local Video Picture-in-Picture (PiP) */}
              {!isCameraOff && (
                <div
                  className={cn(
                    "absolute z-30 overflow-hidden rounded-xl border border-sand/40 bg-ink shadow-2xl transition-all duration-200",
                    pipMinimized
                      ? "bottom-24 right-4 h-20 w-16"
                      : "bottom-24 right-4 h-44 w-32 sm:h-52 sm:w-36 md:bottom-28 md:right-6 md:h-56 md:w-40"
                  )}
                >
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-full w-full object-cover -scale-x-100"
                  />
                  <button
                    onClick={() => setPipMinimized((m) => !m)}
                    className="absolute top-1.5 right-1.5 rounded-full bg-ink/70 p-1 text-paper/90 hover:bg-ink"
                    aria-label="Toggle preview size"
                  >
                    <Maximize2 className="size-3.5" />
                  </button>
                  <div className="absolute bottom-1 left-2 text-[10px] font-semibold text-paper/80 bg-ink/50 px-1.5 py-0.5 rounded">
                    You
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Audio Mode */
            <div className="flex flex-col items-center justify-center gap-6 p-6 text-center">
              <div className="relative">
                <div className="size-40 rounded-full border-4 border-sand/40 bg-sand/10 p-2 shadow-2xl sm:size-48">
                  {peer?.avatar ? (
                    <img
                      src={peer.avatar}
                      alt={peer.name}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center rounded-full bg-sand/30 text-5xl font-bold text-paper">
                      {peer?.name?.charAt(0) || "F"}
                    </div>
                  )}
                </div>
                {isConnected && (
                  <div className="absolute -inset-2 rounded-full border-2 border-emerald-400/50 animate-pulse pointer-events-none" />
                )}
              </div>

              <div>
                <h3 className="font-serif text-3xl font-bold text-paper">{peer?.name}</h3>
                <p className="mt-2 text-sm font-mono text-paper/80">
                  {status === "calling"
                    ? "Calling via Outstagram Voice…"
                    : isConnected
                    ? `Connected · ${formatDuration(duration)}`
                    : "Connecting…"}
                </p>
                {isMuted && (
                  <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-3 py-1 text-xs font-semibold text-rose-300">
                    <MicOff className="size-3" /> Microphone is muted
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Call Controls Floating Toolbar */}
        <footer className="relative z-20 flex items-center justify-center gap-3 border-t border-sand/20 bg-ink/95 px-4 py-4 md:gap-5 md:py-5">
          {/* Mute Microphone Button */}
          <Button
            size="icon"
            variant="ghost"
            onClick={toggleMic}
            className={cn(
              "size-12 rounded-full border transition-transform hover:scale-105 active:scale-95 sm:size-14",
              isMuted
                ? "border-rose-500/60 bg-rose-500/20 text-rose-400 hover:bg-rose-500/30"
                : "border-sand/40 bg-sand/20 text-paper hover:bg-sand/30"
            )}
            aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
          >
            {isMuted ? <MicOff className="size-5 sm:size-6" /> : <Mic className="size-5 sm:size-6" />}
          </Button>

          {/* Toggle Camera Button (Video Call only) */}
          {isVideo && (
            <Button
              size="icon"
              variant="ghost"
              onClick={toggleCamera}
              className={cn(
                "size-12 rounded-full border transition-transform hover:scale-105 active:scale-95 sm:size-14",
                isCameraOff
                  ? "border-rose-500/60 bg-rose-500/20 text-rose-400 hover:bg-rose-500/30"
                  : "border-sand/40 bg-sand/20 text-paper hover:bg-sand/30"
              )}
              aria-label={isCameraOff ? "Turn on camera" : "Turn off camera"}
            >
              {isCameraOff ? (
                <VideoOff className="size-5 sm:size-6" />
              ) : (
                <Video className="size-5 sm:size-6" />
              )}
            </Button>
          )}

          {/* Switch Camera Button (Front/Rear, Video Call only) */}
          {isVideo && (
            <Button
              size="icon"
              variant="ghost"
              onClick={switchCamera}
              className="size-12 rounded-full border border-sand/40 bg-sand/20 text-paper transition-transform hover:scale-105 hover:bg-sand/30 active:scale-95 sm:size-14"
              aria-label="Flip camera"
            >
              <SwitchCamera className="size-5 sm:size-6" />
            </Button>
          )}

          {/* End Call Button (Big Red Button) */}
          <Button
            size="icon"
            onClick={endCall}
            className="size-12 rounded-full bg-rose-600 text-white shadow-lg transition-transform hover:scale-105 hover:bg-rose-700 active:scale-95 sm:size-14"
            aria-label="End call"
          >
            <PhoneOff className="size-6 sm:size-7" />
          </Button>
        </footer>
      </div>
    </div>
  );
}