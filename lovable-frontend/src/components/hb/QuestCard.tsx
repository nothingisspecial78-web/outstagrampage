import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Footprints, Check, Plus, Eye } from "lucide-react";
import { CharCount } from "@/components/hb/AppShell";
import { Postmark } from "@/components/hb/Postmark";
import { captionValid, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const GOAL = 100;
const NOTICE = ["Something red", "A sound you'd usually miss", "Someone smiling"];

export function QuestCard() {
  const { questDone, completeQuest } = useStore();
  const [steps, setSteps] = useState(0);
  const [checks, setChecks] = useState([false, false, false]);
  const [minutes, setMinutes] = useState("15");
  const [reflection, setReflection] = useState("");
  const pct = Math.min(1, steps / GOAL);
  const noticed = checks.filter(Boolean).length;
  const canDone = captionValid(reflection) && Number(minutes) > 0 && noticed === 3 && steps >= GOAL;
  const R = 52, C = 2 * Math.PI * R;

  return (
      <section className="rounded-3xl bg-gradient-hero p-[2px] shadow-postcard w-full max-w-full overflow-hidden">
        <div className="rounded-[calc(1.5rem-2px)] bg-paper-raised p-5 sm:p-7">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-stamp-soft px-3 py-1 text-xs font-bold tracking-wider text-stamp-ink uppercase"><Footprints className="size-3.5" /> Today's quest</span>
            <span className="text-xs text-ink-muted">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</span>
          </div>
          <h1 className="mt-3 text-2xl font-extrabold text-ink sm:text-3xl">Walk 100 steps and notice three things.</h1>

          {questDone ? (
            <div className="mt-6 flex flex-col items-center py-6 text-center">
              <Postmark place="Quest complete" date="DONE" tone="moss" className="animate-stamp size-32" />
              <p className="mt-4 text-xl font-bold text-moss">Stamped into your passport.</p>
              <p className="text-sm text-ink-muted">Nothing else to do here today. Really.</p>
              <Link to="/passport" className="mt-4 rounded-xl bg-line px-4 py-2 text-sm font-semibold text-ink">See your stamps</Link>
            </div>
          ) : (
            <div className="mt-6 grid gap-6 sm:grid-cols-[180px_1fr]">
              <div className="flex flex-col items-center">
                <div className="relative size-40">
                  <svg viewBox="0 0 120 120" className="size-full -rotate-90"><circle cx="60" cy="60" r={R} fill="none" strokeWidth="10" className="stroke-line" /><circle cx="60" cy="60" r={R} fill="none" strokeWidth="10" strokeLinecap="round" className={cn("transition-all duration-500", pct >= 1 ? "stroke-moss" : "stroke-stamp")} strokeDasharray={C} strokeDashoffset={C * (1 - pct)} /></svg>
                  <div className="absolute inset-0 grid place-items-center text-center"><div><p className="text-3xl font-extrabold tabular-nums text-ink">{Math.min(steps, GOAL)}</p><p className="text-xs text-ink-muted">of {GOAL} steps</p></div></div>
                </div>
                <button onClick={() => setSteps((s) => Math.min(GOAL, s + 20))} disabled={steps >= GOAL} className="mt-3 inline-flex items-center gap-1 rounded-full bg-ink px-4 py-2 text-xs font-bold text-paper-raised disabled:bg-moss">{steps >= GOAL ? <><Check className="size-3.5" /> Walked</> : <><Plus className="size-3.5" /> 20 steps</>}</button>
              </div>
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (canDone) completeQuest(Number(minutes)); }}>
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink"><Eye className="size-4" /> Notice ({noticed}/3)</p>
                  <div className="space-y-2">
                    {NOTICE.map((n, i) => (
                      <button type="button" key={n} onClick={() => setChecks((c) => c.map((v, j) => j === i ? !v : v))} className={cn("flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors", checks[i] ? "border-moss bg-moss/10 text-ink" : "border-sand text-ink-muted hover:bg-line")}>
                        <span className={cn("grid size-5 place-items-center rounded-full border-2", checks[i] ? "border-moss bg-moss text-paper-raised" : "border-sand")}>{checks[i] && <Check className="size-3" />}</span>{n}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="block text-sm font-semibold text-ink">Minutes outside
                  <input type="number" min={1} max={240} value={minutes} onChange={(e) => setMinutes(e.target.value)} className="mt-1 w-full rounded-xl border border-sand bg-paper px-3 py-2 text-sm outline-none focus:border-stamp" />
                </label>
                <label className="block text-sm font-semibold text-ink">Reflection
                  <textarea maxLength={140} rows={3} value={reflection} onChange={(e) => setReflection(e.target.value)} placeholder="A red door, a cat on a wall, the smell of bread…" className="mt-1 w-full resize-none rounded-xl border border-sand bg-paper px-3 py-2 font-hand text-xl text-ink outline-none focus:border-stamp" />
                  <span className="flex justify-end"><CharCount value={reflection} /></span>
                </label>
                <button type="submit" disabled={!canDone} className="w-full rounded-xl bg-moss py-3 text-sm font-bold text-paper-raised transition-opacity disabled:opacity-40"><Check className="mr-1 inline size-4" /> Mark done</button>
              </form>
            </div>
          )}
        </div>
      </section>
  );
}
