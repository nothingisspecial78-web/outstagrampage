import { createFileRoute } from "@tanstack/react-router";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Heart, Sparkles, Send } from "lucide-react";
import { Postmark } from "@/components/hb/Postmark";
import { Button } from "@/components/ui/button";
import { useStore, type Postcard as P } from "@/lib/store";
import { cn } from "@/lib/utils";
import { MediaPostPlayer } from "@/components/hb/MediaPostPlayer";

export const Route = createFileRoute("/rack")({
  head: () => ({
    meta: [
      { title: "Today's Rack — Outstagram" },
      { name: "description", content: "A finite, horizontal selection of postcards from people nearby. No infinite scroll." },
      { property: "og:title", content: "Today's Rack — Outstagram" },
      { property: "og:description", content: "A finite, side-scrolling selection of moments from people nearby." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RackView,
});

function RackView() {
  const { rack, dwell } = useStore();
  const [selectedCard, setSelectedCard] = useState<P | null>(null);
  const [thanked, setThanked] = useState<string | null>(null);
  const [thankNote, setThankNote] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const totalItems = rack.length;

  const updateActiveIndex = () => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const scrollLeft = container.scrollLeft;
    const itemWidth = container.firstElementChild ? (container.firstElementChild as HTMLElement).offsetWidth : 320;
    const gap = 24; // gap-6
    const index = Math.round(scrollLeft / (itemWidth + gap));
    const clamped = Math.max(0, Math.min(totalItems, index));
    setActiveIndex(clamped);
  };

  const scrollToIndex = (index: number) => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const children = Array.from(container.children) as HTMLElement[];
    const target = children[index];
    if (target) {
      target.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      setActiveIndex(index);
    }
  };

  const scrollNext = () => {
    if (activeIndex < totalItems) {
      scrollToIndex(activeIndex + 1);
    }
  };

  const scrollPrev = () => {
    if (activeIndex > 0) {
      scrollToIndex(activeIndex - 1);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedCard) return; // ignore when dialog open
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        scrollPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        scrollNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, selectedCard]);

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      {/* Header with horizontal guidance and navigation controls */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sand pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">Today's Rack</h1>
            <span className="rounded-full bg-stamp-soft px-2.5 py-0.5 text-xs font-bold text-stamp-ink uppercase tracking-wider">
              Finite Gallery
            </span>
          </div>
          <p className="mt-1 text-sm text-ink-muted">
            Scroll sideways to browse moments nearby. Once finished, put down the phone.
          </p>
        </div>

        {/* Navigation counter and buttons */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted">
            <span className="font-mono text-ink font-bold text-sm">
              {Math.min(activeIndex + 1, totalItems)}
            </span>
            <span>/</span>
            <span>{totalItems}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              onClick={scrollPrev}
              disabled={activeIndex === 0}
              className="size-8 rounded-full border-sand bg-paper hover:bg-line disabled:opacity-30"
              aria-label="Previous postcard"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={scrollNext}
              disabled={activeIndex >= totalItems}
              className="size-8 rounded-full border-sand bg-paper hover:bg-line disabled:opacity-30"
              aria-label="Next postcard"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Progress Dots Indicator */}
      <div className="flex items-center justify-center gap-1.5 py-1">
        {rack.map((card, i) => (
          <button
            key={card.id}
            onClick={() => scrollToIndex(i)}
            aria-label={`Jump to postcard ${i + 1}`}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              activeIndex === i
                ? "w-6 bg-stamp"
                : "w-1.5 bg-sand hover:bg-ink-muted"
            )}
          />
        ))}
        <button
          onClick={() => scrollToIndex(totalItems)}
          aria-label="Jump to end of rack"
          className={cn(
            "h-1.5 rounded-full transition-all duration-300",
            activeIndex === totalItems
              ? "w-6 bg-moss"
              : "w-1.5 bg-sand hover:bg-ink-muted"
          )}
        />
      </div>

      {/* Horizontal Carousel Viewport */}
      <div className="relative">
        {/* Floating Desktop Navigation Chevrons */}
        <button
          onClick={scrollPrev}
          disabled={activeIndex === 0}
          className="absolute -left-5 top-1/2 -translate-y-1/2 z-20 hidden lg:grid size-11 place-items-center rounded-full bg-paper-raised border border-sand shadow-postcard text-ink transition-all hover:scale-110 disabled:opacity-0 pointer-events-auto"
          aria-label="Scroll left"
        >
          <ChevronLeft className="size-6" />
        </button>

        <button
          onClick={scrollNext}
          disabled={activeIndex >= totalItems}
          className="absolute -right-5 top-1/2 -translate-y-1/2 z-20 hidden lg:grid size-11 place-items-center rounded-full bg-paper-raised border border-sand shadow-postcard text-ink transition-all hover:scale-110 disabled:opacity-0 pointer-events-auto"
          aria-label="Scroll right"
        >
          <ChevronRight className="size-6" />
        </button>

        {/* Scrollable track */}
        <div
          ref={containerRef}
          onScroll={updateActiveIndex}
          className="flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth py-4 px-2 no-scrollbar"
          style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
        >
          {rack.map((card, idx) => (
            <div
              key={card.id}
              className="snap-center shrink-0 w-[86vw] max-w-[500px] sm:w-[460px] md:w-[480px] transition-transform duration-300"
            >
              <article className="postcard-frame relative flex flex-col rounded-sm">
                <Postmark
                  place={card.place}
                  date={card.date}
                  className="absolute -top-3 -right-3 z-10 size-16 sm:size-20"
                />

                <div className="relative aspect-[3/2] w-full overflow-hidden rounded-[2px] bg-line">
                  {card.img.startsWith("data:video") || card.img.endsWith(".mp4") || card.img.endsWith(".webm") ? (
                    <MediaPostPlayer
                      src={card.img}
                      autoPlay={activeIndex === idx}
                      loop
                      className="h-full w-full"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSelectedCard(card)}
                      className="h-full w-full block cursor-zoom-in focus:outline-none"
                      aria-label={`Inspect moment from ${card.from} at ${card.place}`}
                    >
                      <img
                        src={card.img}
                        alt={card.place}
                        className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.02]"
                        loading="lazy"
                      />
                    </button>
                  )}
                </div>

                <div className="flex items-end justify-between gap-4 px-1 pt-4">
                  <div className="min-w-0">
                    <p className="font-hand text-2xl text-ink leading-snug">
                      "{card.caption}"
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-widest text-ink-muted">
                      {card.from} · {card.place}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setThanked(card.from);
                      setThankNote("");
                    }}
                    className="shrink-0 border-sand bg-paper text-stamp-ink hover:bg-line text-xs font-semibold"
                  >
                    <Heart className="size-3.5 mr-1" /> Thank
                  </Button>
                </div>
              </article>
            </div>
          ))}

          {/* End of Rack Card */}
          <div className="snap-center shrink-0 w-[86vw] max-w-[500px] sm:w-[460px]">
            <article className="postcard-frame relative flex flex-col items-center justify-center p-8 text-center rounded-2xl border-2 border-dashed border-sand bg-paper-raised">
              <Postmark place="End of Rack" date="TODAY" tone="moss" className="size-24 mb-4" />
              <h2 className="font-serif text-2xl font-bold text-ink">You've reached the end</h2>
              <p className="mt-2 text-sm text-ink-muted max-w-xs leading-relaxed">
                That's everything nearby for today. No endless reels or algorithmic feeds.
                Step outside, take a walk, and make a real memory.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => scrollToIndex(0)}
                  variant="outline"
                  className="border-sand bg-paper text-xs"
                >
                  Back to Beginning
                </Button>
                <Button
                  onClick={() => window.location.href = "/capture"}
                  className="bg-stamp hover:bg-stamp-ink text-primary-foreground text-xs font-semibold"
                >
                  <Sparkles className="size-3.5 mr-1" /> Post a Moment
                </Button>
              </div>
            </article>
          </div>
        </div>
      </div>

      {/* Thank you dialog */}
      <Dialog open={!!thanked} onOpenChange={(o) => !o && setThanked(null)}>
        <DialogContent className="border-sand bg-paper-raised sm:max-w-md">
          <div className="text-center p-2">
            <span className="grid size-12 place-items-center rounded-full bg-stamp-soft text-stamp-ink mx-auto mb-3">
              <Heart className="size-6 fill-current" />
            </span>
            <h3 className="font-serif text-xl font-bold text-ink">Send a warm note to {thanked}</h3>
            <p className="mt-1 text-xs text-ink-muted">A calm thank-you for sharing their offline moment.</p>

            <textarea
              value={thankNote}
              onChange={(e) => setThankNote(e.target.value)}
              placeholder="Your note (e.g. Loved the light on the water…)"
              className="mt-4 w-full rounded-xl border border-sand bg-paper p-3 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-stamp"
              rows={3}
            />

            <div className="mt-4 flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setThanked(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setThanked(null);
                }}
                className="bg-stamp text-primary-foreground"
              >
                <Send className="size-4 mr-1" /> Send Note
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Postcard Zoom Dialog */}
      <Dialog open={!!selectedCard} onOpenChange={(o) => !o && setSelectedCard(null)}>
        <DialogContent className="max-w-3xl border-sand bg-paper-raised p-2 sm:p-4">
          {selectedCard && (
            <div className="space-y-3">
              <div className="relative overflow-hidden rounded">
                <Postmark place={selectedCard.place} date={selectedCard.date} className="absolute -top-2 -right-2 z-10 size-20" />
                <img src={selectedCard.img} alt={selectedCard.place} className="w-full object-cover max-h-[70vh] rounded" />
              </div>
              <div className="px-2 pb-2">
                <p className="font-hand text-3xl text-ink">"{selectedCard.caption}"</p>
                <p className="text-xs uppercase tracking-widest text-ink-muted mt-1">{selectedCard.from} · {selectedCard.place}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}