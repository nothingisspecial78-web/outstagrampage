import { Heart } from "lucide-react";
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
        {onThank && (
          <Button variant="outline" size="sm" onClick={onThank} className="shrink-0 border-sand bg-paper text-stamp-ink hover:bg-line">
            <Heart className="size-4" /> Send a thank-you
          </Button>
        )}
      </div>
    </article>
  );
}