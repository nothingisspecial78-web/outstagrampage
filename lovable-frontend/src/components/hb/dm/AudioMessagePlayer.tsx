import React, { useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

interface AudioMessagePlayerProps {
  audioUrl: string;
  duration?: number;
  mine?: boolean;
}

export function AudioMessagePlayer({ audioUrl, duration = 0, mine = false }: AudioMessagePlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && audio.duration !== Infinity) {
        setAudioDuration(Math.round(audio.duration));
      }
    };

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.pause();
    };
  }, [audioUrl]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = Math.floor(secs % 60);
    return `${mins}:${rem.toString().padStart(2, "0")}`;
  };

  const progress = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

  return (
    <div className="flex min-w-[210px] sm:min-w-[240px] items-center gap-3 py-1">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-full transition-transform hover:scale-105 active:scale-95 shadow-sm",
          mine
            ? "bg-paper text-stamp-ink hover:bg-paper/90"
            : "bg-stamp text-primary-foreground hover:bg-stamp-ink"
        )}
        aria-label={isPlaying ? "Pause voice message" : "Play voice message"}
      >
        {isPlaying ? <Pause className="size-4 fill-current" /> : <Play className="ml-0.5 size-4 fill-current" />}
      </button>

      {/* Waveform and Progress */}
      <div className="flex flex-1 flex-col justify-center gap-1.5">
        <div className="relative flex h-5 items-center gap-0.5 overflow-hidden">
          {/* Static styled waveform bars */}
          {[40, 70, 30, 90, 60, 100, 45, 80, 50, 75, 35, 85, 60, 95, 40, 70, 55, 90, 30, 65, 80, 45, 60, 35].map(
            (heightPct, idx) => {
              const barProgress = (idx / 24) * 100;
              const isFilled = progress >= barProgress;
              return (
                <div
                  key={idx}
                  className={cn(
                    "w-1 rounded-full transition-colors",
                    mine
                      ? isFilled
                        ? "bg-paper"
                        : "bg-paper/40"
                      : isFilled
                      ? "bg-stamp-ink"
                      : "bg-sand"
                  )}
                  style={{ height: `${heightPct}%` }}
                />
              );
            }
          )}
        </div>

        {/* Timestamp */}
        <div className="flex justify-between text-[10px] font-mono opacity-80">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(audioDuration || duration)}</span>
        </div>
      </div>
    </div>
  );
}