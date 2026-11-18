import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { FlaskConical, Mail, Printer, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { WaxSeal } from "@/components/hb/EnvelopeLock";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { askCoach, getCoachSummary, getCoachRemainingCount, CoachExperiment } from "@/lib/api";

export const Route = createFileRoute("/coach")({
  head: () => ({
    meta: [
      { title: "Life Coach — Outstagram" },
      { name: "description", content: "A calm AI coach that suggests one small offline experiment at a time." },
      { property: "og:title", content: "Life Coach — Outstagram" },
      { property: "og:description", content: "Three messages a day. One small offline experiment." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Coach,
});

interface Turn {
  role: "me" | "coach";
  text: string;
  source?: "ai" | "fallback" | undefined;
  experiment?: CoachExperiment | undefined;
}

const DEFAULT_EXPERIMENTS: CoachExperiment[] = [
  { title: "Read 5 pages every evening", days: 7, why: "Small enough to never skip, long enough to notice a change." },
  { title: "Leave your phone in another room during dinner", days: 5, why: "Meals get longer. Conversations too." },
  { title: "Take a 10-minute walk after lunch, no headphones", days: 7, why: "Let your mind wander where it wants." },
];

function Coach() {
  const { coachLeft, useCoach } = useStore();
  const [remainingToday, setRemainingToday] = useState<number>(() => {
    return Math.min(coachLeft, getCoachRemainingCount());
  });
  const [turns, setTurns] = useState<Turn[]>([
    {
      role: "coach",
      text: "Hi friend. I'm here to offer one small offline experiment at a time. What has been pulling at your attention lately?",
    },
  ]);
  const [text, setText] = useState("");
  const [thinking, setThinking] = useState(false);
  const [letterOpen, setLetterOpen] = useState(false);
  const [letterContent, setLetterContent] = useState<string>("");
  const [loadingLetter, setLoadingLetter] = useState(false);

  // Sync remaining messages with store or quota
  useEffect(() => {
    const quotaRemaining = getCoachRemainingCount();
    setRemainingToday(Math.min(coachLeft, quotaRemaining));
  }, [coachLeft]);

  const handleMakeWeeklyLetter = async () => {
    setLoadingLetter(true);
    try {
      const summary = await getCoachSummary();
      setLetterContent(summary);
      setLetterOpen(true);
    } catch {
      toast.error("Failed to generate weekly letter. Please try again.");
    } finally {
      setLoadingLetter(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = text.trim();
    if (!query || remainingToday <= 0 || thinking) return;

    setTurns((t) => [...t, { role: "me", text: query }]);
    setText("");
    useCoach();
    setThinking(true);

    try {
      const res = await askCoach(query);
      setThinking(false);
      setRemainingToday(res.remaining_today);
      setTurns((t) => [
        ...t,
        {
          role: "coach",
          text: res.reply,
          source: res.source,
          experiment: res.experiment,
        },
      ]);
      if (res.source === "fallback") {
        toast.info("Offline rule fallback engaged.");
      }
    } catch (err: any) {
      setThinking(false);
      toast.error("Error communicating with Coach. Offline guidance active.");
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <header className="flex items-start justify-between border-b border-sand pb-4">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-2xl bg-stamp-soft text-stamp shadow-postcard">
            <Sparkles className="size-6" />
          </span>
          <div>
            <h1 className="font-serif text-2xl font-bold text-ink">AI Life Coach</h1>
            <p className="text-xs text-ink-muted">
              Three messages today · Proposes offline experiments
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleMakeWeeklyLetter}
            disabled={loadingLetter}
            className="border-sand bg-paper text-xs text-ink-muted hover:text-ink"
          >
            <Mail className="mr-1.5 size-3.5" />
            {loadingLetter ? "Writing…" : "Make my weekly letter"}
          </Button>

          <span className="rounded-full bg-sand/60 px-2.5 py-1 text-center font-mono text-xs font-bold text-ink">
            {remainingToday} / 3 <span className="block text-[10px] font-sans font-normal text-ink-muted">left</span>
          </span>
        </div>
      </header>

      {/* Conversation timeline */}
      <div className="space-y-4 min-h-[300px]">
        {turns.map((t, i) => (
          <div
            key={i}
            className={cn("flex flex-col gap-2", t.role === "me" ? "items-end" : "items-start")}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed shadow-postcard",
                t.role === "me"
                  ? "bg-stamp text-primary-foreground"
                  : "border border-sand bg-paper-raised text-ink"
              )}
            >
              <p>{t.text}</p>
            </div>

            {/* Structured Experiment Card */}
            {t.experiment && (
              <div className="w-[85%] animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="rounded-2xl border-2 border-dashed border-moss/60 bg-moss/10 p-4">
                  <div className="flex items-center justify-between text-xs font-bold text-moss">
                    <span className="flex items-center gap-1.5 uppercase tracking-wider">
                      <FlaskConical className="size-4" /> Offline Experiment
                    </span>
                    <span className="rounded-full bg-moss/20 px-2 py-0.5 font-mono">
                      {t.experiment.days} {t.experiment.days === 1 ? "day" : "days"}
                    </span>
                  </div>
                  <h3 className="mt-2 font-serif text-base font-bold text-ink">
                    {t.experiment.title}
                  </h3>
                  {t.experiment.why && (
                    <p className="mt-1 text-xs text-ink-muted">{t.experiment.why}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {thinking && (
          <div className="flex items-center gap-2 text-xs text-ink-muted animate-pulse py-2">
            <Sparkles className="size-4 text-stamp" />
            <span>The Coach is pondering an offline experiment…</span>
          </div>
        )}
      </div>

      {/* Form or Limit Reached Notice */}
      {remainingToday > 0 ? (
        <form onSubmit={submit} className="flex gap-2 border-t border-sand pt-4">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ask the coach for an experiment or reflection…"
            maxLength={500}
            className="flex-1 rounded-2xl border border-sand bg-paper px-4 py-3 text-sm text-ink outline-none placeholder:text-ink-muted/70 focus:border-stamp focus:bg-paper-raised"
          />
          <Button
            type="submit"
            disabled={!text.trim() || thinking}
            className="rounded-2xl bg-stamp text-primary-foreground px-5 shadow-postcard"
          >
            <Send className="size-4" />
          </Button>
        </form>
      ) : (
        <div className="rounded-2xl border border-sand bg-paper p-5 text-center text-xs text-ink-muted shadow-sm">
          <p className="font-semibold text-ink">You have used your 3 check-ins for today.</p>
          <p className="mt-1">
            The coach is intentionally limited so you spend less time conversing with an AI and more time walking outside. See you tomorrow.
          </p>
        </div>
      )}

      {/* Weekly Letter Modal */}
      <Dialog open={letterOpen} onOpenChange={setLetterOpen}>
        <DialogContent className="max-w-lg border-sand bg-paper-raised p-6 shadow-postcard">
          <DialogHeader className="items-center text-center">
            <WaxSeal initial="H" tone="moss" className="size-14 mb-2" />
            <DialogTitle className="font-serif text-2xl font-bold text-ink">
              Your Private Weekly Letter
            </DialogTitle>
            <DialogDescription className="text-xs text-ink-muted">
              Generated privately from your local quest logs, stamps, meetups and creations.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 max-h-[60vh] overflow-y-auto whitespace-pre-wrap rounded-2xl border border-sand/70 bg-paper p-5 font-serif text-sm leading-relaxed text-ink shadow-inner">
            {letterContent}
          </div>

          <div className="mt-4 flex justify-between items-center text-xs text-ink-muted">
            <span>Never shared · Never ranked</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                window.print();
              }}
              className="border-sand bg-paper text-ink"
            >
              <Printer className="mr-1.5 size-3.5" /> Print Letter
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}