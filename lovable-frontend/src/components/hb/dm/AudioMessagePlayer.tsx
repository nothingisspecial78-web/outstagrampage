import React, { useState, useRef, useEffect } from "react";
import { Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AudioMessagePlayerProps {
  audioUrl: string;
  duration?: number | undefined;
  mine: boolean;
}

export function AudioMessagePlayer({ audioUrl, duration = 0, mine }: AudioMessagePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setTotalDuration(Math.round(audio.duration));
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
      try {
        audio.pause();
      } catch {}
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audioRef.current = null;
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.warn("Audio playback failed:", err));
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = parseFloat(e.target.value);
    setCurrentTime(seekTime);
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
    }
  };

  const formatTime = (secs: number) => {
    const s = Math.max(0, Math.floor(secs));
    const mins = Math.floor(s / 60);
    const rem = s % 60;
    return `${mins}:${rem.toString().padStart(2, "0")}`;
  };

  const effectiveDuration = totalDuration || duration || 1;

  return (
    <div className="flex w-52 sm:w-60 items-center gap-2 py-0.5">
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={togglePlay}
        className={cn(
          "size-8 shrink-0 rounded-full",
          mine
            ? "bg-paper/20 text-paper hover:bg-paper/30"
            : "bg-stamp/15 text-stamp-ink hover:bg-stamp/25"
        )}
        aria-label={isPlaying ? "Pause audio" : "Play audio"}
      >
        {isPlaying ? <Pause className="size-4 fill-current" /> : <Play className="size-4 fill-current ml-0.5" />}
      </Button>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="relative flex items-center">
          <input
            type="range"
            min={0}
            max={effectiveDuration}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-black/15 accent-stamp focus:outline-none"
            aria-label="Seek audio"
          />
        </div>

        <div className="flex items-center justify-between gap-1 text-[10px] tabular-nums font-mono">
          <span className={mine ? "text-paper/90" : "text-ink-muted"}>
            {formatTime(currentTime)}
          </span>
          <span className={mine ? "text-paper/70" : "text-ink-muted"}>
            {formatTime(effectiveDuration)}
          </span>
        </div>
      </div>
    </div>
  );
}
