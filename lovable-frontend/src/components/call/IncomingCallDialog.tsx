import React from "react";
import { useCall } from "@/lib/call/CallContext";
import { Phone, PhoneOff, Video } from "lucide-react";
import { Button } from "@/components/ui/button";

export function IncomingCallDialog() {
  const { status, callType, peer, answerCall, declineCall } = useCall();

  if (status !== "ringing" || !peer) {
    return null;
  }

  const isVideo = callType === "video";

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label={`Incoming ${isVideo ? "video" : "voice"} call from ${peer.name}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in"
    >
      <div className="w-full max-w-sm rounded-2xl border border-sand bg-paper-raised p-6 text-center shadow-postcard">
        {/* Pulsing Avatar */}
        <div className="relative mx-auto mb-4 size-24">
          <img
            src={
              peer.avatar ||
              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"
            }
            alt={peer.name}
            className="h-full w-full rounded-full border-2 border-sand object-cover shadow"
          />
          <div className="absolute -inset-1.5 rounded-full border-2 border-stamp/40 animate-ping pointer-events-none" />
        </div>

        <h3 className="font-serif text-2xl font-bold text-ink">{peer.name}</h3>
        <p className="mt-1 text-sm text-ink-muted">
          Incoming {isVideo ? "Video" : "Voice"} Call…
        </p>

        <div className="mt-6 flex items-center justify-center gap-6">
          {/* Decline Button */}
          <div className="flex flex-col items-center gap-1.5">
            <Button
              size="icon"
              onClick={declineCall}
              className="size-14 rounded-full bg-rose-600 text-white hover:bg-rose-700 shadow-md transition-transform hover:scale-105 active:scale-95"
              aria-label="Decline call"
            >
              <PhoneOff className="size-6" />
            </Button>
            <span className="text-xs text-ink-muted">Decline</span>
          </div>

          {/* Accept Button */}
          <div className="flex flex-col items-center gap-1.5">
            <Button
              size="icon"
              onClick={answerCall}
              className="size-14 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 shadow-md transition-transform hover:scale-105 active:scale-95"
              aria-label="Accept call"
            >
              {isVideo ? <Video className="size-6" /> : <Phone className="size-6" />}
            </Button>
            <span className="text-xs text-ink-muted">Accept</span>
          </div>
        </div>
      </div>
    </div>
  );
}