import { createFileRoute, Link } from "@tanstack/react-router";
import { Hourglass, ArrowRight, Gift, Lock, Sparkles, Users, Hammer, MapPinned, Mail, Camera } from "lucide-react";
import { QuestCard } from "@/components/hb/QuestCard";
import { WaxSeal } from "@/components/hb/EnvelopeLock";
import { RACK, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Today — Outstagram" },
      { name: "description", content: "Today's quest, a finite rack of ten postcards, friends to meet and hours reclaimed." },
      { property: "og:title", content: "Today — Outstagram" },
      { property: "og:description", content: "Post less. Go somewhere. Meet someone." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Today,
});

const PERKS = [
  { place: "Riverside Cafe", text: "Free chai with your stamp" },
  { place: "Remparts Books", text: "10% off any used atlas" },
  { place: "Corner Bakery", text: "Day-old loaf free after 5pm" },
];

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

const Card = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <section className={cn("rounded-2xl border border-sand bg-paper-raised p-5 shadow-paper overflow-hidden break-words", className)}>{children}</section>
);

function Today() {
  const { hours, seen, rack, chats, stamps, session } = useStore();
  const activeRack = rack || RACK;
  const left = Math.max(0, activeRack.length - seen);
  const first = (session?.name ?? "Friend").split(" ")[0];

  return (
    <div className="space-y-5 px-4 pt-5 sm:px-0 md:pt-0">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="font-hand text-2xl text-stamp-ink">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
          <h1 className="font-serif text-3xl font-semibold text-ink sm:text-5xl leading-tight break-words">{greeting()}, {first}.</h1>
          <p className="mt-1 text-sm sm:text-base text-ink-muted">Post less. Go somewhere. Meet someone.</p>
        </div>
        <div className="flex shrink-0 items-center gap-3 rounded-2xl bg-ink px-4 py-2.5 sm:px-5 sm:py-3 text-paper-raised shadow-postcard self-start sm:self-auto">
          <Hourglass className="size-6 sm:size-7 text-stamp-glow" />
          <div><p className="font-serif text-2xl sm:text-3xl font-semibold leading-none tabular-nums">{hours}h</p><p className="text-[11px] sm:text-xs opacity-75">reclaimed from scrolling</p></div>
        </div>
      </header>

      <QuestCard />

      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between"><h2 className="font-serif text-xl font-semibold text-ink">Today's rack</h2><span className="text-sm text-ink-muted">{left} of {activeRack.length} left</span></div>
          {activeRack.length === 0 ? (
            <div className="py-6 text-center text-sm text-ink-muted">No postcards shared yet today. Be the first to share one!</div>
          ) : (
            <div className="mt-4 flex -space-x-4 sm:-space-x-6 overflow-hidden py-1">
              {activeRack.slice(0, 5).map((c, i) => <img key={c.id} src={c.img} alt={c.place} loading="lazy" className={cn("aspect-[3/2] w-20 sm:w-24 shrink-0 rounded-sm border-2 sm:border-4 border-paper-raised object-cover shadow-paper", i % 2 ? "rotate-2" : "-rotate-2")} />)}
            </div>
          )}
          <p className="mt-4 text-sm text-ink-muted">{left ? "Finite postcards from friends nearby, sideways, then it ends." : "You've seen everything. Go outside."}</p>
          <Link to="/rack" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-stamp px-4 py-2.5 text-sm font-semibold text-primary-foreground">Open today's rack <ArrowRight className="size-4" /></Link>
        </Card>

        <Card>
          <div className="flex items-center justify-between"><h2 className="font-serif text-xl font-semibold text-ink">Friends</h2><Link to="/chats" className="text-sm font-semibold text-stamp-ink">All chats</Link></div>
          {chats.length === 0 ? (
            <div className="py-6 text-center text-sm text-ink-muted">No chats yet. Connect with a registered member to start chatting!</div>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {chats.map((c) => {
                const avatarSrc = c.peerAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(c.name)}`;
                const n = c.messages.length, locked = n >= c.limit;
                return (
                  <li key={c.id}><Link to="/chats/$id" params={{ id: c.id }} className="flex items-center gap-3 py-3">
                    {avatarSrc ? <img src={avatarSrc} alt="" className="size-10 rounded-full object-cover" /> : <span className="grid size-10 place-items-center rounded-full bg-line font-semibold">{c.name[0]}</span>}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-ink">{c.name}</p>
                      <div className="mt-1 h-1 overflow-hidden rounded-full bg-line"><div className={cn("h-full", locked ? "bg-stamp" : "bg-ink-muted")} style={{ width: `${Math.min(100, (n / c.limit) * 100)}%` }} /></div>
                    </div>
                    {locked ? <span className="flex items-center gap-1.5 text-xs font-semibold text-stamp-ink"><WaxSeal className="size-6" /> Meet to unlock</span> : <span className="text-xs tabular-nums text-ink-muted">{n} of {c.limit}</span>}
                  </Link></li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="flex items-center gap-2 font-serif text-xl font-semibold text-ink"><Gift className="size-5 text-stamp" /> Offline rewards</h2>
          <p className="text-sm text-ink-muted">Local perks you unlock by showing up. Never in your rack, never targeted.</p>
          <ul className="mt-3 space-y-2">
            {PERKS.map((o) => {
              const has = stamps.some((s) => s.label === o.place);
              return (
                <li key={o.place} className="flex items-center gap-3 rounded-xl border border-dashed border-sand bg-paper p-3">
                  <div className="flex-1"><p className="font-hand text-xl leading-6 text-ink">{o.text}</p><p className="text-xs text-ink-muted">{o.place}</p></div>
                  {has ? <span className="rounded-full bg-moss px-2.5 py-1 text-xs font-bold text-paper-raised">Ready</span> : <span className="flex items-center gap-1 text-xs text-ink-muted"><Lock className="size-3" /> Need stamp</span>}
                </li>
              );
            })}
          </ul>
        </Card>

        <Card className="bg-ink text-paper-raised">
          <Sparkles className="size-6 text-stamp-glow" />
          <h2 className="mt-2 font-serif text-xl font-semibold">Life coach</h2>
          <p className="mt-1 text-sm opacity-80">This week's experiment: <span className="font-hand text-xl">leave your phone in another room during dinner.</span></p>
          <Link to="/coach" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-paper-raised px-4 py-2.5 text-sm font-semibold text-ink">Talk it through <ArrowRight className="size-4" /></Link>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {([["/capture", "Capture", Camera], ["/group", "Group meetup", Users], ["/make", "Maker shelf", Hammer], ["/map", "Map of moments", MapPinned]] as const).map(([to, l, I]) => (
          <Link key={to} to={to} className="flex flex-col items-center gap-2 rounded-2xl border border-sand bg-paper-raised p-4 text-sm font-semibold text-ink transition-transform hover:-translate-y-0.5">
            <span className="grid size-11 place-items-center rounded-full bg-stamp-soft text-stamp-ink"><I className="size-5" /></span>{l}
          </Link>
        ))}
      </div>
      <p className="flex items-center justify-center gap-2 pb-4 text-xs text-ink-muted"><Mail className="size-3.5" /> That's everything for today. No feed below.</p>
    </div>
  );
}