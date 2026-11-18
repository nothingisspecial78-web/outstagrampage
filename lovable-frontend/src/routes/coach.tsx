import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FlaskConical, Mail, Printer, Send, Sparkles, Info, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar } from "@/components/hb/AppShell";
import { ME } from "@/lib/people";
import { WaxSeal } from "@/components/hb/EnvelopeLock";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { askCoach, getCoachSummary } from "@/lib/api";

export const Route = createFileRoute("/coach")({
  head: () => ({
    meta: [
      { title: "Life Coach — Outstagram" },
      { name: "description", content: "A calm AI coach that suggests one small offline experiment at a time." },
      { property: "og:title", content: "Life Coach — Outstagram" },
      { property: "og:description", content: "Three messages a day. One small experiment." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Coach,
});

type Turn = { role: "me" | "coach"; text: string; experiment?: { title: string; days: number; why: string } };
const EXPERIMENTS = [
  { title: "Read 5 pages every evening", days: 7, why: "Small enough to never skip, long enough to notice a change." },
  { title: "Leave your phone in another room during dinner", days: 5, why: "Meals get longer. Conversations too." },
  { title: "Take a 10-minute walk after lunch, no headphones", days: 7, why: "Let your mind wander where it wants." },
];

function Coach() {
  const { coachLeft, useCoach } = useStore();
  const [turns, setTurns] = useState<Turn[]>([{ role: "coach", text: "Hi Sam. What's been pulling at your attention lately?" }]);
  const [text, setText] = useState("");
  const [thinking, setThinking] = useState(false);
  const [letter, setLetter] = useState(false);

  const [dynamicSummary, setDynamicSummary] = useState<string>("");

  useEffect(() => {
    getCoachSummary().then((s) => {
      if (s) setDynamicSummary(s);
    });
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = text.trim();
    if (!query || coachLeft === 0) return;
    setTurns((t) => [...t, { role: "me", text: query }]);
    setText("");
    useCoach();
    setThinking(true);

    try {
      const res = await askCoach(query);
      setThinking(false);
      setTurns((t) => [
        ...t,
        {
          role: "coach",
          text: res.reply,
          experiment: res.experiment,
        },
      ]);
    } catch {
      setThinking(false);
      const ex = EXPERIMENTS[(3 - coachLeft) % EXPERIMENTS.length]!;
      setTurns((t) => [
        ...t,
        {
          role: "coach",
          text: "That sounds familiar. Let's try one tiny thing, offline:",
          experiment: ex,
        },
      ]);
    }
  };

  const CHIPS = ["I scroll before bed", "I want to read more", "I miss my friends", "I feel restless at lunch"];
  return (
    <div className="mx-auto flex h-[calc(100dvh-60px-56px-1.25rem)] max-w-2xl flex-col overflow-hidden rounded-none border-sand bg-paper-raised sm:rounded-2xl sm:border md:h-[calc(100dvh-3rem)]">
      <header className="flex items-center gap-3 border-b border-sand px-4 py-3">
        <span className="story-ring inline-flex rounded-full p-[2px]"><span className="grid size-10 place-items-center rounded-full border-2 border-paper-raised bg-gradient-hero text-primary-foreground"><Sparkles className="size-5" /></span></span>
        <div className="min-w-0 flex-1"><p className="truncate font-semibold text-ink">Life Coach</p><p className="hidden text-xs text-ink-muted sm:block">Calm · replies in 3 sentences</p></div>
        <span className="rounded-full bg-stamp-soft px-3 py-1 text-xs font-bold text-stamp-ink">{coachLeft}<span className="hidden sm:inline"> reflection{coachLeft === 1 ? "" : "s"}</span> left today</span>
        <button onClick={() => setLetter(true)} aria-label="Weekly letter" className="text-ink"><Mail className="size-6" /></button>
      </header>
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-5">
        <div className="pb-4 text-center">
          <span className="mx-auto grid size-20 place-items-center rounded-full bg-gradient-hero text-primary-foreground"><Sparkles className="size-9" /></span>
          <p className="mt-2 font-semibold text-ink">Outstagram Coach</p>
          <p className="text-xs text-ink-muted">Never recommends content. One small offline experiment at a time.</p>
        </div>
        {turns.map((t, i) => (
          <div key={i} className={cn("animate-rise flex items-end gap-2", t.role === "me" ? "justify-end" : "justify-start")}>
            {t.role === "coach" && <span className="grid size-7 shrink-0 place-items-center rounded-full bg-gradient-hero text-primary-foreground"><Sparkles className="size-3.5" /></span>}
            <div className="max-w-[78%]">
              <p className={cn("rounded-3xl px-4 py-2.5 text-sm", t.role === "me" ? "bg-stamp text-primary-foreground" : "bg-line text-ink")}>{t.text}</p>
              {t.experiment && (
                <div className="mt-2 overflow-hidden rounded-2xl border border-sand bg-paper-raised shadow-paper">
                  <div className="bg-gradient-hero px-4 py-2 text-xs font-bold tracking-widest text-primary-foreground uppercase"><FlaskConical className="mr-1 inline size-3.5" /> Experiment · {t.experiment.days} days</div>
                  <div className="p-4"><p className="font-semibold text-ink">{t.experiment.title}</p><p className="mt-1 font-hand text-xl text-ink-muted">{t.experiment.why}</p>
                    <button onClick={() => toast.success("Added to this week. No reminders, promise.")} className="mt-3 w-full rounded-xl bg-line py-2 text-sm font-semibold text-ink hover:bg-sand">I'll try it</button></div>
                </div>
              )}
            </div>
            {t.role === "me" && <Avatar src={ME.avatar} size="size-7" />}
          </div>
        ))}
        {thinking && <div className="flex items-center gap-2"><span className="grid size-7 place-items-center rounded-full bg-gradient-hero text-primary-foreground"><Sparkles className="size-3.5" /></span><span className="flex gap-1 rounded-3xl bg-line px-4 py-3">{[0,1,2].map((d) => <span key={d} className="size-1.5 animate-bounce rounded-full bg-ink-muted" style={{ animationDelay: `${d * 0.15}s` }} />)}</span></div>}
      </div>
      {coachLeft > 0 && turns.length < 3 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-2">{CHIPS.map((c) => <button key={c} onClick={() => setText(c)} className="shrink-0 rounded-full border border-sand px-3 py-1.5 text-xs font-semibold text-ink hover:bg-line">{c}</button>)}</div>
      )}
      <form onSubmit={submit} className="m-3 flex items-center gap-2 rounded-full border border-sand px-3 py-1.5">
        <Smile className="size-5 text-ink-muted" />
        <input value={text} onChange={(e) => setText(e.target.value)} disabled={coachLeft === 0} placeholder={coachLeft ? "Message the coach…" : "That's enough for today. See you tomorrow."} className="flex-1 bg-transparent py-1.5 text-sm text-ink outline-none placeholder:text-ink-muted" />
        {text.trim() ? <button type="submit" disabled={coachLeft === 0} className="text-sm font-bold text-link">Send</button> : <Info className="size-5 text-ink-muted" />}
      </form>

      <Dialog open={letter} onOpenChange={setLetter}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-sand bg-paper sm:max-w-lg">
          <DialogHeader className="sr-only"><DialogTitle>Your weekly letter</DialogTitle><DialogDescription>A printable letter of offline habits.</DialogDescription></DialogHeader>
          <article className="ruled relative rounded-sm border border-line bg-paper-raised p-6 font-hand text-xl leading-7 text-ink shadow-paper">
            <div className="absolute -top-4 right-6"><WaxSeal className="size-12" /></div>
            <p className="font-serif text-sm not-italic tracking-widest text-ink-muted">WEEK OF {new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit" }).toUpperCase()}</p>
            {dynamicSummary ? (
              <div className="mt-4 whitespace-pre-wrap">{dynamicSummary}</div>
            ) : (
              <>
                <p className="mt-4">Dear Sam,</p>
                <p className="mt-2">This week you walked, noticed, and met Priya at the park. That's 12 hours given back to your life.</p>
                <p className="mt-2">For the next seven days, try just these:</p>
                <ul className="mt-1 list-inside list-disc">
                  <li>Read 5 pages each evening.</li>
                  <li>One meal, phone in another room.</li>
                  <li>Say hello to someone at the bakery.</li>
                </ul>
                <p className="mt-3">Nothing to track. Just notice how it feels.</p>
                <p className="mt-4">Gently,<br />your Outstagram coach</p>
              </>
            )}
          </article>
          <Button onClick={() => window.print()}><Printer /> Print letter</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
