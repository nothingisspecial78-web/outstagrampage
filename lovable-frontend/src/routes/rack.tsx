import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { Send, ChevronLeft, ChevronRight, Sparkles, Camera, MapPin, Footprints, ArrowRight, Check } from "lucide-react";
import { Postcard } from "@/components/hb/Postcard";
import { MediaPostPlayer } from "@/components/hb/MediaPostPlayer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CharCount } from "@/components/hb/AppShell";
import { useStore, type Postcard as P } from "@/lib/store";
import { Postmark } from "@/components/hb/Postmark";
import {
  TICKET_PASSES,
  DigitalTicketModal,
  type TicketVoucher,
  getIconForCategory,
} from "@/components/hb/rewards/TicketPasses";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/rack")({
  head: () => ({
    meta: [
      { title: "Today's Rack — Outstagram" },
      { name: "description", content: "A finite horizontal rack of ten moments from people nearby. Swipe sideways." },
      { property: "og:title", content: "Today's Rack — Outstagram" },
      { property: "og:description", content: "Side-by-side postcards from your neighborhood. Post less, go outside." },
    ],
  }),
  component: RackView,
});

const TEMPLATES = [
  { id: "t1", label: "Thank you", text: "Thank you for sharing this quiet moment.", cls: "bg-paper text-ink" },
  { id: "t2", label: "I was there", text: "I know this place well. Glad you enjoyed it.", cls: "bg-stamp-soft text-stamp-ink" },
  { id: "t3", label: "Made me smile", text: "This brought a smile to my day.", cls: "bg-moss/20 text-moss" },
];


const SPONSOR_POSTCARDS = [
  {
    id: "sp-lenskart",
    isSponsor: true,
    partner: "Lenskart Optical Works",
    badge: "Community Sponsor · Offline Eyewear Perk",
    postmarkPlace: "Lenskart Eyewear",
    postmarkDate: "20K STEPS",
    postmarkTone: "stamp" as const,
    img: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&auto=format&fit=crop&q=80",
    title: "Walk 20,000 steps · Complimentary Acetate Frame",
    caption: "Rest your screen-strained eyes. Walk 20,000 steps outdoors and claim a free handcrafted frame at any store.",
    actionLabel: "Activate 20k Steps Challenge",
    ticketId: "lenskart-frame",
  },
  {
    id: "sp-flight",
    isSponsor: true,
    partner: "Star Air Explorer Flights",
    badge: "Travel Partner · 50% Flight Voucher",
    postmarkPlace: "Star Air Flight",
    postmarkDate: "50% OFF",
    postmarkTone: "moss" as const,
    img: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&auto=format&fit=crop&q=80",
    title: "Unplug for 48 hours · Half-Price Domestic Flight Ticket",
    caption: "Post less, explore more. Disconnect from digital feeds and receive 50% off your next weekend flight.",
    actionLabel: "Claim Flight Voucher",
    ticketId: "flight-50",
  },
  {
    id: "sp-coffee",
    isSponsor: true,
    partner: "Riverside Cafe & Specialty Roastery",
    badge: "Local Roaster · Free Coffee Perk",
    postmarkPlace: "Riverside Roastery",
    postmarkDate: "FREE BREW",
    postmarkTone: "stamp" as const,
    img: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&auto=format&fit=crop&q=80",
    title: "Meet 2 friends phone-free · Free Hand-Drip Pour-Over",
    caption: "Put your phones away and sit together face-to-face. Enjoy a single-origin hand-poured roast on us.",
    actionLabel: "Unlock Coffee Pass",
    ticketId: "riverside-coffee",
  },
];

