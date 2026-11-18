import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, CharCount } from "@/components/hb/AppShell";
import { Postcard } from "@/components/hb/Postcard";
import { RACK, captionValid, useStore, type Postcard as P } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/rack")({
  head: () => ({
    meta: [
      { title: "Today's Rack — Outstagram" },
      { name: "description", content: "Ten postcards from friends, one at a time. Then it ends." },
      { property: "og:title", content: "Today's Rack — Outstagram" },
      { property: "og:description", content: "You've seen everything. Go outside." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Rack,
});

const TEMPLATES = [
  { id: "warm", label: "Warm", cls: "bg-paper-raised", text: "This made my morning. Thank you for sharing it." },
  { id: "go", label: "I'll go", cls: "bg-line", text: "Adding this to my list — I'll go this week." },
  { id: "join", label: "Join me?", cls: "bg-paper", text: "Next time, can I come along?" },
];

function Rack() {
  const { rack, setSeen, dwell } = useStore();
  const cards = (rack || RACK).slice(0, 10);
  const total = cards.length + 1;
  const ref = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const [open, setOpen] = useState<P | null>(null);
  const [wait, setWait] = useState(false);
  useEffect(() => { if (!dwell) { setWait(false); return; } setWait(true); const t = setTimeout(() => setWait(false), 3000); return () => clearTimeout(t); }, [idx, dwell]);

  useEffect(() => { setSeen((s: number) => Math.max(s, Math.min(idx + 1, cards.length))); }, [idx]);

  const go = (i: number) => {
    const el = ref.current; if (!el) return;
    if (i > idx && wait) return;
    const n = Math.max(0, Math.min(total - 1, i));
    el.scrollTo({ left: n * el.clientWidth, behavior: "smooth" });
  };
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input,textarea")) return;
      if (e.key === "ArrowRight") go(idx + 1);
      if (e.key === "ArrowLeft") go(idx - 1);
    };
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  });

  return (
    <div>
      <PageHeader eyebrow="Today's rack" title="Postcards from nearby">
        <p className="text-sm tabular-nums text-ink-muted" aria-live="polite">{idx >= cards.length ? "The end" : `Card ${idx + 1} of ${cards.length}`}</p>
      </PageHeader>

      <div ref={ref} onScroll={(e) => setIdx(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))} onWheel={(e) => { if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) e.currentTarget.scrollLeft += e.deltaY; }} className="snap-rack -mx-4 flex overflow-x-auto overscroll-x-contain sm:mx-0" tabIndex={0} aria-label="Postcard rack" aria-roledescription="carousel">
        {cards.map((c) => (
          <div key={c.id} className="w-full shrink-0 snap-center px-6 py-6" aria-roledescription="slide">
            <Postcard card={c} onOpen={() => setOpen(c)} onThank={() => setOpen(c)} />
          </div>
        ))}
        <div className="grid w-full shrink-0 snap-center place-items-center px-6 py-6">
          <div className="postcard-frame w-full max-w-xl rotate-1 rounded-sm">
            <div className="grid aspect-[3/2] place-items-center border-2 border-dashed border-sand p-6 text-center">
              <div>
                <p className="font-hand text-3xl text-stamp-ink">That's the whole rack.</p>
                <h2 className="mt-2 text-3xl font-semibold text-ink sm:text-4xl">You've seen everything.<br />Go outside.</h2>
                <Button asChild className="mt-6"><Link to="/">Back to Today</Link></Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-4">
        <Button variant="outline" size="icon" onClick={() => go(idx - 1)} disabled={idx === 0} aria-label="Previous postcard" className="bg-paper-raised"><ChevronLeft /></Button>
        <div className="flex flex-col items-center gap-2">
          <div className="flex gap-1.5">
            {Array.from({ length: total }).map((_, i) => (
              <button key={i} onClick={() => go(i)} aria-label={`Go to card ${i + 1}`} className={cn("h-1.5 rounded-full transition-all", i === idx ? "w-6 bg-stamp" : "w-1.5 bg-sand")} />
            ))}
          </div>
          <p className="hidden text-xs text-ink-muted sm:block"><kbd className="rounded border border-sand px-1">←</kbd> <kbd className="rounded border border-sand px-1">→</kbd> to flip</p>
        </div>
        <Button variant="outline" size="icon" onClick={() => go(idx + 1)} disabled={idx === total - 1 || wait} aria-label={wait ? "Take a moment with this one" : "Next postcard"} className="relative overflow-hidden bg-paper-raised"><ChevronRight />{wait && <span key={idx} className="absolute inset-x-0 bottom-0 h-0.5 origin-left animate-[growx_3s_linear_forwards] bg-stamp" />}</Button>
      </div>

      <ThankYou card={open} onClose={() => setOpen(null)} />
    </div>
  );
}

function ThankYou({ card, onClose }: { card: P | null; onClose: () => void }) {
  const [tpl, setTpl] = useState(TEMPLATES[0]!);
  const [note, setNote] = useState(TEMPLATES[0]!.text);
  if (!card) return null;
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-sand bg-paper sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">A note for {card.from}</DialogTitle>
          <DialogDescription>Only {card.from} will see this. No counts, ever.</DialogDescription>
        </DialogHeader>
        <img src={card.img} alt="" className="aspect-[3/2] w-full rounded-sm object-cover" />
        <div className="flex gap-2">
          {TEMPLATES.map((t) => (
            <button key={t.id} onClick={() => { setTpl(t); setNote(t.text); }} className={cn("flex-1 rounded border px-2 py-1.5 font-hand text-lg", t.cls, tpl.id === t.id ? "border-stamp text-stamp-ink" : "border-sand text-ink-muted")}>{t.label}</button>
          ))}
        </div>
        <div className={cn("rounded-sm border border-sand p-3 shadow-paper", tpl.cls)}>
          <Textarea value={note} maxLength={280} onChange={(e) => setNote(e.target.value)} className="ruled min-h-24 border-0 bg-transparent font-hand text-2xl leading-7 shadow-none focus-visible:ring-0" />
          <div className="flex items-center justify-between"><span className="font-hand text-lg text-ink-muted">— Sam</span><CharCount value={note} min={1} max={280} /></div>
        </div>
        <Button disabled={note.trim().length < 1 || note.length > 280} onClick={() => { toast.success(`Thank-you sent to ${card.from}`); onClose(); }}><Send /> Send a thank-you</Button>
      </DialogContent>
    </Dialog>
  );
}
