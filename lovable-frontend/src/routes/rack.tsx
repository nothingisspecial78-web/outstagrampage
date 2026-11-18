import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Send, MapPin, Sparkles } from "lucide-react";
import { Postcard } from "@/components/hb/Postcard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CharCount } from "@/components/hb/AppShell";
import { useStore, type Postcard as P } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/rack")({
  component: RackView,
});

const TEMPLATES = [
  { id: "t1", label: "Thank you", text: "Thank you for sharing this quiet moment.", cls: "bg-paper text-ink" },
  { id: "t2", label: "I was there", text: "I know this place well. Glad you enjoyed it.", cls: "bg-stamp-soft text-stamp-ink" },
  { id: "t3", label: "Made me smile", text: "This brought a smile to my day.", cls: "bg-moss/20 text-moss" },
];

function RackView() {
  const { rack } = useStore();
  const [selectedCard, setSelectedCard] = useState<P | null>(null);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="border-b border-sand pb-3 text-center">
        <h1 className="font-serif text-3xl font-bold text-ink">Today's Rack</h1>
        <p className="mt-1 text-xs text-ink-muted">A finite selection of moments from people nearby.</p>
      </header>

      <div className="space-y-6">
        {rack.map((card) => (
          <Postcard
            key={card.id}
            card={card}
            onThank={() => setSelectedCard(card)}
          />
        ))}
      </div>

      <ThankYou card={selectedCard} onClose={() => setSelectedCard(null)} />
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
        {card.img.startsWith('data:video') || card.img.endsWith('.mp4') || card.img.endsWith('.webm') ? (
          <video src={card.img} controls autoPlay loop muted playsInline className="aspect-[3/2] w-full rounded-sm object-cover" />
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
        <Button disabled={note.trim().length < 1 || note.length > 280} onClick={() => { toast.success(`Thank-you sent to ${card.from}`); onClose(); }}><Send /> Send a thank-you</Button>
      </DialogContent>
    </Dialog>
  );
}