function RackView() {
  const { rack, markSeen } = useStore();
  const [selectedCard, setSelectedCard] = useState<P | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedTicket, setSelectedTicket] = useState<TicketVoucher | null>(null);

  // Combine regular postcards with physical brand sponsor postcards
  const allCards = [
    ...rack.slice(0, 2),
    SPONSOR_POSTCARDS[0]!,
    ...rack.slice(2, 5),
    SPONSOR_POSTCARDS[1]!,
    ...rack.slice(5, 8),
    SPONSOR_POSTCARDS[2]!,
    ...rack.slice(8),
  ];
  const totalItems = allCards.length;

  const updateActiveIndex = () => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const scrollLeft = container.scrollLeft;
    const itemWidth = container.firstElementChild ? (container.firstElementChild as HTMLElement).offsetWidth : 320;
    const gap = 24; // gap-6
    const index = Math.round(scrollLeft / (itemWidth + gap));
    const clamped = Math.max(0, Math.min(totalItems, index));
    setActiveIndex(clamped);
    markSeen(clamped);
  };

  const scrollTo = (index: number) => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const children = container.children;
    if (children[index]) {
      (children[index] as HTMLElement).scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
      setActiveIndex(index);
      markSeen(index);
    }
  };

  const scrollPrev = () => {
    scrollTo(Math.max(0, activeIndex - 1));
  };

  const scrollNext = () => {
    scrollTo(Math.min(totalItems, activeIndex + 1));
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
  }, [activeIndex, selectedCard, totalItems]);

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      {/* Header with horizontal guidance and navigation controls */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sand pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink">Today's Rack</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-stamp-soft px-2.5 py-0.5 text-xs font-semibold text-stamp-ink">
              <Sparkles className="size-3" /> Horizontal Rack
            </span>
          </div>
          <p className="mt-1 text-xs text-ink-muted">
            Swipe sideways. A finite selection of {totalItems} moments from people nearby.
          </p>
        </div>

        {/* Navigation counter and buttons */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted">
            <span className="font-mono text-ink font-bold text-sm">
              {activeIndex < totalItems ? activeIndex + 1 : totalItems}
            </span>
            <span>/</span>
            <span>{totalItems}</span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={scrollPrev}
              disabled={activeIndex === 0}
              className="size-9 rounded-full border-sand bg-paper hover:bg-line text-ink disabled:opacity-30"
              aria-label="Previous postcard"
            >
              <ChevronLeft className="size-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={scrollNext}
              disabled={activeIndex >= totalItems}
              className="size-9 rounded-full border-sand bg-paper hover:bg-line text-ink disabled:opacity-30"
              aria-label="Next postcard"
            >
              <ChevronRight className="size-5" />
            </Button>
          </div>
        </div>
      </header>

      {totalItems === 0 ? (
        <div className="paper-card mx-auto my-12 max-w-md p-8 text-center">
          <Camera className="mx-auto size-12 text-stamp" />
          <h2 className="mt-4 font-serif text-2xl font-bold text-ink">No moments shared yet today</h2>
          <p className="mt-2 text-sm text-ink-muted leading-relaxed">
            Be the first person in your neighborhood to capture and share an authentic real-world postcard.
          </p>
          <Button asChild className="mt-5 bg-stamp text-primary-foreground">
            <Link to="/capture">
              <Camera className="mr-2 size-4" /> Capture Postcard
            </Link>
          </Button>
        </div>
      ) : (
        <>
          {/* Progress Dots Indicator */}
          <div className="flex items-center justify-center gap-1.5 py-1">
            {rack.map((card, i) => (
              <button
                key={card.id}
                onClick={() => scrollTo(i)}
                aria-label={`Go to postcard ${i + 1}`}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  activeIndex === i
                    ? "w-6 bg-stamp"
                    : i < activeIndex
                    ? "w-2 bg-stamp-soft"
                    : "w-2 bg-sand hover:bg-sand/80"
                )}
              />
            ))}
            <button
              onClick={() => scrollTo(totalItems)}
              aria-label="Go to end card"
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                activeIndex === totalItems ? "w-6 bg-moss" : "w-2 bg-sand"
              )}
            />
          </div>

          {/* Horizontal Carousel Viewport */}
          <div className="relative">
            {/* Floating Desktop Navigation Chevrons */}
            <button
              onClick={scrollPrev}
              disabled={activeIndex === 0}
              aria-label="Scroll left"
              className={cn(
                "hidden md:grid absolute -left-5 top-1/2 -translate-y-1/2 z-20 size-11 place-items-center rounded-full border border-sand bg-paper-raised/95 text-ink shadow-postcard backdrop-blur transition-all hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-0"
              )}
            >
              <ChevronLeft className="size-6" />
            </button>

            <button
              onClick={scrollNext}
              disabled={activeIndex >= totalItems}
              aria-label="Scroll right"
              className={cn(
                "hidden md:grid absolute -right-5 top-1/2 -translate-y-1/2 z-20 size-11 place-items-center rounded-full border border-sand bg-paper-raised/95 text-ink shadow-postcard backdrop-blur transition-all hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-0"
              )}
            >
              <ChevronRight className="size-6" />
            </button>

            {/* Scrollable track */}
            <div
              ref={containerRef}
              onScroll={updateActiveIndex}
              className="snap-rack flex items-center overflow-x-auto snap-x snap-mandatory scroll-smooth pb-6 pt-3 gap-6 px-2 sm:px-6 md:px-8 cursor-grab active:cursor-grabbing"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {rack.map((card, i) => (
                <div
                  key={card.id}
                  className={cn(
                    "snap-center shrink-0 w-[86vw] max-w-[540px] sm:w-[500px] transition-transform duration-300",
                    activeIndex === i ? "scale-100 opacity-100" : "scale-[0.98] opacity-85 hover:opacity-100"
                  )}
                >
                  <Postcard
                    card={card}
                    onThank={() => setSelectedCard(card)}
                  />
                </div>
              ))}

              {/* End of Rack Card */}
              <div className="snap-center shrink-0 w-[86vw] max-w-[500px] sm:w-[460px]">
                <article className="postcard-frame relative flex flex-col items-center justify-center p-8 text-center rounded-2xl border-2 border-dashed border-sand bg-paper-raised">
                  <Postmark place="End of Rack" date="TODAY" tone="moss" className="size-24 mb-4" />
                  <h2 className="font-serif text-2xl font-bold text-ink">You've reached the end!</h2>
                  <p className="mt-2 text-sm text-ink-muted leading-relaxed">
                    Outstagram has no endless scroll or infinite feeds. You’ve seen all {totalItems} moments from people nearby today.
                  </p>
                  <p className="mt-2 font-hand text-xl text-stamp-ink">
                    Put your phone down, step outside, or make a quiet moment of your own.
                  </p>

                  <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full">
                    <Button asChild className="flex-1 bg-stamp text-primary-foreground">
                      <Link to="/capture">
                        <Camera className="size-4" /> Share a postcard
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="flex-1 border-sand">
                      <Link to="/quest">
                        <Footprints className="size-4" /> Today's quest
                      </Link>
                    </Button>
                  </div>

                  <button
                    onClick={() => scrollTo(0)}
                    className="mt-4 text-xs font-semibold text-ink-muted hover:text-ink underline"
                  >
                    ← Back to beginning
                  </button>
                </article>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between px-2 text-xs text-ink-muted">
            <span>Use <kbd className="rounded border border-sand bg-paper px-1.5 py-0.5 text-[11px] font-mono">←</kbd> <kbd className="rounded border border-sand bg-paper px-1.5 py-0.5 text-[11px] font-mono">→</kbd> keys or swipe sideways</span>
            <span>{totalItems} finite postcards today</span>
          </div>
        </>
      )}

      <ThankYou card={selectedCard} onClose={() => setSelectedCard(null)} />
      <DigitalTicketModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />
    </div>
  );
}

