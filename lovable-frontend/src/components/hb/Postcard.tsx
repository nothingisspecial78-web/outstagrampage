import { Heart, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Postmark } from "./Postmark";
import { MediaPostPlayer } from "./MediaPostPlayer";
import type { Postcard as P } from "@/lib/store";

export function Postcard({ card, onThank, onOpen }: { card: P; onThank?: () => void; onOpen?: () => void }) {
  const isVideo = card.img.startsWith("data:video") || card.img.endsWith(".mp4") || card.img.endsWith(".webm");

  return (
    <article className="postcard-frame relative mx-auto w-full max-w-xl rounded-sm">
      <div className="block w-full overflow-hidden rounded-[2px] focus-visible:outline-2 focus-visible:outline-ring">
        {isVideo ? (
          <MediaPostPlayer
            src={card.img}
            autoPlay
            loop
            className="aspect-[3/2] w-full"
          />
        ) : (
          <button
            type="button"
            onClick={onOpen}
            className="block w-full cursor-pointer focus:outline-none"
            aria-label={`Open postcard from ${card.from}`}
          >
            <img
              src={card.img}
              alt={`${card.place}, photographed by ${card.from}`}
              width={1200}
              height={800}
              loading="lazy"
              className="aspect-[3/2] w-full object-cover sepia-[.15]"
            />
          </button>
        )}
      </div>
      <Postmark place={card.place} date={card.date} className="absolute -top-3 -right-3 rounded-full bg-paper-raised/80" />
      <div className="flex items-end justify-between gap-4 px-1 pt-3">
        <div className="min-w-0">
          <p className="font-hand text-2xl leading-tight text-ink">“{card.caption}”</p>
          <p className="mt-1 text-xs uppercase tracking-widest text-ink-muted">{card.from} · {card.place}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={async () => {
              const shareData = {
                title: `Outstagram Moment from ${card.place}`,
                text: `“${card.caption}” — ${card.from} · ${card.place}`,
                url: window.location.href,
              };
              if (navigator.share) {
                try {
                  await navigator.share(shareData);
                  toast.success("Postcard shared!");
                  return;
                } catch {}
              }
              try {
                await navigator.clipboard.writeText(window.location.origin + "/rack");
                toast.success("Postcard link copied to clipboard!");
              } catch {
                toast.success("Postcard link ready to share!");
              }
            }}
            className="text-ink-muted hover:text-ink hover:bg-line p-2 rounded-xl"
            aria-label="Share postcard"
          >
            <Share2 className="size-4" />
          </Button>
          {onThank && (
            <Button variant="outline" size="sm" onClick={onThank} className="border-sand bg-paper text-stamp-ink hover:bg-line font-medium">
              <Heart className="size-4 mr-1 text-stamp" /> Send note
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
