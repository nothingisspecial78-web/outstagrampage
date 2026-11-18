import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  MapPin,
  MessageCircle,
  UserPlus,
  Check,
  Settings,
  Grid3x3,
  Stamp as StampIcon,
  Hourglass,
  Link2,
  Plus,
  Footprints,
  Gift,
  Users,
  Hammer,
  Lock,
  Coins,
  DollarSign,
  Radio,
  Sparkles,
  Calendar,
  Award,
  Coffee,
  BookOpen,
  Info,
  Wallet,
  ShieldCheck,
  Clock,
  ArrowUpRight,
  Plane,
  Glasses,
  Train,
  TreePine,
  Ticket,
  ChevronLeft,
  ChevronRight,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
  TICKET_PASSES,
  DigitalTicketModal,
  type TicketVoucher,
  getIconForCategory,
} from "@/components/hb/rewards/TicketPasses";
import { Postmark } from "@/components/hb/Postmark";
import { Avatar } from "@/components/hb/AppShell";
import { RACK, useStore, type Stamp, PLACES_INFO } from "@/lib/store";
import { ME, profileFor } from "@/lib/people";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/passport")({
  head: () => ({
    meta: [
      { title: "Passport & Rewards — Outstagram" },
      { name: "description", content: "Your real-world stamps, offline meetup rewards, in-app points withdrawable as cash, and community bulletin." },
      { property: "og:title", content: "Passport & Rewards — Outstagram" },
      { property: "og:description", content: "Stamps and rewards you can only earn offline." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { user?: string; tab?: string } => ({
    user: typeof s["user"] === "string" ? s["user"] : undefined,
    tab: typeof s["tab"] === "string" ? s["tab"] : undefined,
  }),
  component: Profile,
});

function MemberProfile({ handle }: { handle: string }) {
  const p = profileFor(handle);
  const { startChat, addFriendName, friends } = useStore();
  const nav = useNavigate();
  if (!p)
    return (
      <div className="py-20 text-center">
        <h1 className="font-serif text-2xl font-semibold text-ink">Member not found</h1>
        <Link to="/passport" className="mt-3 inline-block text-link underline">Back to your passport</Link>
      </div>
    );
  const first = p.name.split(" ")[0]!;
  const isFriend = friends.includes(first);
  return (
    <div className="mx-auto max-w-[760px]">
      <Link to="/passport" className="mb-4 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft className="size-4" />Your passport
      </Link>
      <header className="flex gap-5 rounded-2xl border border-sand bg-paper-raised p-5 shadow-paper sm:gap-10 sm:p-8">
        <Avatar src={p.avatar} size="size-20 sm:size-32" ring="story" className="shrink-0 self-start" />
        <div className="min-w-0 flex-1 space-y-3">
          <div><h1 className="text-xl text-ink">{p.handle}</h1><p className="font-semibold text-ink">{p.name}</p></div>
          <p className="text-sm text-ink">{p.bio}</p>
          <p className="flex items-center gap-1 text-sm text-ink-muted">
            <MapPin className="size-4" />{p.location} · Friend code <b className="tabular-nums text-ink">{p.code}</b>
          </p>
          <p className="inline-flex items-center gap-1.5 rounded-full bg-moss/10 px-3 py-1 text-sm text-moss">
            <Hourglass className="size-4" /><b>{p.hours}h</b> reclaimed
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={() => { const id = startChat(p.name); nav({ to: "/chats/$id", params: { id } }); }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-stamp px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              <MessageCircle className="size-4" />Message
            </button>
            <button
              disabled={isFriend}
              onClick={() => { addFriendName(first); toast.success(`${first} added as a friend`); }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-line px-4 py-2 text-sm font-semibold text-ink hover:bg-sand disabled:opacity-70"
            >
              {isFriend ? <><Check className="size-4" />Friends</> : <><UserPlus className="size-4" />Add Friend</>}
            </button>
          </div>
        </div>
      </header>
      <h2 className="mt-8 mb-4 font-serif text-xl font-semibold text-ink">{first}'s stamps</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {p.stamps.map((s, i) => (
          <div key={i} className="grid place-items-center rounded-2xl border border-sand bg-paper-raised p-4">
            <Postmark place={s.label} date={s.date} tone={tone(s.kind)} className={i % 2 ? "rotate-6" : ""} />
            <p className="mt-2 text-xs capitalize text-ink-muted">{s.kind}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const tone = (k: Stamp["kind"]) => (k === "quest" ? "moss" : k === "craft" ? "ink" : "stamp") as "moss" | "ink" | "stamp";

const TABS = [
  { id: "rewards", label: "Rewards & Stamps", icon: Gift },
  { id: "bulletin", label: "Local Bulletin", icon: Info },
  { id: "stamps", label: "Passport Stamps", icon: StampIcon },
  { id: "activities", label: "Activities", icon: Footprints },
  { id: "posts", label: "My Postcards", icon: Grid3x3 },
] as const;

// Community Noticeboard / Bulletin: Ads as calm information
const COMMUNITY_NOTICES = [
  {
    id: "b1",
    tag: "Workshop",
    title: "Botanical Watercolor & Seed Exchange",
    place: "Old Greenhouse",
    time: "Saturday · 10:00 AM – 1:00 PM",
    desc: "Free community gathering. Bring your watercolor pads, brushes, and spare heirloom seeds to trade. Hosted by neighborhood gardeners.",
    tone: "moss",
  },
  {
    id: "b2",
    tag: "Book Swap",
    title: "Used Poetry & Atlas Night",
    place: "Remparts Books",
    time: "Tuesday · 6:30 PM – 8:00 PM",
    desc: "Bring one beloved read, take one home. Free herbal mint tea served. No buying required, purely sharing stories.",
    tone: "stamp",
  },
  {
    id: "b3",
    tag: "Music & Gathering",
    title: "Quiet Acoustic Folk on the Pier",
    place: "West Pier",
    time: "Friday · Golden Hour (5:30 PM)",
    desc: "Unamplified string instruments as the sun dips into the harbor. Bring a warm blanket and a thermos of cocoa.",
    tone: "ink",
  },
  {
    id: "b4",
    tag: "Local Craft",
    title: "Sourdough Starter Workshop",
    place: "Corner Bakery",
    time: "Sunday · 9:00 AM",
    desc: "Learn wild yeast fermentation from Master Baker Elena. Free 12-year sourdough starter jar to all participants.",
    tone: "moss",
  },
];

// Offline Place Challenges
const PLACE_CHALLENGES = [
  {
    id: "ch1",
    name: "The Riverside Walk",
    places: ["Riverside Cafe", "West Pier"],
    reward: "Free Artisan Chai & Cinnamon Knot",
    points: 300,
    desc: "Visit both waterside spots to unlock a handmade treat at Riverside Cafe.",
  },
  {
    id: "ch2",
    name: "Quiet Pages & Greenery",
    places: ["Remparts Books", "Old Greenhouse"],
    reward: "15% Off Any Vintage Book + Botanical Plant Cutting",
    points: 250,
    desc: "Spend an afternoon reading and exploring the greenhouses.",
  },
  {
    id: "ch3",
    name: "Dawn Baker’s Trail",
    places: ["Corner Bakery", "Linden Park"],
    reward: "Fresh Sourdough Baguette + Park Companion Badge",
    points: 200,
    desc: "Pick up fresh bread and take a quiet morning stroll through the trees.",
  },
];

const HIGHLIGHTS = [["Pier", 3], ["Books", 2], ["Bakes", 0], ["Walks", 1]] as const;

function Profile() {
  const { user } = Route.useSearch();
  if (user && user !== ME.handle) return <MemberProfile handle={user} />;
  return <MyProfile />;
}

function MyProfile() {
  const { stamps, hours, session, addStamp } = useStore();
  const nav = useNavigate();
  const search = Route.useSearch();
  const initialTab = search.tab && TABS.some((t) => t.id === search.tab)
    ? (search.tab as (typeof TABS)[number]["id"])
    : "rewards";
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>(initialTab);

  useEffect(() => {
    if (search.tab && TABS.some((t) => t.id === search.tab)) {
      setTab(search.tab as (typeof TABS)[number]["id"]);
    }
  }, [search.tab]);
  const [rewardFilter, setRewardFilter] = useState<"all" | "ready" | "challenges" | "meetups">("all");
  const [activeChallenges, setActiveChallenges] = useState<Record<string, number>>({
    "lenskart-frame": 14200,
    "flight-50": 31500,
  });
  const [claimedTicket, setClaimedTicket] = useState<TicketVoucher | null>(null);
  const [points, setPoints] = useState(2850);
  const [talkHours, setTalkHours] = useState(3.5);
  const ticketTrackRef = useRef<HTMLDivElement>(null);

  const scrollTicketPrev = () => {
    if (ticketTrackRef.current) {
      ticketTrackRef.current.scrollBy({ left: -320, behavior: "smooth" });
    }
  };

  const scrollTicketNext = () => {
    if (ticketTrackRef.current) {
      ticketTrackRef.current.scrollBy({ left: 320, behavior: "smooth" });
    }
  };

  const handleActivateChallenge = (t: TicketVoucher) => {
    setActiveChallenges((prev) => ({
      ...prev,
      [t.id]: prev[t.id] !== undefined ? prev[t.id] : 0,
    }));
    toast.success(`Challenge Activated: ${t.title}`, {
      description: `Target: ${t.targetAmount.toLocaleString()} ${t.unit}. Walk, explore & track your progress!`,
    });
  };

  const handleSimulateProgress = (t: TicketVoucher, inc: number) => {
    setActiveChallenges((prev) => {
      const cur = (prev[t.id] || 0) + inc;
      if (cur >= t.targetAmount) {
        toast.success(`🎉 Challenge Completed! Voucher unlocked for ${t.title}`);
        setClaimedTicket(t);
        return { ...prev, [t.id]: t.targetAmount };
      }
      toast.info(`Logged +${inc.toLocaleString()} ${t.unit}! (${cur.toLocaleString()} / ${t.targetAmount.toLocaleString()})`);
      return { ...prev, [t.id]: cur };
    });
  };

  const handleRedeemTicketWithPoints = (t: TicketVoucher) => {
    if (points < t.pointsPrice) {
      toast.error(`Need ${t.pointsPrice.toLocaleString()} pts to redeem. You have ${points.toLocaleString()} pts.`);
      return;
    }
    setPoints((p) => p - t.pointsPrice);
    setClaimedTicket(t);
    toast.success(`Ticket Voucher Claimed! -${t.pointsPrice} pts.`);
  };

  const handleSimulateTalk = (hrs = 1) => {
    setTalkHours((h) => {
      const next = +(h + hrs).toFixed(1);
      const earned = hrs * 300;
      setPoints((p) => p + earned);
      toast.success(`Logged ${hrs}h in-person talk session! +${earned} presence points.`);
      return next;
    });
  };






  const handle = ME.handle;
  const count = (k: Stamp["kind"]) => stamps.filter((s) => s.kind === k).length;
  const stats = [
    [String(17 + count("quest")), "quests"],
    [String(8 + count("meetup")), "meetups"],
    [String(12 + count("place")), "postcards"],
    [String(5 + count("craft")), "crafts"],
  ] as const;

  // Cash withdrawal replaced by physical milestone vouchers & ticket passes

  const simulateCheckin = (placeName: string) => {
    addStamp("place", placeName);
    setPoints((p) => p + 150);
    toast.success(`Stamp verified at ${placeName}! Earned +150 points.`);
  };

  const hasStamp = (label: string) => stamps.some((s) => s.label.toLowerCase().includes(label.toLowerCase()));

  return (
    <div className="mx-auto max-w-[960px] pb-10">
      {/* Profile Header */}
      <header className="flex gap-5 px-1 sm:gap-16 sm:px-6">
        <Avatar src={ME.avatar} size="size-20 sm:size-36" ring="story" className="shrink-0 self-start" />
        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="mr-2 text-xl text-ink font-semibold">{handle}</h1>
            <button onClick={() => toast("Profile editor is in Settings")} className="rounded-lg bg-line px-4 py-1.5 text-sm font-semibold text-ink hover:bg-sand">Edit profile</button>
            <Link to="/settings" aria-label="Settings" className="p-1 text-ink hover:text-stamp"><Settings className="size-6" /></Link>
          </div>
          <ul className="flex gap-4 text-sm sm:gap-8 sm:text-base">
            {stats.map(([n, l]) => (
              <li key={l} className="text-center sm:text-left">
                <b className="block text-ink sm:inline font-bold">{n}</b> <span className="text-ink-muted">{l}</span>
              </li>
            ))}
          </ul>
          <div className="hidden sm:block"><Bio name={session?.name ?? ME.name} hours={hours} points={points} /></div>
        </div>
      </header>
      <div className="mt-4 px-1 sm:hidden"><Bio name={session?.name ?? ME.name} hours={hours} points={points} /></div>

      {/* Highlights */}
      <div className="no-scrollbar mt-8 flex gap-6 overflow-x-auto px-1 sm:px-6">
        {HIGHLIGHTS.map(([l, i]) => (
          <button key={l} onClick={() => toast(`${l} highlight moments`)} className="flex shrink-0 flex-col items-center gap-1.5">
            <span className="rounded-full border border-sand p-1"><img src={RACK[i]?.img} alt="" className="size-16 rounded-full object-cover sm:size-20" /></span>
            <span className="text-xs font-semibold text-ink">{l}</span>
          </button>
        ))}
        <button onClick={() => toast("Create a new memory highlight in Capture")} className="flex shrink-0 flex-col items-center gap-1.5">
          <span className="grid size-[74px] place-items-center rounded-full border border-sand sm:size-[90px]"><Plus className="size-8 text-ink-muted" /></span>
          <span className="text-xs font-semibold text-ink">New</span>
        </button>
      </div>

      {/* Tabs navigation */}
      <nav className="mt-8 flex justify-center gap-4 sm:gap-10 border-t border-sand overflow-x-auto px-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); nav({ search: (prev: any) => ({ ...prev, tab: t.id }), replace: true }); }}
            className={cn(
              "-mt-px flex items-center gap-1.5 border-t py-4 text-xs font-semibold tracking-wider uppercase whitespace-nowrap transition-colors",
              tab === t.id ? "border-stamp text-stamp font-bold" : "border-transparent text-ink-muted hover:text-ink"
            )}
          >
            <t.icon className="size-4" />
            <span>{t.label}</span>
          </button>
        ))}
      </nav>

      {/* TAB 1: REWARDS & STAMPS: TICKETS, CHALLENGES & BRAND PERKS */}
      {tab === "rewards" && (
        <div className="space-y-8 py-6">
          {/* Google Fit Live Step Tracking Station */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border-2 border-sky-300 bg-sky-50/70 p-5 shadow-paper">
            <div className="flex items-center gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-md">
                <Footprints className="size-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-bold text-sky-800 uppercase tracking-wider">
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" /> Google Fit Connected
                  </span>
                  <span className="rounded-full bg-stamp-soft px-2 py-0.5 text-[10px] font-bold text-stamp-ink uppercase">
                    Live REST Sync
                  </span>
                </div>
                <h3 className="mt-1 font-serif text-xl font-bold text-ink">
                  18,450 Steps Recorded Today
                </h3>
                <p className="text-xs text-ink-muted">
                  Auto-syncing with Lenskart Optical 20,000 steps challenge & Star Air 50,000 steps flight voucher.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:self-center">
              <Button
                size="sm"
                onClick={async () => {
                  const s = await syncGoogleFitSteps();
                  // auto-advance step-based challenges
                  const lenskart = TICKET_PASSES.find((t) => t.id === "lenskart-frame");
                  if (lenskart) {
                    setActiveChallenges((prev) => ({ ...prev, [lenskart.id]: Math.min(20000, (prev[lenskart.id] || 16500) + 2000) }));
                  }
                  toast.success("Google Fit steps synced! +2,000 steps added to active brand challenges.");
                }}
                className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-sm cursor-pointer"
              >
                <Zap className="size-3.5 mr-1 text-amber-300" /> Sync Google Fit
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => connectGoogleFit()}
                className="border-sand bg-paper hover:bg-line text-xs font-semibold cursor-pointer"
              >
                Manage Permissions
              </Button>
            </div>
          </div>
          {/* A) Presence Points & New User Multiplier Station */}
          <section className="relative overflow-hidden rounded-3xl border border-sand bg-gradient-to-br from-paper-raised via-paper to-sand/20 p-6 shadow-paper">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-stamp-soft px-3 py-1 text-xs font-bold text-stamp-ink uppercase tracking-wider">
                    <Coins className="size-3.5" /> Real-World Presence Rewards
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-xs font-bold text-amber-800">
                    <Sparkles className="size-3.5 text-amber-600 animate-pulse" /> New Explorer Tier · 2.5x Multiplier Active (Day 6 of 30)
                  </span>
                </div>
                <h2 className="font-serif text-3xl font-extrabold text-ink sm:text-4xl">
                  {points.toLocaleString()} <span className="text-xl font-normal text-ink-muted">pts</span>
                </h2>
                <p className="max-w-xl text-xs sm:text-sm text-ink-muted leading-relaxed">
                  Earn presence points by walking outdoors, talking with friends face-to-face, and staying off algorithmic screens.
                  Redeem your accumulated points directly for real-world airline tickets, handcrafted frames, rail passes, and indie books.
                </p>
                <div className="flex flex-wrap gap-3 pt-1 text-xs font-medium text-ink-muted">
                  <span className="flex items-center gap-1"><Check className="size-3.5 text-moss" /> 150 pts / 1,000 steps walked</span>
                  <span className="flex items-center gap-1"><Check className="size-3.5 text-moss" /> 400 pts / 1-on-1 face-to-face meetup</span>
                  <span className="flex items-center gap-1"><Check className="size-3.5 text-moss" /> 800 pts / 2h phone-free talk</span>
                </div>
              </div>

              {/* Quick Simulator & Stats */}
              <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 border-t lg:border-t-0 lg:border-l border-sand/70 pt-4 lg:pt-0 lg:pl-6">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">Quick Point Earners:</span>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setPoints((p) => p + 375);
                      toast.success("Outdoor walk recorded! +375 pts (with 2.5x New User Bonus).");
                    }}
                    className="border-sand bg-paper hover:bg-line text-xs font-semibold"
                  >
                    <Footprints className="size-3.5 text-stamp mr-1" /> Log 2,500 Steps
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSimulateTalk(1)}
                    className="border-sand bg-paper hover:bg-line text-xs font-semibold"
                  >
                    <Users className="size-3.5 text-moss mr-1" /> Log 1h Real Talk
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* B) Horizontal Carousel of Partner Tickets & Passes */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Ticket className="size-5 text-stamp" />
                  <h3 className="font-serif text-2xl font-bold text-ink">Real-World Partner Tickets & Passes</h3>
                </div>
                <p className="text-xs text-ink-muted">
                  Swipe horizontally to browse passes. Complete physical offline challenges or redeem with presence points.
                </p>
              </div>

              {/* Slider Arrows */}
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={scrollTicketPrev}
                  className="size-8 rounded-full border-sand hover:bg-line"
                  aria-label="Previous ticket"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={scrollTicketNext}
                  className="size-8 rounded-full border-sand hover:bg-line"
                  aria-label="Next ticket"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>

            {/* Horizontal Track */}
            <div
              ref={ticketTrackRef}
              className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x scroll-smooth cursor-grab active:cursor-grabbing"
              style={{ scrollbarWidth: "none" }}
            >
              {TICKET_PASSES.map((t) => {
                const Icon = getIconForCategory(t.category);
                const currentProgress = activeChallenges[t.id];
                const isActive = currentProgress !== undefined;
                const pct = isActive ? Math.min(100, Math.round((currentProgress / t.targetAmount) * 100)) : 0;
                const isCompleted = isActive && currentProgress >= t.targetAmount;

                return (
                  <div
                    key={t.id}
                    className="w-[85vw] max-w-[360px] sm:w-[350px] shrink-0 snap-center rounded-3xl border border-sand bg-paper-raised p-5 shadow-paper flex flex-col justify-between transition-transform hover:-translate-y-1 duration-200"
                  >
                    <div>
                      {/* Image Preview & Category Badge */}
                      <div className="relative mb-3.5 h-36 overflow-hidden rounded-2xl bg-line border border-sand/40">
                        <img src={t.heroImg} alt={t.title} className="h-full w-full object-cover" />
                        <span className="absolute top-2.5 left-2.5 rounded-full bg-paper-raised/90 backdrop-blur px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-stamp-ink shadow-sm">
                          {t.badge}
                        </span>
                        <span className="absolute bottom-2.5 right-2.5 rounded-full bg-ink/80 backdrop-blur px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm flex items-center gap-1">
                          <Icon className="size-3.5 text-amber-300" /> {t.partner}
                        </span>
                      </div>

                      <h4 className="font-serif text-lg font-bold text-ink leading-snug">{t.title}</h4>
                      <p className="mt-1.5 text-xs text-ink-muted leading-relaxed line-clamp-2">{t.rewardDesc}</p>

                      {/* Challenge status or requirement */}
                      <div className="mt-3.5 rounded-2xl border border-sand/60 bg-paper p-3 text-xs">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-ink-muted">Challenge Target:</span>
                          <span className="font-mono font-bold text-ink">{t.targetAmount.toLocaleString()} {t.unit}</span>
                        </div>

                        {isActive ? (
                          <div className="mt-2 space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] font-bold">
                              <span className="text-stamp">Active Challenge</span>
                              <span className="text-ink">{currentProgress.toLocaleString()} / {t.targetAmount.toLocaleString()} ({pct}%)</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-sand/40 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-stamp to-moss transition-all duration-300"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <p className="mt-1 text-[11px] text-ink-muted/80 italic">"{t.tagline}"</p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 pt-3 border-t border-sand/60 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-ink-muted">Redeem instantly:</span>
                        <span className="font-serif font-bold text-ink">{t.pointsPrice.toLocaleString()} pts</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {isActive ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSimulateProgress(t, t.challengeType === "steps" ? 2500 : t.challengeType === "pages" ? 50 : 1)}
                            className="border-sand bg-paper hover:bg-line text-xs font-semibold"
                          >
                            <Zap className="size-3.5 mr-1 text-stamp" />
                            {isCompleted ? "Completed" : t.challengeType === "steps" ? "+2.5k Steps" : t.challengeType === "pages" ? "+50 Pgs" : "+1 Stamp"}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleActivateChallenge(t)}
                            className="border-sand bg-paper hover:bg-line text-xs font-semibold"
                          >
                            Activate Challenge
                          </Button>
                        )}

                        <Button
                          size="sm"
                          onClick={() => {
                            if (isCompleted) {
                              setClaimedTicket(t);
                            } else {
                              handleRedeemTicketWithPoints(t);
                            }
                          }}
                          className={cn(
                            "text-xs font-bold",
                            isCompleted ? "bg-moss text-white hover:bg-moss/90" : "bg-stamp text-primary-foreground hover:bg-stamp-ink"
                          )}
                        >
                          <Ticket className="size-3.5 mr-1" />
                          {isCompleted ? "Claim Voucher" : `Redeem (${t.pointsPrice}p)`}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* C) Direct In-Person Talk & Bluetooth Presence Card */}
          <section className="relative overflow-hidden rounded-3xl border border-sand bg-paper-raised p-6 shadow-paper">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-sand pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="relative flex size-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex size-3 rounded-full bg-emerald-500" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                    BLE Proximity & Real-World Interaction Sensor Active
                  </span>
                </div>
                <h3 className="font-serif text-2xl font-bold text-ink">In-Person Talk & Presence Milestone Rewards</h3>
                <p className="text-xs text-ink-muted">
                  Earn points simply by speaking face-to-face with friends in real life without digital interruptions.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSimulateTalk(1)}
                  className="border-sand bg-paper hover:bg-line text-xs font-semibold"
                >
                  <Users className="size-3.5 mr-1 text-stamp" /> Log +1h Face-to-Face Talk
                </Button>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-sand bg-paper p-4 shadow-sm">
                <div className="flex items-center justify-between text-xs font-bold text-ink">
                  <span>30 Mins Talk</span>
                  <span className="text-moss flex items-center gap-1"><Check className="size-3.5" /> Achieved</span>
                </div>
                <p className="mt-1 text-xs text-ink-muted">Short catch-up over tea or walk.</p>
                <div className="mt-3 font-serif text-base font-bold text-stamp">+200 points awarded</div>
              </div>

              <div className="rounded-2xl border border-sand bg-paper p-4 shadow-sm">
                <div className="flex items-center justify-between text-xs font-bold text-ink">
                  <span>2 Hours Deep Talk</span>
                  <span className="text-moss flex items-center gap-1"><Check className="size-3.5" /> Achieved</span>
                </div>
                <p className="mt-1 text-xs text-ink-muted">Long walk or dinner without phones.</p>
                <div className="mt-3 font-serif text-base font-bold text-stamp">+600 points awarded</div>
              </div>

              <div className="rounded-2xl border-2 border-stamp/60 bg-stamp-soft/30 p-4 shadow-sm">
                <div className="flex items-center justify-between text-xs font-bold text-ink">
                  <span>5 Hours Deep Session</span>
                  <span className="text-stamp font-mono font-bold">{talkHours}h / 5.0h</span>
                </div>
                <p className="mt-1 text-xs text-ink-muted">Afternoon making art or traveling together.</p>
                <div className="mt-3 font-serif text-base font-bold text-stamp-ink">+1,500 pts + Roaster Pass</div>
              </div>

              <div className="rounded-2xl border border-sand bg-paper p-4 shadow-sm">
                <div className="flex items-center justify-between text-xs font-bold text-ink">
                  <span>24/48h Monthly Meetup</span>
                  <span className="text-ink-muted font-bold">Tier 4</span>
                </div>
                <p className="mt-1 text-xs text-ink-muted">Cumulative offline monthly connection time.</p>
                <div className="mt-3 font-serif text-base font-bold text-ink-muted">Explorer Flight Pass Tier</div>
              </div>
            </div>
          </section>

          {/* Reward Filters for Place Challenges */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sand pb-3">
            <div>
              <h3 className="font-serif text-xl font-bold text-ink">Stamps Inside Rewards</h3>
              <p className="text-xs text-ink-muted">Achieved stamps unlock perks; upcoming stamps guide your next walk.</p>
            </div>
            <div className="flex items-center gap-1 rounded-xl bg-line/60 p-1">
              {[
                { id: "all", label: "All Rewards" },
                { id: "ready", label: "Achieved & Ready" },
                { id: "challenges", label: "Place Challenges" },
                { id: "meetups", label: "Offline Meets" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setRewardFilter(f.id as typeof rewardFilter)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                    rewardFilter === f.id ? "bg-paper-raised text-ink shadow-sm font-bold" : "text-ink-muted hover:text-ink"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* B) Offline Meet Reward Tiers (Personal vs Group Meetup) */}
          {(rewardFilter === "all" || rewardFilter === "meetups") && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="size-5 text-stamp" />
                  <h4 className="font-serif text-lg font-bold text-ink">Offline Meet Reward Tiers</h4>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-moss/10 px-2.5 py-0.5 text-xs font-bold text-moss">
                  <Radio className="size-3 animate-pulse" /> BLE Proximity Discovery Active
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Personal Meetup Tier */}
                <div className="relative rounded-2xl border border-sand bg-paper-raised p-5 shadow-paper flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="inline-block rounded-md bg-stamp-soft px-2 py-0.5 text-[11px] font-bold text-stamp-ink uppercase">
                        Tier 1 · 1-on-1 Personal Meet
                      </span>
                      <Postmark place="Meetup: 1-on-1" date="ACTIVE" tone="stamp" className="size-14 -mr-1 -mt-1" />
                    </div>
                    <h5 className="mt-2 font-serif text-xl font-bold text-ink">Coffee Companion Stamp</h5>
                    <p className="mt-1 text-xs text-ink-muted">
                      Meet any friend in person for at least 15 minutes. Automatically sensed via offline peer-to-peer connection.
                    </p>
                    <ul className="mt-3 space-y-1.5 text-xs text-ink">
                      <li className="flex items-center gap-2 font-medium">
                        <Check className="size-3.5 text-moss" /> +20 extra DM messages unlocked
                      </li>
                      <li className="flex items-center gap-2 font-medium">
                        <Check className="size-3.5 text-moss" /> +250 in-app points ($2.50 cash value)
                      </li>
                      <li className="flex items-center gap-2 font-medium">
                        <Check className="size-3.5 text-moss" /> Personal meetup passport postmark
                      </li>
                    </ul>
                  </div>
                  <div className="mt-5 pt-3 border-t border-sand flex items-center justify-between">
                    <span className="text-xs text-ink-muted">3 meetups this month</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        addStamp("meetup", "with Friend");
                        setPoints((p) => p + 250);
                        toast.success("1-on-1 meetup logged! +250 points and 20 messages unlocked.");
                      }}
                      className="border-sand bg-paper hover:bg-line text-xs"
                    >
                      Log Personal Meet
                    </Button>
                  </div>
                </div>

                {/* Group Meetup Tier */}
                <div className="relative rounded-2xl border border-sand bg-paper-raised p-5 shadow-paper flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="inline-block rounded-md bg-moss/20 px-2 py-0.5 text-[11px] font-bold text-moss uppercase">
                        Tier 2 · Group Meetup (3+ People)
                      </span>
                      <Postmark place="Community Meet" date="TIER 2" tone="moss" className="size-14 -mr-1 -mt-1" />
                    </div>
                    <h5 className="mt-2 font-serif text-xl font-bold text-ink">Community Circle Stamp</h5>
                    <p className="mt-1 text-xs text-ink-muted">
                      Gather with 3 or more Outstagram members at a local park, craft workshop, or cafe.
                    </p>
                    <ul className="mt-3 space-y-1.5 text-xs text-ink">
                      <li className="flex items-center gap-2 font-medium">
                        <Check className="size-3.5 text-moss" /> +500 in-app points ($5.00 cash value)
                      </li>
                      <li className="flex items-center gap-2 font-medium">
                        <Check className="size-3.5 text-moss" /> 20% Group Table Voucher at Corner Bakery
                      </li>
                      <li className="flex items-center gap-2 font-medium">
                        <Check className="size-3.5 text-moss" /> Exclusive Community Circle gold stamp
                      </li>
                    </ul>
                  </div>
                  <div className="mt-5 pt-3 border-t border-sand flex items-center justify-between">
                    <span className="text-xs text-ink-muted">Next meetup: Saturday 11am</span>
                    <Button
                      size="sm"
                      onClick={() => {
                        addStamp("meetup", "Group Meetup");
                        setPoints((p) => p + 500);
                        toast.success("Group meetup stamped! +500 points and 20% group voucher unlocked.");
                      }}
                      className="bg-moss hover:bg-moss/90 text-paper-raised text-xs"
                    >
                      Log Group Meet
                    </Button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* C) "Visit a Place" Challenges with Stamp Verification */}
          {(rewardFilter === "all" || rewardFilter === "challenges") && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="size-5 text-stamp" />
                  <h4 className="font-serif text-lg font-bold text-ink">"Visit a Place" Neighborhood Challenges</h4>
                </div>
                <span className="text-xs text-ink-muted">Complete visits to unlock real treats</span>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {PLACE_CHALLENGES.map((ch) => {
                  const completedCount = ch.places.filter((p) => hasStamp(p)).length;
                  const isDone = completedCount === ch.places.length;
                  return (
                    <div
                      key={ch.id}
                      className={cn(
                        "rounded-2xl border p-5 shadow-paper flex flex-col justify-between transition-all",
                        isDone ? "border-moss/40 bg-moss/5" : "border-sand bg-paper-raised"
                      )}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-stamp-ink uppercase tracking-wider">
                            +{ch.points} Points
                          </span>
                          {isDone ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-moss px-2 py-0.5 text-[10px] font-bold text-paper-raised">
                              <Check className="size-3" /> Unlocked
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold text-ink-muted">
                              {completedCount}/{ch.places.length} Stamps
                            </span>
                          )}
                        </div>

                        <h5 className="mt-2 font-serif text-lg font-bold text-ink">{ch.name}</h5>
                        <p className="mt-1 text-xs text-ink-muted">{ch.desc}</p>

                        <div className="mt-4 space-y-2">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">Required Stamps:</p>
                          {ch.places.map((place) => {
                            const stamped = hasStamp(place);
                            return (
                              <div
                                key={place}
                                className="flex items-center justify-between rounded-lg bg-paper px-2.5 py-1.5 border border-sand/70 text-xs"
                              >
                                <span className="font-medium text-ink">{place}</span>
                                {stamped ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-moss">
                                    <Check className="size-3" /> Stamped
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => simulateCheckin(place)}
                                    className="text-[10px] text-stamp-ink font-semibold hover:underline"
                                  >
                                    Verify visit
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        <div className="mt-4 rounded-xl border border-dashed border-sand bg-paper p-2.5">
                          <p className="text-[11px] font-bold text-ink-muted uppercase">Unlocked Perk:</p>
                          <p className="font-hand text-lg text-ink">{ch.reward}</p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-sand">
                        {isDone ? (
                          <Button
                            size="sm"
                            onClick={() => {
                              setRedeemModal(ch.reward);
                              toast.success("Ready to redeem at the counter!");
                            }}
                            className="w-full bg-moss hover:bg-moss/90 text-paper-raised text-xs font-bold"
                          >
                            Redeem Perk Voucher
                          </Button>
                        ) : (
                          <div className="flex items-center justify-center gap-1 text-xs text-ink-muted py-1">
                            <Lock className="size-3.5" /> Visit all {ch.places.length} spots
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* D) Stamps Achieved Displayed Cleanly Alongside Rewards */}
          {(rewardFilter === "all" || rewardFilter === "ready") && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StampIcon className="size-5 text-stamp" />
                  <h4 className="font-serif text-lg font-bold text-ink">Individual Place Vouchers & Stamps</h4>
                </div>
                <span className="text-xs text-ink-muted">Present your stamped passport at the shop counter</span>
              </div>

              <div className="space-y-3">
                {[
                  { place: "Riverside Cafe", perk: "Free artisan cup of chai or drip coffee", need: "Riverside Cafe stamp", pointsValue: 150 },
                  { place: "Remparts Books", perk: "10% off any vintage hardcover or atlas", need: "Remparts Books stamp", pointsValue: 200 },
                  { place: "Corner Bakery", perk: "Complimentary day-old artisan sourdough loaf", need: "Corner Bakery stamp", pointsValue: 150 },
                  { place: "West Pier", perk: "Seaside panoramic postcard print by local artist", need: "West Pier stamp", pointsValue: 150 },
                ].map((v) => {
                  const achieved = hasStamp(v.place);
                  return (
                    <div
                      key={v.place}
                      className={cn(
                        "flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border-2 border-dashed p-4 transition-all",
                        achieved ? "border-moss/50 bg-paper-raised shadow-paper" : "border-sand bg-paper/60 opacity-80"
                      )}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <Postmark
                          place={v.place}
                          date={achieved ? "ACHIEVED" : "LOCKED"}
                          tone={achieved ? "moss" : "ink"}
                          className={cn("size-16 shrink-0", !achieved && "opacity-45")}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h5 className="font-hand text-2xl text-ink leading-tight">{v.perk}</h5>
                            {achieved && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-moss/10 px-2 py-0.5 text-[11px] font-bold text-moss">
                                <Check className="size-3" /> Ready
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-ink-muted">
                            {v.place} · {achieved ? "Stamp in passport · verified" : `Needs a ${v.need}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:self-center">
                        {achieved ? (
                          <Button
                            size="sm"
                            onClick={() => {
                              setRedeemModal(`${v.place}: ${v.perk}`);
                            }}
                            className="bg-moss hover:bg-moss/90 text-paper-raised text-xs font-bold px-4"
                          >
                            Redeem
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => simulateCheckin(v.place)}
                            className="border-sand bg-paper hover:bg-line text-xs"
                          >
                            <Lock className="size-3.5 mr-1" /> Check in here
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}

      {/* TAB 2: COMMUNITY NOTICEBOARD (Ads as Calm Information - User Request Point 12) */}
      {tab === "bulletin" && (
        <div className="space-y-6 py-6">
          <div className="rounded-2xl border border-sand bg-paper-raised p-6 shadow-paper">
            <div className="flex items-start gap-4">
              <span className="grid size-12 place-items-center rounded-2xl bg-stamp-soft text-stamp-ink shrink-0">
                <Info className="size-6" />
              </span>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-stamp-ink">Anti-Ad Philosophy</span>
                <h3 className="font-serif text-2xl font-bold text-ink">Ads as Calm Information, Not Tracking</h3>
                <p className="mt-1 text-sm text-ink-muted leading-relaxed">
                  Outstagram has no programmatic ads, no retargeting pixels, and no behavioral profiling.
                  Instead, we have this <b>Community Noticeboard</b>: calm, local announcements from neighborhood shops,
                  craft workshops, and book swaps. Informative, static, and privacy-respecting.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {COMMUNITY_NOTICES.map((n) => (
              <article
                key={n.id}
                className="paper-card relative flex flex-col justify-between p-6 transition-transform hover:-translate-y-0.5"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-stamp-soft/80 px-2 py-0.5 text-[11px] font-bold text-stamp-ink uppercase">
                      {n.tag}
                    </span>
                    <Postmark place={n.place} date="NOTICE" tone={n.tone as any} className="size-14 -mr-2 -mt-2" />
                  </div>

                  <h4 className="mt-3 font-serif text-xl font-bold text-ink">{n.title}</h4>
                  <p className="mt-1.5 text-xs text-ink font-medium flex items-center gap-1.5 text-stamp-ink">
                    <MapPin className="size-3.5" /> {n.place}
                  </p>
                  <p className="text-xs text-ink-muted flex items-center gap-1.5 mt-0.5">
                    <Clock className="size-3.5" /> {n.time}
                  </p>

                  <p className="mt-3 text-xs text-ink-muted leading-relaxed">
                    {n.desc}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-sand flex items-center justify-between text-xs">
                  <span className="text-ink-muted">Free & open to neighbors</span>
                  <button
                    onClick={() => toast.success(`Saved "${n.title}" to your offline calendar.`)}
                    className="font-bold text-stamp-ink hover:underline inline-flex items-center gap-1"
                  >
                    Save notice <ArrowUpRight className="size-3.5" />
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className="rounded-2xl border border-dashed border-sand bg-paper p-5 text-center">
            <p className="font-serif text-lg font-bold text-ink">Are you an independent local maker or shop?</p>
            <p className="text-xs text-ink-muted mt-1 max-w-md mx-auto">
              Post an informative notice on the board without paying an ad broker. Free for local community groups and verified artisans.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info("Partner submissions can be registered with the local community admin.")}
              className="mt-3 border-sand"
            >
              Submit a Community Notice
            </Button>
          </div>
        </div>
      )}

      {/* TAB 3: PASSPORT STAMPS */}
      {tab === "stamps" && (
        <div className="py-6">
          <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl bg-ink p-6 text-paper-raised shadow-postcard">
            <div className="flex items-center gap-4">
              <Hourglass className="size-10 text-stamp-glow shrink-0" />
              <div>
                <p className="font-serif text-4xl sm:text-5xl font-semibold leading-none">{hours}h</p>
                <p className="text-sm opacity-80 mt-1">reclaimed from scrolling · {stamps.length} stamps in your passport</p>
              </div>
            </div>
            <div className="text-right sm:border-l sm:border-line/20 sm:pl-6">
              <p className="font-serif text-2xl font-bold text-moss">{points} Points</p>
              <p className="text-xs text-paper-raised/75">Earned offline</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stamps.map((s, i) => (
              <div key={s.id} className="paper-card animate-rise flex flex-col items-center p-4" style={{ animationDelay: `${i * 40}ms` }}>
                <Postmark place={s.label} date={s.date} tone={tone(s.kind)} className={i % 2 ? "rotate-6" : ""} />
                <span className="mt-2 text-[11px] font-bold tracking-widest text-ink-muted uppercase">{s.kind} stamp</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: ACTIVITIES */}
      {tab === "activities" && (
        <div className="grid gap-3 py-6 sm:grid-cols-2">
          {([[Footprints, "Quests completed", stats[0][0], "moss"], [Users, "Meetups in person", stats[1][0], "stamp"], [StampIcon, "Postcards stamped", stats[2][0], "stamp"], [Hammer, "Crafts logged", stats[3][0], "ink"]] as const).map(([I, l, n, t]) => (
            <div key={l} className="flex items-center gap-4 rounded-2xl border border-sand bg-paper-raised p-5 shadow-paper">
              <span className={cn("grid size-12 place-items-center rounded-full", t === "moss" ? "bg-moss/15 text-moss" : t === "ink" ? "bg-line text-ink" : "bg-stamp-soft text-stamp-ink")}><I className="size-6" /></span>
              <div><p className="font-serif text-3xl font-semibold text-ink">{n}</p><p className="text-sm text-ink-muted">{l}</p></div>
            </div>
          ))}
          <p className="text-center text-xs text-ink-muted sm:col-span-2">Just for you. No streaks, no rankings, nobody else sees this.</p>
        </div>
      )}

      {/* TAB 5: MY POSTCARDS */}
      {tab === "posts" && (
        <div className="grid grid-cols-2 gap-4 py-6 sm:grid-cols-3">
          {RACK.slice(0, 6).map((c, i) => (
            <figure key={i} className={cn("rounded-sm border border-sand bg-paper-raised p-2 shadow-paper", i % 2 ? "rotate-1" : "-rotate-1")}>
              <img src={c.img} alt={c.place} loading="lazy" className="aspect-[3/2] w-full object-cover rounded-sm" />
              <figcaption className="mt-1.5 font-hand text-lg leading-5 text-ink">{c.place}</figcaption>
            </figure>
          ))}
        </div>
      )}

      <DigitalTicketModal
        ticket={claimedTicket}
        onClose={() => setClaimedTicket(null)}
        userName={session?.name || "Sam"}
      />

      {/* REDEEM VOUCHER MODAL */}
      <Dialog open={redeemModal !== null} onOpenChange={() => setRedeemModal(null)}>
        <DialogContent className="border-sand bg-paper-raised sm:max-w-md text-center">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-bold">Voucher Ready to Redeem</DialogTitle>
            <DialogDescription>Show this screen to the cashier or barista</DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <Postmark place="VERIFIED" date="TODAY" tone="moss" className="size-24 mx-auto" />
            <div className="rounded-2xl border-2 border-dashed border-sand bg-paper p-4">
              <p className="font-hand text-2xl text-ink font-bold">{redeemModal}</p>
              <p className="mt-2 font-mono text-sm tracking-widest text-stamp-ink font-bold">CODE: OUT-PASS-784</p>
            </div>
            <p className="text-xs text-ink-muted">
              One redemption per visit. Stamped in your Outstagram passport.
            </p>
          </div>

          <Button onClick={() => setRedeemModal(null)} className="w-full bg-ink text-paper-raised">
            Done
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Bio({ name, hours, points }: { name: string; hours: number; points: number }) {
  return (
    <div className="space-y-1.5 text-sm">
      <p className="font-semibold text-ink">{name}</p>
      <p className="text-ink">Walking more, scrolling less. Collecting stamps, not likes. 📍 Riverside</p>
      <a className="flex items-center gap-1 font-semibold text-link hover:underline" href="#">
        <Link2 className="size-3.5" />outstagram.app/sam
      </a>
      <div className="flex flex-wrap gap-1.5 pt-1">
        <span className="inline-flex items-center gap-1 rounded-full bg-stamp px-2.5 py-1 text-xs font-bold text-primary-foreground">
          <Hourglass className="size-3" />{hours}h reclaimed
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-moss/20 px-2.5 py-1 text-xs font-bold text-moss">
          <Coins className="size-3" />{points} pts (~ ${(points / 100).toFixed(2)})
        </span>
        {["City explorer", "Pier regular", "Book swapper"].map((t) => (
          <span key={t} className="rounded-full bg-line px-2.5 py-1 text-xs font-semibold text-ink">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
