import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Users, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FakeQR } from "@/components/hb/CodeSheet";
import { useStore } from "@/lib/store";
import { getCachedRealUsers } from "@/lib/people";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/group")({
  head: () => ({
    meta: [
      { title: "Group meetup — Outstagram" },
      { name: "description", content: "Gather three or more friends in one place and earn a shared Group stamp." },
      { property: "og:title", content: "Group meetup — Outstagram" },
      { property: "og:description", content: "Three friends, one place, one shared stamp." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Group,
});

const QUESTS = ["Photo walk", "Book swap", "Picnic"];

function Group() {
  const { groupStamp } = useStore();
  const [mode, setMode] = useState<"host" | "join">("host");
  const [joined, setJoined] = useState(0);
  const [quest, setQuest] = useState(QUESTS[0]!);
  const [code, setCode] = useState("");
  const [done, setDone] = useState(false);
  const need = 3;
  useEffect(() => {
    if (mode !== "host" || done || joined >= need) return;
    const t = setTimeout(() => setJoined((j) => j + 1), 1800);
    return () => clearTimeout(t);
  }, [joined, mode, done]);
  const finish = () => { setDone(true); groupStamp(`Group · ${quest}`); toast.success("Group stamp added to everyone's Passport"); };
  const pct = Math.min(1, joined / need);

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <header className="flex items-center gap-4"><span className="grid size-14 place-items-center rounded-2xl bg-gradient-hero text-primary-foreground shadow-postcard"><Users className="size-7" /></span><div><h1 className="text-2xl font-extrabold text-ink">Group meetup</h1><p className="text-sm text-ink-muted">3+ friends, one place, one shared stamp</p></div></header>
      <div className="grid grid-cols-2 rounded-2xl border border-sand bg-paper p-1">
        {(["host", "join"] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)} className={cn("rounded-xl py-2.5 text-sm font-bold", mode === m ? "bg-paper-raised text-ink shadow-paper" : "text-ink-muted")}>{m === "host" ? "Host a group" : "Join with code"}</button>
        ))}
      </div>

      {done ? (
        <div className="rounded-2xl border border-sand bg-paper-raised shadow-paper animate-rise p-8 text-center">
          <div className="mx-auto grid size-28 rotate-[-8deg] place-items-center rounded-full border-4 border-dashed border-moss text-center text-moss">
            <div><Users className="mx-auto size-7" /><p className="mt-1 text-xs font-extrabold uppercase">{quest}</p></div>
          </div>
          <h2 className="mt-4 text-2xl font-extrabold text-ink">Shared stamp landed</h2>
          <p className="text-sm text-ink-muted">Everyone here got the same stamp. Now go do the {quest.toLowerCase()}.</p>
        </div>
      ) : mode === "host" ? (
        <section className="rounded-2xl border border-sand bg-paper-raised shadow-paper p-6 text-center">
          <div className="flex justify-center gap-2">
            {QUESTS.map((q) => <button key={q} onClick={() => setQuest(q)} className={cn("rounded-full border px-3 py-1 text-xs font-semibold", quest === q ? "border-stamp bg-stamp-soft text-stamp-ink" : "border-sand text-ink-muted")}>{q}</button>)}
          </div>
          <div className="relative mx-auto mt-6 size-52">
            <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90"><circle cx="50" cy="50" r="46" fill="none" strokeWidth="4" className="stroke-line" /><circle cx="50" cy="50" r="46" fill="none" strokeWidth="4" strokeLinecap="round" className="stroke-stamp transition-all duration-700" strokeDasharray={289} strokeDashoffset={289 * (1 - pct)} /></svg>
            <div className="absolute inset-6 grid place-items-center"><FakeQR /></div>
          </div>
          <p className="mt-4 font-mono text-3xl font-extrabold tracking-[0.3em] text-ink">731 406</p>
          <p className="mt-1 text-sm text-ink-muted">{Math.min(joined, need)} of {need} needed · code expires in 10 min</p>
          <div className="mt-4 flex justify-center -space-x-2">
            {Array.from({ length: Math.min(joined, need) }).map((_, i) => {
              const real = getCachedRealUsers();
              const p = real[i];
              const avatar = p?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=Friend${i + 1}`;
              return <img key={i} src={avatar} alt={`Friend ${i + 1}`} className="animate-rise size-10 rounded-full border-2 border-paper-raised" />;
            })}
          </div>
          <Button className="mt-5 w-full" disabled={joined < need} onClick={finish}>{joined < need ? "Waiting for friends…" : <><Check /> Everyone's here — stamp it</>}</Button>
        </section>
      ) : (
        <section className="rounded-2xl border border-sand bg-paper-raised shadow-paper p-6">
          <p className="text-sm text-ink-muted">Ask the host for their 6-digit code. You need to be in the same place.</p>
          <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (code.replace(/\D/g, "") === "731406") finish(); else toast.error("That code doesn't match an open group"); }}>
            <Input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" maxLength={7} placeholder="731 406" className="bg-paper font-mono text-lg tracking-widest" />
            <Button type="submit" disabled={code.replace(/\D/g, "").length !== 6}>Join</Button>
          </form>
          <p className="mt-3 text-xs text-ink-muted">Sample code: 731406</p>
        </section>
      )}
    </div>
  );
}