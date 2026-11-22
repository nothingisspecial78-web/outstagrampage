import React, { useRef, useState, useEffect, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface MediaPostPlayerProps {
  src: string;
  poster?: string;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
  isActive?: boolean;
}

export function MediaPostPlayer({
  src,
  poster,
  className,
  autoPlay = false,
  loop = true,
  isActive,
}: MediaPostPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerIdRef = useRef<string>(Math.random().toString(36).substring(2, 9));

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [videoSrc, setVideoSrc] = useState<string>(src);

  // Convert raw base64 data URLs to streamable Blob URLs for mobile browsers (iOS WebKit & Android Chrome)
  useEffect(() => {
    let active = true;
    let createdUrl: string | null = null;

    if (src && src.startsWith("data:video")) {
      try {
        const parts = src.split(",");
        const mime = parts[0]?.match(/:(.*?);/)?.[1] || "video/webm";
        const bstr = atob(parts[1] || "");
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        createdUrl = URL.createObjectURL(blob);
        if (active) {
          setVideoSrc(createdUrl);
          setHasError(false);
        }
      } catch {
        if (active) setVideoSrc(src);
      }
    } else {
      if (active) {
        setVideoSrc(src);
        setHasError(false);
      }
    }

    return () => {
      active = false;
      if (createdUrl) {
        try {
          URL.revokeObjectURL(createdUrl);
        } catch {}
      }
    };
  }, [src]);

  const hideTimeoutRef = useRef<number | null>(null);

  // Helper to safely pause and mute
  const stopPlayback = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      try {
        video.pause();
      } catch {}
      video.muted = true;
    }
    setIsPlaying(false);
    setIsMuted(true);
  }, []);

  // 1. Direct active state management (e.g. from parent horizontal carousel or feed)
  useEffect(() => {
    if (isActive === false) {
      stopPlayback();
    }
  }, [isActive, stopPlayback]);

  // 2. Global media coordinator: pause this video if another media/video starts playing
  useEffect(() => {
    const handleOtherMediaPlay = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.id !== playerIdRef.current) {
        stopPlayback();
      }
    };

    window.addEventListener("outstagram:media-play", handleOtherMediaPlay);
    return () => {
      window.removeEventListener("outstagram:media-play", handleOtherMediaPlay);
    };
  }, [stopPlayback]);

  // 3. Tab visibility / Page hide / Window blur
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPlayback();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handleVisibilityChange);
    };
  }, [stopPlayback]);

  // 4. Viewport IntersectionObserver: automatically pause and mute when scrolled out of view
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (typeof window !== "undefined" && "IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            // When less than 45% of the video is visible or off-screen, pause and mute immediately
            if (!entry.isIntersecting || entry.intersectionRatio < 0.45) {
              stopPlayback();
            }
          }
        },
        {
          threshold: [0, 0.25, 0.45, 0.75, 1.0],
        }
      );

      observer.observe(container);
      return () => {
        observer.disconnect();
      };
    }
    return undefined;
  }, [stopPlayback]);

  // 5. Scroll listener fallback for horizontal/vertical overflow containers
  useEffect(() => {
    const checkBoundingVisibility = () => {
      const container = containerRef.current;
      if (!container || !videoRef.current) return;

      const rect = container.getBoundingClientRect();
      const windowHeight = window.innerHeight || document.documentElement.clientHeight;
      const windowWidth = window.innerWidth || document.documentElement.clientWidth;

      // Calculate visible area relative to viewport
      const visibleWidth = Math.max(0, Math.min(rect.right, windowWidth) - Math.max(rect.left, 0));
      const visibleHeight = Math.max(0, Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0));
      const visibleArea = visibleWidth * visibleHeight;
      const totalArea = rect.width * rect.height;

      // If less than 40% visible or off-screen, stop sound and playback immediately
      if (totalArea > 0 && visibleArea / totalArea < 0.4) {
        stopPlayback();
      }
    };

    window.addEventListener("scroll", checkBoundingVisibility, { passive: true, capture: true });
    return () => {
      window.removeEventListener("scroll", checkBoundingVisibility, { capture: true });
    };
  }, [stopPlayback]);

  // Video element events
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
      // Notify other media players
      window.dispatchEvent(
        new CustomEvent("outstagram:media-play", { detail: { id: playerIdRef.current } })
      );
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

    if (autoPlay && (isActive === undefined || isActive === true)) {
      video.muted = true;
      setIsMuted(true);
      try {
        const p = video.play();
        if (p && typeof p.catch === "function") {
          p.catch(() => {
            // Browser prevented autoplay
          });
        }
      } catch {}
    }

    return () => {
      try {
        video.pause();
      } catch {}
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onEnded);
    };
  }, [src, autoPlay, isActive]);

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
      window.dispatchEvent(
        new CustomEvent("outstagram:media-play", { detail: { id: playerIdRef.current } })
      );
      try {
        const p = video.play();
        if (p && typeof p.catch === "function") {
          p.catch((e) => console.warn("Video play error:", e));
        }
      } catch {}
    } else {
      try {
        video.pause();
      } catch {}
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

    // If unmuting, notify other players so only one sound source plays
    if (!newMuted) {
      window.dispatchEvent(
        new CustomEvent("outstagram:media-play", { detail: { id: playerIdRef.current } })
      );
    }
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
      className={cn("group relative overflow-hidden bg-sand/20 select-none", className)}
    >
      <video
        ref={videoRef}
        src={videoSrc}
        poster={poster}
        loop={loop}
        muted={isMuted}
        playsInline
        onClick={togglePlay}
        onError={() => setHasError(true)}
        className="h-full w-full object-cover cursor-pointer"
      />

      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-900/90 p-4 text-center text-paper-raised">
          <RotateCcw className="mb-2 size-8 text-stamp animate-bounce" />
          <p className="text-xs font-semibold">Video preview ready</p>
          <button
            type="button"
            onClick={togglePlay}
            className="mt-2 rounded-lg bg-stamp px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-stamp/90"
          >
            Play Video
          </button>
        </div>
      )}

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