function ThankYou({ card, onClose }: { card: P | null; onClose: () => void }) {
  const [tpl, setTpl] = useState(TEMPLATES[0]!);
  const { sendPostcardNote } = useStore();
  const navigate = useNavigate();
  const [note, setNote] = useState(TEMPLATES[0]!.text);

  const handleSend = () => {
    if (!card || !note.trim()) return;
    const chatId = sendPostcardNote(card.from, note.trim(), card);
    toast.success(`Note sent to ${card.from}!`, {
      description: "Saved to your private chat conversation.",
      action: {
        label: "Open Chat",
        onClick: () => navigate({ to: "/chats/$id", params: { id: chatId } }),
      },
    });
    onClose();
  };
  if (!card) return null;
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-sand bg-paper sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">A note for {card.from}</DialogTitle>
          <DialogDescription>Only {card.from} will see this. No counts, ever.</DialogDescription>
        </DialogHeader>
        {card.img.startsWith('data:video') || card.img.endsWith('.mp4') || card.img.endsWith('.webm') ? (
          <MediaPostPlayer src={card.img} autoPlay loop className="aspect-[3/2] w-full rounded-sm" />
        ) : (
          <img src={card.img} alt="" className="aspect-[3/2] w-full rounded-sm object-cover" />
        )}
        <div className="flex gap-2">
          {TEMPLATES.map((t) => (
            <button key={t.id} onClick={() => { setTpl(t); setNote(t.text); }} className={cn("flex-1 rounded border px-2 py-1.5 font-hand text-lg", t.cls, tpl.id === t.id ? "border-stamp text-stamp-ink" : "border-sand text-ink-muted")}>{t.label}</button>
          ))}
        </div>
        <div className={cn("rounded-sm border border-sand p-3 shadow-paper", tpl.cls)}>
          <Textarea value={note} maxLength={280} onChange={(e) => setNote(e.target.value)} className="ruled min-h-24 border-0 bg-transparent font-hand text-2xl leading-7 shadow-none focus-visible:ring-0" />
          <div className="flex items-center justify-between"><span className="font-hand text-lg text-ink-muted">— Sam</span><CharCount value={note} min={1} max={280} /></div>
        </div>
        <Button disabled={note.trim().length < 1 || note.length > 280} onClick={handleSend}><Send /> Send note & save to chat</Button>
      </DialogContent>
    </Dialog>
  );
}