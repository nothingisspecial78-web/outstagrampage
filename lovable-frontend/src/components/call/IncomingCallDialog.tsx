import React from "react";
import { useCall } from "@/lib/call/CallContext";
import { Phone, Video, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export function IncomingCallDialog() {
  const { incomingCall, acceptCall, rejectCall } = useCall();

  if (!incomingCall) return null;

  const isVideo = incomingCall.type === "video";
  const caller = incomingCall.from;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label={`Incoming ${isVideo ? "video" : "voice"} call from ${caller.name}`}
      className="fixed top-4 right-4 left-4 z-50 mx-auto max-w-md animate-in slide-in-from-top duration-300"
    >
      <div className="overflow-hidden rounded-2xl border-2 border-emerald-500/40 bg-ink/95 p-4 text-paper shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-4">
          {/* Avatar with Ringing Pulse */}
          <div className="relative">
            <div className="absolute -inset-1 animate-ping rounded-full bg-emerald-500/30" />
            {caller.avatar ? (
              <img
                src={caller.avatar}
                alt=""
                className="relative size-14 rounded-full border-2 border-emerald-400 object-cover shadow"
              />
            ) : (
              <div className="relative grid size-14 place-items-center rounded-full border-2 border-emerald-400 bg-sand/20 font-serif text-2xl font-bold text-paper">
                {caller.name.charAt(0) || "O"}
              </div>
            )}
          </div>

          {/* Caller Details */}
          <div className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-400">
              {isVideo ? <Video className="size-3.5" /> : <Phone className="size-3.5" />}
              Incoming {isVideo ? "Video" : "Voice"} Call
            </span>
            <h4 className="truncate font-serif text-lg font-bold text-paper">{caller.name}</h4>
            <p className="text-xs text-paper/70">Connecting with your friend…</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex items-center justify-end gap-3 pt-2">
          {/* Reject */}
          <Button
            type="button"
            variant="destructive"
            onClick={() => rejectCall("declined")}
            className="flex-1 rounded-xl bg-rose-600/90 text-white hover:bg-rose-700"
          >
            <PhoneOff className="mr-2 size-4" /> Decline
          </Button>

          {/* Accept */}
          <Button
            type="button"
            onClick={acceptCall}
            className="flex-1 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-semibold"
          >
            {isVideo ? <Video className="mr-2 size-4" /> : <Phone className="mr-2 size-4" />} Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
