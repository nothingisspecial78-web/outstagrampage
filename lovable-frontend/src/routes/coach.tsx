import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
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

type Turn = { role: "me" | "coach"; text: string; experiment?: { title: string; days: number; why: string } | undefined };
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
          text: `Here is a small, quiet practice for today:\n\n“${ex.title}” (${ex.days} days). ${ex.why}`,
          experiment: ex,
        },
      ]);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <div className="paper-card animate-rise p-6">
        <header className="flex items-center justify-between border-b border-sand pb-4">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-full bg-stamp-soft text-stamp-ink">
              <Sparkles className="size-5" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold text-ink">AI Life Coach</h1>
              <p className="text-xs text-ink-muted">Three messages today · No scrolling advice</p>
            </div>
          </div>
          <span className="rounded-full bg-sand/60 px-3 py-1 font-mono text-xs font-semibold text-ink">
            {coachLeft} / 3 left
          </span>
        </header>

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
                {t.experiment && (
                  <div className="mt-3 rounded-xl border border-sand bg-paper/60 p-3">
                    <p className="flex items-center gap-1.5 font-bold text-ink">
                      <FlaskConical className="size-4 text-moss" /> {t.experiment.title}
                    </p>
                    <p className="mt-1 text-xs text-ink-muted">{t.experiment.why}</p>
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

        {dynamicSummary && (
          <div className="my-4 rounded-xl border border-moss/30 bg-moss/10 p-3 text-xs text-moss-ink">
            <span className="font-bold">Summary note:</span> {dynamicSummary}
          </div>
        )}

        <form onSubmit={submit} className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={coachLeft === 0 || thinking}
            placeholder={
              coachLeft === 0
                ? "No messages left today. Enjoy the world outside."
                : "Ask for an offline experiment or habit…"
            }
            className="flex-1 rounded-xl border border-sand bg-paper-raised px-4 py-2.5 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-stamp disabled:opacity-50"
          />
          <Button
            type="submit"
            disabled={!text.trim() || coachLeft === 0 || thinking}
            className="rounded-xl bg-stamp text-primary-foreground"
          >
            <Send className="size-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
