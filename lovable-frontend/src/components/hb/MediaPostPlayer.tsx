import React, { useRef, useState, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MediaPostPlayerProps {
  src: string;
  poster?: string;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
}

export function MediaPostPlayer({
  src,
  poster,
  className,
  autoPlay = false,
  loop = true,
}: MediaPostPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [isEnded, setIsEnded] = useState(false);

  const hideTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onLoadedMetadata = () => {
      setDuration(video.duration || 0);
    };

    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const onPlay = () => {
      setIsPlaying(true);
      setIsEnded(false);
    };

    const onPause = () => {
      setIsPlaying(false);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setIsEnded(true);
    };

    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onEnded);

    if (autoPlay) {
      video.play().catch(() => {
        // Browser prevented autoplay
      });
    }

    return () => {
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onEnded);
    };
  }, [src, autoPlay]);

  const resetHideTimer = () => {
    setShowControls(true);
    if (hideTimeoutRef.current !== null) {
      clearTimeout(hideTimeoutRef.current);
    }
    if (isPlaying) {
      hideTimeoutRef.current = window.setTimeout(() => {
        setShowControls(false);
      }, 2500);
    }
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused || video.ended) {
      video.play().catch((e) => console.warn("Video play error:", e));
    } else {
      video.pause();
    }
    resetHideTimer();
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    const newMuted = !video.muted;
    video.muted = newMuted;
    setIsMuted(newMuted);
    resetHideTimer();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    const seekTime = parseFloat(e.target.value);
    video.currentTime = seekTime;
    setCurrentTime(seekTime);
    resetHideTimer();
  };

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const formatTime = (secs: number) => {
    const s = Math.max(0, Math.floor(secs));
    const mins = Math.floor(s / 60);
    const rem = s % 60;
    return `${mins}:${rem.toString().padStart(2, "0")}`;
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={resetHideTimer}
      onTouchStart={resetHideTimer}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className={cn("group relative overflow-hidden bg-black select-none", className)}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        loop={loop}
        muted={isMuted}
        playsInline
        onClick={togglePlay}
        className="h-full w-full object-cover cursor-pointer"
      />

      {/* Big Center Play / Replay Overlay Button when paused */}
      {(!isPlaying || isEnded) && (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/25 transition-opacity hover:bg-black/35"
          aria-label={isEnded ? "Replay video" : "Play video"}
        >
          <div className="flex size-14 items-center justify-center rounded-full bg-paper/90 text-ink shadow-lg transition-transform hover:scale-110 active:scale-95">
            {isEnded ? <RotateCcw className="size-6" /> : <Play className="size-6 fill-current ml-0.5" />}
          </div>
        </button>
      )}

      {/* Top Right Quick Mute Pill */}
      <button
        type="button"
        onClick={toggleMute}
        className="absolute top-3 right-3 z-10 flex size-8 items-center justify-center rounded-full bg-ink/70 text-paper/90 backdrop-blur-sm transition hover:bg-ink hover:text-paper"
        aria-label={isMuted ? "Unmute video" : "Mute video"}
      >
        {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
      </button>

      {/* Bottom Control Bar */}
      <div
        className={cn(
          "absolute right-0 bottom-0 left-0 z-20 flex flex-col bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-6 transition-opacity duration-300",
          showControls || !isPlaying ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        {/* Scrubber slider */}
        <div className="relative mb-2 flex items-center">
          <input
            type="range"
            min={0}
            max={duration || 1}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/30 accent-stamp hover:bg-white/50 focus:outline-none"
            aria-label="Seek video position"
          />
        </div>

        {/* Control bar buttons */}
        <div className="flex items-center justify-between text-xs text-white">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePlay}
              className="flex size-7 items-center justify-center rounded-full hover:bg-white/20"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="size-4 fill-current" /> : <Play className="size-4 fill-current ml-0.5" />}
            </button>

            <span className="font-mono text-[11px] tabular-nums text-white/90">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleMute}
              className="flex size-7 items-center justify-center rounded-full hover:bg-white/20"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="flex size-7 items-center justify-center rounded-full hover:bg-white/20"
              aria-label="Fullscreen"
            >
              <Maximize className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
