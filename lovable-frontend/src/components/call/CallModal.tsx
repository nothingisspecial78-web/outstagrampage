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
    facingMode,
    isSwitchingCamera,
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
      localVideoRef.current.play().catch(() => {});
    }
  }, [localStream, status, facingMode]);

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
                <span className="rounded-full bg-paper/15 px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase text-paper/80">
                  {isVideo ? "Video" : "Voice"} Call
                </span>
              </div>
              <p className="flex items-center gap-1.5 text-xs text-paper/70">
                {isConnected ? (
                  <span className="font-mono text-emerald-400 font-semibold">{formatDuration(duration)}</span>
                ) : status === "calling" ? (
                  <span className="animate-pulse text-amber-300 font-medium">Calling…</span>
                ) : (
                  <span className="animate-pulse text-blue-300 font-medium">Connecting…</span>
                )}
                <span className="text-paper/40">•</span>
                <span className="flex items-center gap-1 text-[11px] text-paper/60">
                  <ShieldCheck className="size-3 text-emerald-400" /> End-to-end encrypted
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSpeakerMuted(!speakerMuted)}
              className="text-paper/80 hover:bg-paper/10 hover:text-paper"
              aria-label={speakerMuted ? "Unmute speaker" : "Mute speaker"}
            >
              {speakerMuted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
            </Button>
          </div>
        </header>

        {/* Center Media Area */}
        <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-neutral-950">
          {isVideo ? (
            /* Video Layout */
            <div className="relative h-full w-full">
              {/* Main Remote Video */}
              {isConnected && remoteStream ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  muted={speakerMuted}
                  className="h-full w-full object-cover"
                />
              ) : (
                /* Connecting or Calling Placeholder */
                <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-6 text-center">
                  <div className="relative">
                    <div className="absolute -inset-4 animate-ping rounded-full bg-stamp/20" />
                    {peer?.avatar ? (
                      <img
                        src={peer.avatar}
                        alt=""
                        className="relative size-28 rounded-full border-4 border-sand/30 object-cover shadow-2xl"
                      />
                    ) : (
                      <div className="relative grid size-28 place-items-center rounded-full border-4 border-sand/30 bg-paper/10 font-serif text-4xl text-paper">
                        {peer?.name?.charAt(0) || "O"}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl font-bold text-paper">{peer?.name || "Friend"}</h3>
                    <p className="mt-1 text-sm text-paper/70">
                      {status === "calling" ? "Ringing… Waiting for answer" : "Establishing peer connection…"}
                    </p>
                  </div>
                </div>
              )}

              {/* PiP Local Video Preview */}
              <div
                className={cn(
                  "absolute right-4 bottom-24 z-30 transition-all duration-300 overflow-hidden rounded-xl border border-paper/20 bg-neutral-900 shadow-2xl",
                  pipMinimized ? "h-14 w-20" : "h-36 w-28 sm:h-48 sm:w-36 md:h-52 md:w-40"
                )}
              >
                {isCameraOff ? (
                  <div className="flex h-full w-full flex-col items-center justify-center bg-neutral-900 text-paper/50">
                    <VideoOff className="size-6" />
                    <span className="mt-1 text-[10px]">Camera Off</span>
                  </div>
                ) : (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className={cn(
                      "h-full w-full object-cover transition-transform duration-200",
                      facingMode === "user" ? "scale-x-[-1]" : "scale-x-100"
                    )}
                  />
                )}

                <button
                  type="button"
                  onClick={switchCamera}
                  disabled={isSwitchingCamera}
                  className="absolute top-1.5 left-1.5 rounded-md bg-ink/70 p-1 text-paper/70 hover:text-paper"
                  aria-label="Switch camera"
                  title={facingMode === "user" ? "Switch to Back Camera" : "Switch to Front Camera"}
                >
                  <SwitchCamera className={cn("size-3", isSwitchingCamera && "animate-spin")} />
                </button>

                <button
                  type="button"
                  onClick={() => setPipMinimized(!pipMinimized)}
                  className="absolute top-1.5 right-1.5 rounded-md bg-ink/70 p-1 text-paper/70 hover:text-paper"
                  aria-label="Toggle preview size"
                >
                  <Maximize2 className="size-3" />
                </button>
                <div className="absolute bottom-1 left-2 rounded bg-ink/60 px-1 py-0.5 text-[9px] text-paper/80">
                  You {isMuted && "· Muted"} · {facingMode === "environment" ? "Back" : "Front"}
                </div>
              </div>
            </div>
          ) : (
            /* Voice Call Layout */
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="relative mb-6">
                {isConnected && (
                  <>
                    <div className="absolute -inset-6 animate-pulse rounded-full bg-emerald-500/10 blur-xl" />
                    <div className="absolute -inset-3 animate-ping rounded-full border border-emerald-400/30 duration-1000" />
                  </>
                )}
                {peer?.avatar ? (
                  <img
                    src={peer.avatar}
                    alt=""
                    className="relative size-32 rounded-full border-4 border-paper/20 object-cover shadow-2xl"
                  />
                ) : (
                  <div className="relative grid size-32 place-items-center rounded-full border-4 border-paper/20 bg-sand/20 font-serif text-5xl font-bold text-paper shadow-2xl">
                    {peer?.name?.charAt(0) || "O"}
                  </div>
                )}
              </div>

              <h3 className="font-serif text-3xl font-bold text-paper">{peer?.name || "Friend"}</h3>
              <p className="mt-2 text-base text-paper/70">
                {isConnected ? (
                  <span className="font-mono text-lg font-semibold text-emerald-400">
                    {formatDuration(duration)}
                  </span>
                ) : (
                  <span className="animate-pulse">Calling…</span>
                )}
              </p>

              {/* Hidden audio element for remote stream in voice calls */}
              <audio ref={remoteVideoRef} autoPlay playsInline muted={speakerMuted} />
            </div>
          )}
        </div>

        {/* Bottom Control Bar */}
        <footer className="relative z-20 flex items-center justify-center gap-3 bg-gradient-to-t from-ink via-ink/90 to-transparent px-4 py-5 md:gap-5 md:py-6">
          {/* Mute Microphone */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={toggleMic}
            className={cn(
              "size-12 rounded-full border-2 transition-all shadow-lg",
              isMuted
                ? "border-rose-500 bg-rose-600/90 text-white hover:bg-rose-700"
                : "border-paper/30 bg-paper/15 text-paper hover:bg-paper/25"
            )}
            aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
          >
            {isMuted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
          </Button>

          {/* Toggle Video (if Video call) */}
          {isVideo && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={toggleCamera}
              className={cn(
                "size-12 rounded-full border-2 transition-all shadow-lg",
                isCameraOff
                  ? "border-rose-500 bg-rose-600/90 text-white hover:bg-rose-700"
                  : "border-paper/30 bg-paper/15 text-paper hover:bg-paper/25"
              )}
              aria-label={isCameraOff ? "Turn on camera" : "Turn off camera"}
            >
              {isCameraOff ? <VideoOff className="size-5" /> : <Video className="size-5" />}
            </Button>
          )}

          {/* Flip / Switch Camera (if Video call) */}
          {isVideo && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={switchCamera}
              disabled={isSwitchingCamera}
              className={cn(
                "size-12 rounded-full border-2 border-paper/30 bg-paper/15 text-paper hover:bg-paper/25 shadow-lg relative transition-all",
                isSwitchingCamera && "opacity-75",
                facingMode === "environment" && "border-stamp bg-stamp/20 text-stamp-glow"
              )}
              aria-label={`Switch camera, currently ${facingMode === "user" ? "front camera" : "back camera"}`}
              title={facingMode === "user" ? "Switch to Back Camera" : "Switch to Front Camera"}
            >
              <SwitchCamera className={cn("size-5", isSwitchingCamera && "animate-spin")} />
              {facingMode === "environment" && (
                <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-stamp" />
              )}
            </Button>
          )}

          {/* End Call Button */}
          <Button
            type="button"
            variant="destructive"
            size="icon"
            onClick={endCall}
            className="size-14 rounded-full bg-rose-600 text-white shadow-xl hover:bg-rose-700 hover:scale-105 active:scale-95 transition-transform"
            aria-label="End call"
          >
            <PhoneOff className="size-6" />
          </Button>
        </footer>
      </div>
    </div>
  );
}
