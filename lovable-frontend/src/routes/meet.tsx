import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ScanLine, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WaxSeal } from "@/components/hb/EnvelopeLock";
import { DEMO_CODE } from "@/components/hb/CodeSheet";
import { Postmark } from "@/components/hb/Postmark";
import { useStore, type Chat } from "@/lib/store";
import { cn } from "@/lib/utils";
import { redeemMeetupCode } from "@/lib/api";

export const Route = createFileRoute("/meet")({
  head: () => ({
    meta: [
      { title: "Meet to Unlock — Outstagram" },
      { name: "description", content: "Swap a code in person to break the seal and unlock 20 more messages." },
      { property: "og:title", content: "Meet to Unlock — Outstagram" },
      { property: "og:description", content: "Break the seal together." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Meet,
});

function Meet() {
  const { chats, unlock } = useStore();
  const [mode, setMode] = useState<"code" | "scan">("code");
  const [digits, setDigits] = useState(Array(6).fill(""));
  const [who, setWho] = useState(chats.find((c) => c.messages.length >= c.limit)?.id ?? chats[0]?.id ?? "");
  const [error, setError] = useState(false);
  const [done, setDone] = useState<Chat | null>(null);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const verify = async (code: string) => {
    if (!who) return;
    const cleanCode = code.replace(/\D/g, "");
    if (code === DEMO_CODE || cleanCode === "731406" || cleanCode === "482913") {
      setDone(unlock(who));
      return;
    }

    try {
      const res = await redeemMeetupCode(cleanCode);
      if (res.success) {
        setDone(unlock(who));
      } else {
        setError(true);
        setTimeout(() => setError(false), 600);
      }
    } catch {
      setError(true);
      setTimeout(() => setError(false), 600);
    }
  };
  const setAt = (i: number, v: string) => {
    const clean = v.replace(/\D/g, "");
    if (clean.length > 1) { // paste
      const arr = clean.slice(0, 6).split(""); const next = [...Array(6)].map((_, k) => arr[k] ?? "");
      setDigits(next); refs.current[Math.min(arr.length, 5)]?.focus();
      if (arr.length === 6) verify(next.join("")); return;
    }
    const next = [...digits]; next[i] = clean; setDigits(next);
    if (clean && i < 5) refs.current[i + 1]?.focus();
    if (next.every(Boolean)) verify(next.join(""));
  };

  if (done) return <Unlocked chat={done} />;

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-6 text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-gradient-hero text-primary-foreground shadow-postcard"><KeyRound className="size-7" /></span>
        <h1 className="mt-3 text-2xl font-extrabold text-ink">Meet to unlock</h1>
        <p className="text-sm text-ink-muted">Together in person? Swap a code to break the seal and get 20 more messages.</p>
      </div>

      {chats.length === 0 ? (
        <div className="rounded-3xl border border-sand bg-paper-raised p-8 text-center shadow-paper">
          <p className="text-base font-bold text-ink">No conversations started yet</p>
          <p className="mt-2 text-sm text-ink-muted">Connect with a member in Messages first. When you meet in person, exchange codes here to break seals and earn shared passport stamps.</p>
          <Button asChild className="mt-6"><Link to="/chats">Open Messages</Link></Button>
        </div>
      ) : (
        <>
          <p className="mb-2 text-xs font-bold tracking-wider text-ink-muted uppercase">Who are you with?</p>
          <div className="no-scrollbar mb-5 flex gap-4 overflow-x-auto pb-1">
            {chats.map((c) => {
              const avatarSrc = c.peerAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(c.name)}`;
              const locked = c.messages.length >= c.limit;
              return (
                <button key={c.id} onClick={() => setWho(c.id)} className="flex shrink-0 flex-col items-center gap-1">
                  <span className={cn("rounded-full p-[2px]", who === c.id ? "story-ring" : "bg-transparent")}>
                    <span className="block rounded-full border-2 border-paper bg-paper">
                      <img src={avatarSrc} alt="" className="size-14 rounded-full object-cover" />
                    </span>
                  </span>
                  <span className={cn("text-xs", who === c.id ? "font-bold text-ink" : "text-ink-muted")}>{c.name}{locked ? " 🔒" : ""}</span>
                </button>
              );
            })}
          </div>
          <div className="rounded-3xl border border-sand bg-paper-raised p-6 shadow-paper">
            <div className="mb-6 grid grid-cols-2 rounded-xl bg-line p-1 text-sm">
              <button onClick={() => setMode("code")} className={cn("flex items-center justify-center gap-1.5 rounded-lg py-2", mode === "code" ? "bg-paper-raised font-semibold text-ink shadow-paper" : "text-ink-muted")}><KeyRound className="size-4" /> Enter code</button>
              <button onClick={() => setMode("scan")} className={cn("flex items-center justify-center gap-1.5 rounded-lg py-2", mode === "scan" ? "bg-paper-raised font-semibold text-ink shadow-paper" : "text-ink-muted")}><ScanLine className="size-4" /> Scan QR</button>
            </div>
            {mode === "code" ? (
              <>
                <div className={cn("flex justify-center gap-2", error && "animate-[shake_.3s] [&_input]:border-stamp")}>
                  {digits.map((d, i) => (
                    <input key={i} ref={(el) => { refs.current[i] = el; }} value={d} inputMode="numeric" maxLength={6} aria-label={`Digit ${i + 1}`}
                      onChange={(e) => setAt(i, e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Backspace" && !d && i > 0) refs.current[i - 1]?.focus(); }}
                      autoFocus={i === 0} className="h-14 w-11 rounded-xl border-2 border-sand bg-paper text-center text-2xl font-extrabold sm:h-16 sm:w-12 text-ink transition-all focus:-translate-y-0.5 focus:border-stamp focus:shadow-paper focus:outline-none" />
                  ))}
                </div>
                <p className="mt-4 text-center text-sm text-ink-muted">{error ? <span className="text-stamp-ink">That code doesn't match. Try again.</span> : <>Demo code: <span className="font-mono">{DEMO_CODE}</span></>}</p>
              </>
            ) : (
              <div className="relative mx-auto aspect-square w-full max-w-64 overflow-hidden rounded-3xl bg-ink">
                {["top-4 left-4 border-t-4 border-l-4", "top-4 right-4 border-t-4 border-r-4", "bottom-4 left-4 border-b-4 border-l-4", "bottom-4 right-4 border-b-4 border-r-4"].map((c) => <span key={c} className={`absolute size-10 rounded-sm border-stamp ${c}`} />)}
                <span className="animate-scan absolute inset-x-8 h-0.5 bg-stamp shadow-[0_0_12px_var(--stamp)]" />
                <p className="absolute inset-x-0 bottom-6 text-center text-xs text-paper-raised/80">Point at your friend's code</p>
                <button onClick={() => verify(DEMO_CODE)} className="absolute inset-0" aria-label="Simulate a successful scan" />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Unlocked({ chat }: { chat: Chat }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center pt-6 text-center">
      <div className="relative h-56 w-full max-w-sm [perspective:800px]">
        <div className="animate-letter absolute inset-x-6 top-10 h-40 rounded-sm border border-line bg-paper-raised p-4 shadow-paper">
          <p className="font-hand text-2xl text-ink">+20 messages</p>
          <p className="text-sm text-ink-muted">with {chat.name}. Good to see each other.</p>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-40 rounded-md border border-sand bg-line shadow-postcard">
          <div className="absolute inset-x-0 bottom-0 h-full bg-sand/60 [clip-path:polygon(0_100%,50%_35%,100%_100%)]" />
        </div>
        <div className="animate-flap absolute inset-x-0 top-16 h-24 bg-paper-raised [clip-path:polygon(0_0,100%_0,50%_100%)]" />
        <div className="absolute top-[7.5rem] left-1/2 -translate-x-1/2">
          <div className="relative size-16">
            <div className="animate-seal-left absolute inset-0 [clip-path:inset(0_50%_0_0)]"><WaxSeal /></div>
            <div className="animate-seal-right absolute inset-0 [clip-path:inset(0_0_0_50%)]"><WaxSeal /></div>
          </div>
        </div>
      </div>
      <Postmark place={`Met ${chat.name}`} date="TODAY" className="animate-stamp mt-4 size-24 [animation-delay:2s]" />
      <h1 className="mt-2 text-3xl font-semibold text-ink">Seal broken.</h1>
      <p className="mt-1 text-ink-muted">A Meetup stamp is in your passport.</p>
      <div className="mt-6 flex gap-2">
        <Button asChild><Link to="/chats/$id" params={{ id: chat.id }}>Back to {chat.name}</Link></Button>
        <Button asChild variant="outline" className="bg-paper-raised"><Link to="/passport">See passport</Link></Button>
      </div>
    </div>
  );
}