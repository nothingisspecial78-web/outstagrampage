import React, { useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react";
import { cn } from "@/lib/utils";

interface MediaPostPlayerProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  loop?: boolean;
  className?: string;
}

export function MediaPostPlayer({
  src,
  poster,
  autoPlay = false,
  loop = true,
  className,
}: MediaPostPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const total = videoRef.current.duration || 1;
    setProgress((current / total) * 100);
  };

  const handleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  return (
    <div
      onClick={togglePlay}
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-[2px] bg-black select-none",
        className
      )}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        loop={loop}
        muted={isMuted}
        playsInline
        onTimeUpdate={handleTimeUpdate}
        className="h-full w-full object-cover"
      />

      {/* Progress Bar along bottom */}
      <div className="absolute right-0 bottom-0 left-0 h-1 bg-black/40">
        <div
          className="h-full bg-stamp transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Floating Center Play/Pause Indicator (fades on hover / state) */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
          <span className="grid size-12 place-items-center rounded-full bg-paper/90 text-ink shadow-lg transition-transform group-hover:scale-110">
            <Play className="ml-0.5 size-6 fill-ink" />
          </span>
        </div>
      )}

      {/* Overlay Quick Controls */}
      <div className="absolute right-2 bottom-2 flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={toggleMute}
          className="rounded-full bg-black/60 p-1.5 text-paper hover:bg-black/80"
          aria-label={isMuted ? "Unmute audio" : "Mute audio"}
        >
          {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
        </button>

        <button
          type="button"
          onClick={handleFullscreen}
          className="rounded-full bg-black/60 p-1.5 text-paper hover:bg-black/80"
          aria-label="Fullscreen"
        >
          <Maximize className="size-4" />
        </button>
      </div>
    </div>
  );
}