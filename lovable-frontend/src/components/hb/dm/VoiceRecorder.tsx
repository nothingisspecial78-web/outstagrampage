import React, { useState, useRef, useEffect } from "react";
import { Mic, Trash2, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface VoiceRecorderProps {
  onSend: (audioUrl: string, duration: number) => void;
  onCancel?: () => void;
}

export function VoiceRecorder({ onSend, onCancel }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      stopAndCleanup();
    };
  }, []);

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        toast.error("Audio recording is not supported in this browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      const mimeTypes = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg", "audio/mp4"];
      const mimeType = mimeTypes.find((type) => MediaRecorder.isTypeSupported(type)) || "";

      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(100);
      startTimeRef.current = Date.now();
      setIsRecording(true);
      setDuration(0);

      timerRef.current = window.setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 500);
    } catch (err: any) {
      console.error("Microphone access error:", err);
      toast.error(
        err.name === "NotAllowedError"
          ? "Microphone permission was denied."
          : "Could not access microphone."
      );
    }
  };

  const stopAndCleanup = () => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
  };

  const handleCancel = () => {
    stopAndCleanup();
    setDuration(0);
    audioChunksRef.current = [];
    if (onCancel) onCancel();
  };

  const handleFinishAndSend = async () => {
    if (!mediaRecorderRef.current || (audioChunksRef.current.length === 0 && duration === 0)) {
      handleCancel();
      return;
    }

    setIsProcessing(true);
    const recordedDuration = Math.max(1, duration);

    const recorder = mediaRecorderRef.current;
    if (recorder.state !== "inactive") {
      recorder.onstop = () => {
        finalizeBlob(recordedDuration);
      };
      recorder.stop();
    } else {
      finalizeBlob(recordedDuration);
    }
  };

  const finalizeBlob = (recordedDuration: number) => {
    try {
      const mimeType = mediaRecorderRef.current?.mimeType || "audio/webm";
      const blob = new Blob(audioChunksRef.current, { type: mimeType });

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result as string;
        onSend(base64Data, recordedDuration);
        stopAndCleanup();
        setIsProcessing(false);
        setDuration(0);
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error("Failed to process voice note:", err);
      toast.error("Failed to save voice note.");
      handleCancel();
      setIsProcessing(false);
    }
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}:${rem.toString().padStart(2, "0")}`;
  };

  if (!isRecording) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={startRecording}
        className="text-ink hover:text-stamp-ink hover:bg-sand/30"
        aria-label="Record voice message"
      >
        <Mic className="size-5" />
      </Button>
    );
  }

  return (
    <div className="flex flex-1 items-center gap-2 rounded-full border border-stamp/40 bg-sand/20 px-3 py-1 animate-in fade-in">
      <span className="relative flex size-3">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
        <span className="relative inline-flex size-3 rounded-full bg-rose-600" />
      </span>

      <span className="font-mono text-xs font-semibold tabular-nums text-rose-700">
        {formatTimer(duration)}
      </span>

      <div className="flex flex-1 items-center justify-center gap-1 px-2">
        {[4, 12, 18, 8, 22, 14, 26, 16, 20, 10, 16, 8, 14, 4].map((h, i) => (
          <span
            key={i}
            className="w-0.5 rounded-full bg-stamp-ink transition-all duration-150"
            style={{
              height: `${Math.max(4, (h * ((duration % 3) + 1)) % 24)}px`,
            }}
          />
        ))}
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleCancel}
        disabled={isProcessing}
        className="size-7 text-ink-muted hover:text-rose-600"
        aria-label="Discard recording"
      >
        <Trash2 className="size-4" />
      </Button>

      <Button
        type="button"
        size="icon"
        onClick={handleFinishAndSend}
        disabled={isProcessing}
        className="size-7 rounded-full bg-stamp text-paper shadow hover:bg-stamp/90"
        aria-label="Send voice message"
      >
        {isProcessing ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
      </Button>
    </div>
  );
}
