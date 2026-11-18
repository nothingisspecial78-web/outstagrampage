import React, { useRef, useState } from "react";
import { Mic, Square, Trash2, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceRecorderProps {
  onSend: (audioUrl: string, duration: number) => void;
  className?: string;
}

export function VoiceRecorder({ onSend, className }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        alert("Audio recording is not supported in this browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access failed:", err);
      alert("Please allow microphone permissions to send voice messages.");
    }
  };

  const cancelRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const rec = mediaRecorderRef.current;
    if (rec && rec.state !== "inactive") {
      rec.stop();
      rec.stream.getTracks().forEach((track) => track.stop());
    }
    setIsRecording(false);
    setRecordingSeconds(0);
    chunksRef.current = [];
  };

  const finishAndSend = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const rec = mediaRecorderRef.current;
    const duration = recordingSeconds;

    if (rec && rec.state !== "inactive") {
      rec.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        const audioUrl = URL.createObjectURL(audioBlob);
        rec.stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);
        setRecordingSeconds(0);
        onSend(audioUrl, duration);
      };
      rec.stop();
    }
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}:${rem.toString().padStart(2, "0")}`;
  };

  if (isRecording) {
    return (
      <div className={cn("flex flex-1 items-center gap-2 px-2 animate-in fade-in", className)}>
        {/* Blinking recording indicator */}
        <span className="relative flex size-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
          <span className="relative inline-flex size-3 rounded-full bg-rose-600" />
        </span>

        {/* Live timer */}
        <span className="font-mono text-xs font-semibold text-rose-600 tabular-nums">
          {formatTimer(recordingSeconds)}
        </span>

        {/* Waveform indicator */}
        <div className="flex flex-1 items-center gap-0.5 px-2">
          {[20, 50, 80, 40, 90, 60, 30, 70, 100, 50, 30].map((h, i) => (
            <span
              key={i}
              className="w-1 rounded-full bg-rose-500/70 animate-pulse"
              style={{
                height: `${h}%`,
                animationDelay: `${i * 100}ms`,
                minHeight: "4px",
                maxHeight: "18px",
              }}
            />
          ))}
        </div>

        {/* Cancel button */}
        <button
          type="button"
          onClick={cancelRecording}
          className="rounded-full p-1.5 text-ink-muted hover:bg-line hover:text-rose-600"
          aria-label="Discard recording"
        >
          <Trash2 className="size-4" />
        </button>

        {/* Send voice button */}
        <button
          type="button"
          onClick={finishAndSend}
          className="grid size-8 place-items-center rounded-full bg-stamp text-primary-foreground hover:bg-stamp-ink shadow-sm"
          aria-label="Send voice message"
        >
          <Send className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={startRecording}
      className={cn("text-ink hover:text-stamp-ink transition-colors", className)}
      aria-label="Record voice message"
    >
      <Mic className="size-5" />
    </button>
  );
}