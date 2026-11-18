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
      
    } catch {
      setThinking(false);
      const nextRemaining = Math.max(0, remainingToday - 1);
      setRemainingToday(nextRemaining);
      const ex = DEFAULT_EXPERIMENTS[(3 - nextRemaining) % DEFAULT_EXPERIMENTS.length]!;
      setTurns((t) => [
        ...t,
        {
          role: "coach",
          text: `Here is a small, quiet practice for today:\n\n“${ex.title}” (${ex.days} days).`,
          source: "fallback",
          experiment: ex,
        },
      ]);
    }
  };

  return (
    <div className="mx-auto max-w-xl pb-12">
      <div className="paper-card animate-rise p-6">
        <header className="flex flex-col gap-3 border-b border-sand pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-full bg-stamp-soft text-stamp-ink">
              <Sparkles className="size-5 text-stamp" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold text-ink">AI Life Coach</h1>
              <p className="text-xs text-ink-muted">Three messages today · Proposes offline experiments</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleMakeWeeklyLetter}
              disabled={loadingLetter}
              className="gap-1.5 border-sand bg-paper-raised text-xs text-ink hover:bg-sand/30"
            >
              <Mail className="size-3.5 text-stamp" />
              <span>{loadingLetter ? "Writing…" : "Make my weekly letter"}</span>
            </Button>

            <span className="rounded-full bg-sand/60 px-3 py-1 font-mono text-xs font-semibold text-ink">
              {remainingToday} / 3 left
            </span>
          </div>
        </header>

        {/* Conversation Stream */}
        <div className="my-6 space-y-4">
          {turns.map((t, i) => (
            <div
              key={i}
              className={cn(
                "flex gap-3",
                t.role === "me" ? "justify-end" : "justify-start"
              )}
            >
              {t.role === "coach" && (
                <div className="grid size-8 shrink-0 place-items-center rounded-full bg-line text-ink">
                  <Sparkles className="size-4 text-stamp" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed",
                  t.role === "me"
                    ? "bg-stamp text-primary-foreground"
                    : "border border-sand bg-paper-raised text-ink shadow-paper"
                )}
              >
                <p className="whitespace-pre-line">{t.text}</p>

                {/* Returned Experiment as a Card (Title + Days) */}
                {t.experiment && (
                  <div className="mt-3 rounded-xl border border-moss/30 bg-moss/10 p-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="flex items-center gap-1.5 font-bold text-moss-ink">
                        <FlaskConical className="size-4 text-moss shrink-0" />
                        <span>{t.experiment.title}</span>
                      </p>
                      <span className="shrink-0 rounded-full bg-moss/20 px-2.5 py-0.5 font-mono text-xs font-semibold text-moss-ink">
                        {t.experiment.days} {t.experiment.days === 1 ? "day" : "days"}
                      </span>
                    </div>
                    {(t.experiment.why || t.experiment.description) && (
                      <p className="mt-1.5 text-xs text-ink-muted leading-normal">
                        {t.experiment.why || t.experiment.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {thinking && (
            <div className="flex items-center gap-2 text-xs text-ink-muted">
              <span className="size-2 animate-pulse rounded-full bg-stamp" />
              Coach is drafting an offline experiment…
            </div>
          )}
        </div>

        {/* Calm Note when 3 check-ins used */}
        {remainingToday === 0 && (
          <div className="my-4 rounded-xl border border-sand bg-sand/30 p-4 text-center shadow-subtle animate-rise">
            <p className="font-serif text-sm italic text-ink">
              “You have used your 3 check-ins for today. Time to put the screen down and try the experiment.”
            </p>
            <p className="mt-1 text-xs text-ink-muted">
              Step away from your screen and notice the unhurried world around you.
            </p>
          </div>
        )}

        {/* Message Input Form */}
        <form onSubmit={submit} className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={remainingToday === 0 || thinking}
            maxLength={500}
            placeholder={
              remainingToday === 0
                ? "You have used your 3 check-ins for today. Time to put the screen down and try the experiment."
                : "Ask for an offline experiment or habit (1-500 chars)…"
            }
            className="flex-1 rounded-xl border border-sand bg-paper-raised px-4 py-2.5 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-stamp disabled:opacity-50"
          />
          <Button
            type="submit"
            disabled={!text.trim() || remainingToday === 0 || thinking}
            className="rounded-xl bg-stamp text-primary-foreground hover:bg-stamp/90 disabled:opacity-50"
          >
            <Send className="size-4" />
          </Button>
        </form>
      </div>

      {/* Weekly Letter Dialog */}
      <Dialog open={letterOpen} onOpenChange={setLetterOpen}>
        <DialogContent className="max-w-lg border border-sand bg-paper p-6 text-ink shadow-paper sm:rounded-2xl">
          <DialogHeader className="border-b border-sand pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <WaxSeal className="size-8" />
                <div>
                  <DialogTitle className="font-serif text-xl font-bold">Your Weekly Letter</DialogTitle>
                  <DialogDescription className="text-xs text-ink-muted">
                    Private habit reflection · Saved to coach summaries
                  </DialogDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.print()}
                className="gap-1 text-xs text-ink-muted hover:text-ink"
              >
                <Printer className="size-3.5" /> Print
              </Button>
            </div>
          </DialogHeader>

          <div className="my-4 max-h-[60vh] overflow-y-auto whitespace-pre-line rounded-xl border border-sand bg-paper-raised p-4 font-serif text-sm leading-relaxed text-ink shadow-inner">
            {letterContent}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              onClick={() => setLetterOpen(false)}
              className="rounded-xl bg-stamp px-4 py-2 text-xs font-semibold text-primary-foreground"
            >
              Keep Gentle
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
