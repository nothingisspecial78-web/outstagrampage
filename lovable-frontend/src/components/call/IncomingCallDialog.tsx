import { Phone, PhoneOff, Video } from "lucide-react";
import { Avatar } from "@/components/hb/AppShell";
import { Button } from "@/components/ui/button";
import type { ActiveCall } from "@/lib/call/webrtc";

interface IncomingCallDialogProps {
  call: ActiveCall;
  onAccept: () => void;
  onReject: () => void;
}

export function IncomingCallDialog({ call, onAccept, onReject }: IncomingCallDialogProps) {
  const isVideo = call.type === "video";

  return (
    <div
      role="alertdialog"
      aria-label="Incoming call alert"
      className="fixed top-5 inset-x-4 z-50 mx-auto max-w-sm animate-in fade-in slide-in-from-top-6 duration-300 rounded-3xl border border-sand bg-paper-raised/95 p-4 shadow-postcard backdrop-blur-md"
    >
      <div className="flex items-center gap-3.5">
        <div className="relative">
          <Avatar src={call.participantAvatar} size="size-14" />
          <span className="absolute -bottom-1 -right-1 grid size-6 place-items-center rounded-full bg-stamp text-paper-raised ring-2 ring-paper-raised">
            {isVideo ? <Video className="size-3.5" /> : <Phone className="size-3.5" />}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-stamp-ink">
            Incoming {isVideo ? "Video" : "Voice"} Call
          </p>
          <h4 className="truncate text-base font-bold text-ink">{call.participantName}</h4>
          <p className="text-xs text-ink-muted">Encrypted P2P connection</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Button
          type="button"
          onClick={onReject}
          variant="outline"
          className="flex-1 rounded-2xl border-sand bg-line text-destructive hover:bg-destructive/10 hover:text-destructive h-11 text-sm font-semibold"
        >
          <PhoneOff className="mr-2 size-4" /> Decline
        </Button>
        <Button
          type="button"
          onClick={onAccept}
          className="flex-1 rounded-2xl bg-moss text-paper-raised hover:bg-moss/90 h-11 text-sm font-bold shadow-postcard animate-pulse"
        >
          <Phone className="mr-2 size-4" /> Accept
        </Button>
      </div>
    </div>
  );
}
