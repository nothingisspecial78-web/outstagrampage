import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Home, Clapperboard, Send, Search, Heart, PlusSquare, Menu, Footprints, KeyRound, Sparkles, Hammer, Settings, LayoutGrid, Instagram, Hourglass, X, Users, MapPinned, Store as StoreIcon, ShieldCheck, LogOut, FileText, Lock, Gift } from "lucide-react";
import { useState, type ReactNode } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useStore } from "@/lib/store";
import { ME, PEOPLE, searchPeople } from "@/lib/people";
import { cn } from "@/lib/utils";

export function Wordmark({ className }: { className?: string }) {
  return <span className={cn("font-logo text-3xl leading-none text-ink", className)}>Outstagram</span>;
}
export function HoursChip() {
  const { hours } = useStore();
  return (
    <Link to="/passport" className="inline-flex items-center gap-1.5 rounded-full bg-stamp-soft px-3 py-1.5 text-xs font-semibold text-stamp-ink">
      <Hourglass className="size-3.5" /> {hours}h reclaimed
    </Link>
  );
}
export function Avatar({ src, size = "size-8", ring, className }: { src: string; size?: string; ring?: "story" | "seen"; className?: string }) {
  const img = <img src={src} alt="" className={cn("rounded-full bg-line object-cover", size, ring && "border-2 border-paper-raised")} />;
  if (!ring) return <span className={cn("inline-flex shrink-0", className)}>{img}</span>;
  return <span className={cn("inline-flex shrink-0 rounded-full p-[2px]", ring === "story" ? "story-ring" : "seen-ring", className)}>{img}</span>;
}

type Panel = null | "search" | "notifications" | "menu";
const MORE = [
  { to: "/quest", label: "Daily Quest", icon: Footprints },
  { to: "/meet", label: "Meet to Unlock", icon: KeyRound },
  { to: "/coach", label: "Life Coach", icon: Sparkles },
  { to: "/make", label: "Maker Shelf", icon: Hammer },
  { to: "/group", label: "Group Meetup", icon: Users },
  { to: "/map", label: "Map of Moments", icon: MapPinned },
  { to: "/places", label: "Places & Offers", icon: StoreIcon },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;
const NOTES = [
  { p: PEOPLE[0]!, t: "sent you a thank-you on your Riverside Cafe postcard.", time: "2h" },
  { p: PEOPLE[2]!, t: "met you at Linden Park. Chat unlocked +20.", time: "1d" },
  { p: PEOPLE[1]!, t: "started following you.", time: "2d" },
  { p: PEOPLE[4]!, t: "liked your moment.", time: "3d" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { demo, chats, session, signOut } = useStore();
  const navigate = useNavigate();
  const isAdmin = session?.role === "admin";
  const path = useLocation({ select: (l) => l.pathname });
  const search = useLocation({ select: (l) => l.search as Record<string, string | undefined> });
  const [panel, setPanel] = useState<Panel>(null);
  const [seenNotes, setSeenNotes] = useState(false);
  const unread = 2;
  const toggle = (p: Panel) => { setPanel((c) => (c === p ? null : p)); if (p === "notifications") setSeenNotes(true); };
  const on = (to: string) => panel === null && (to === "/" ? path === "/" : path.startsWith(to));
  const isRewardsActive = on("/passport") && (search?.tab === "rewards" || (!search?.tab && !path.startsWith("/passport/")));
  const isPassportActive = on("/passport") && search?.tab === "stamps";
  const collapsed = panel !== null;

  const item = (label: string, icon: ReactNode, active: boolean, extra?: ReactNode) => (
    <span className={cn("flex items-center gap-4 rounded-lg p-3 text-[15px] transition-colors group-hover:bg-line", active && "font-bold")}>
      <span className="relative transition-transform group-hover:scale-105 group-active:scale-95">{icon}{extra}</span>
      <span className={cn("hidden xl:inline", collapsed && "xl:hidden")}>{label}</span>
    </span>
  );
  const badge = <span className="absolute -top-1.5 -right-1.5 grid size-[18px] place-items-center rounded-full bg-badge text-[11px] font-bold text-primary-foreground ring-2 ring-paper-raised">{unread}</span>;
  const dot = !seenNotes && <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-badge ring-2 ring-paper-raised" />;

  return (
    <div className="min-h-screen bg-paper-raised">
      {demo && <div role="status" className="sticky top-0 z-50 bg-demo py-1.5 text-center text-xs font-bold tracking-widest text-demo-foreground">DEMO MODE: location check simulated</div>}

      {/* Desktop / tablet rail */}
      <aside className={cn("fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-sand bg-paper-raised px-3 pt-8 pb-5 md:flex md:w-[72px] xl:w-[244px]", collapsed && "xl:w-[72px]")}>
        <Link to="/" className="mb-6 px-3 pb-4" aria-label="Outstagram home">
          <Instagram className={cn("size-6 xl:hidden", collapsed && "xl:block")} />
          <Wordmark className={cn("hidden text-[28px] xl:block", collapsed && "xl:hidden")} />
        </Link>
        <nav className="flex flex-1 flex-col gap-1" aria-label="Main">
          <Link to="/" className="group" onClick={() => setPanel(null)}>{item("Home", <Home className={cn("size-6", on("/") && "fill-ink")} />, on("/"))}</Link>
          <Link to="/rack" className="group" onClick={() => setPanel(null)}>{item("Rack", <Clapperboard className="size-6" />, on("/rack"))}</Link>
          <Link to="/chats" className="group" onClick={() => setPanel(null)}>{item("Messages", <Send className="size-6" />, on("/chats"), badge)}</Link>
          <button className="group text-left" onClick={() => toggle("search")}>{item("Search", <Search className="size-6" />, panel === "search")}</button>
          <Link to="/capture" className="group" onClick={() => setPanel(null)}>{item("Create", <PlusSquare className="size-6" />, on("/capture"))}</Link>
          <Link to="/passport" search={{ tab: "rewards" }} className="group" onClick={() => setPanel(null)}>{item("Rewards", <Gift className={cn("size-6", isRewardsActive && "text-stamp stroke-[2.5]")} />, isRewardsActive)}</Link>
          <Link to="/passport" search={{ tab: "stamps" }} className="group" onClick={() => setPanel(null)}>{item("Passport", <Avatar src={ME.avatar} size="size-6" className={cn(isPassportActive && "rounded-full ring-2 ring-ink")} />, isPassportActive)}</Link>
          <div className="mt-auto flex flex-col gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger className="group text-left outline-none">{item("More", <Menu className="size-6" />, false)}</DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-64 rounded-2xl border-sand bg-paper-raised p-2 shadow-postcard">
                {MORE.map((m) => (
                  <DropdownMenuItem key={m.to} asChild className="rounded-lg p-3"><Link to={m.to}><m.icon className="size-5" />{m.label}</Link></DropdownMenuItem>
                ))}
                {isAdmin && <DropdownMenuItem asChild className="rounded-lg p-3 font-semibold text-stamp-ink"><Link to="/admin"><ShieldCheck className="size-5" />Admin console</Link></DropdownMenuItem>}
                <div className="my-1 border-t border-sand" />
                <DropdownMenuItem asChild className="rounded-lg p-2.5 text-xs text-ink-muted hover:text-ink"><Link to="/terms"><FileText className="size-4" />Terms of Service</Link></DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-lg p-2.5 text-xs text-ink-muted hover:text-ink"><Link to="/privacy"><Lock className="size-4" />Privacy Policy</Link></DropdownMenuItem>
                <DropdownMenuItem onSelect={() => { signOut(); navigate({ to: "/login" }); }} className="rounded-lg p-3"><LogOut className="size-5" />Log out {session?.name ? session.name.split(" ")[0] : ""}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Link to="/meet" className="group">{item("From Hereabouts", <LayoutGrid className="size-6" />, false)}</Link>
          </div>
        </nav>
      </aside>

      {/* Slide-out panels & Mobile Drawer */}
      {panel && (
        <div className="fixed inset-0 z-50">
          <div
            aria-hidden="true"
            className="fixed inset-0 bg-ink/40 backdrop-blur-xs transition-opacity"
            onClick={() => setPanel(null)}
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-label={panel === "search" ? "Search panel" : panel === "menu" ? "Navigation menu" : "Notifications panel"}
            className="fixed inset-y-0 left-0 z-[60] flex w-[85vw] max-w-[360px] md:w-[397px] md:left-[72px] flex-col border-r border-sand bg-paper-raised shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-sand px-5 py-4 bg-paper">
              <div className="flex items-center gap-2">
                <Wordmark className="text-2xl text-ink" />
                <span className="rounded-full bg-stamp-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-stamp-ink">
                  {panel === "search" ? "Search" : panel === "menu" ? "Menu" : "Notes"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPanel(null)}
                aria-label="Close"
                className="flex items-center justify-center size-9 rounded-full text-ink hover:bg-line active:scale-95 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {panel === "search" ? (
                <SearchPanel onPick={() => setPanel(null)} />
              ) : panel === "menu" ? (
                <div className="flex flex-col gap-1 p-4 pb-20">
                  <div className="mb-3 px-2 py-1">
                    <HoursChip />
                  </div>
                  <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-ink-muted">Main Sections</p>
                  <Link
                    to="/"
                    onClick={() => setPanel(null)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium text-ink transition-colors hover:bg-line"
                  >
                    <Home className="size-5 text-stamp-ink" />
                    <span>Home</span>
                  </Link>
                  <Link
                    to="/rack"
                    onClick={() => setPanel(null)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium text-ink transition-colors hover:bg-line"
                  >
                    <Clapperboard className="size-5 text-stamp-ink" />
                    <span>Finite Rack</span>
                  </Link>
                  <Link
                    to="/passport"
                    search={{ tab: "rewards" }}
                    onClick={() => setPanel(null)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium text-stamp font-semibold transition-colors hover:bg-line"
                  >
                    <Gift className="size-5 text-stamp" />
                    <span>Rewards & Ticket Passes</span>
                  </Link>
                  <Link
                    to="/capture"
                    onClick={() => setPanel(null)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium text-ink transition-colors hover:bg-line"
                  >
                    <PlusSquare className="size-5 text-stamp-ink" />
                    <span>Capture Moment</span>
                  </Link>
                  <Link
                    to="/chats"
                    onClick={() => setPanel(null)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium text-ink transition-colors hover:bg-line"
                  >
                    <Send className="size-5 text-stamp-ink" />
                    <span className="flex items-center gap-2">
                      Chats <span className="rounded-full bg-badge px-1.5 py-0.2 text-[10px] font-bold text-primary-foreground">{unread}</span>
                    </span>
                  </Link>
                  <Link
                    to="/passport"
                    search={{ tab: "stamps" }}
                    onClick={() => setPanel(null)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium text-ink transition-colors hover:bg-line"
                  >
                    <Avatar src={ME.avatar} size="size-5" />
                    <span>Passport & Stamps</span>
                  </Link>

                  <div className="my-2 border-t border-sand" />
                  <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-ink-muted">Explore & Offline Quests</p>
                  {MORE.map((m) => (
                    <Link
                      key={m.to}
                      to={m.to}
                      onClick={() => setPanel(null)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium text-ink transition-colors hover:bg-line"
                    >
                      <m.icon className="size-5 text-stamp-ink" />
                      <span>{m.label}</span>
                    </Link>
                  ))}

                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setPanel(null)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-semibold text-stamp-ink transition-colors hover:bg-line"
                    >
                      <ShieldCheck className="size-5 text-stamp-ink" />
                      <span>Admin console</span>
                    </Link>
                  )}

                  <div className="my-2 border-t border-sand" />
                  <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-ink-muted">Policies & Account</p>
                  <Link
                    to="/terms"
                    onClick={() => setPanel(null)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-ink-muted hover:text-ink hover:bg-line"
                  >
                    <FileText className="size-4" />
                    <span>Terms of Service</span>
                  </Link>
                  <Link
                    to="/privacy"
                    onClick={() => setPanel(null)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-ink-muted hover:text-ink hover:bg-line"
                  >
                    <Lock className="size-4" />
                    <span>Privacy Policy</span>
                  </Link>
                  <div className="my-2 border-t border-sand" />
                  <button
                    type="button"
                    onClick={() => {
                      setPanel(null);
                      signOut();
                      navigate({ to: "/login" });
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[15px] font-medium text-destructive transition-colors hover:bg-line cursor-pointer"
                  >
                    <LogOut className="size-5" />
                    <span>Log out {session?.name ? '(' + session.name.split(' ')[0] + ')' : ''}</span>
                  </button>
                </div>
              ) : (
                <ul className="px-3 py-4">
                  <p className="px-3 pb-2 text-sm font-bold text-ink">This week</p>
                  {NOTES.map((n, i) => (
                    <li key={i} className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-line">
                      <Avatar src={n.p.avatar} size="size-11" />
                      <p className="flex-1 text-sm text-ink"><b>{n.p.handle}</b> {n.t} <span className="text-ink-muted">{n.time}</span></p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      )}

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-[60px] items-center justify-between border-b border-sand bg-paper-raised px-4 md:hidden">
        <Link to="/"><Wordmark className="text-[30px]" /></Link>
        <div className="flex items-center gap-3">
          {isAdmin && <Link to="/admin" aria-label="Admin console" className="flex items-center justify-center min-h-[44px] min-w-[44px] text-stamp-ink"><ShieldCheck className="size-6" /></Link>}
          <button
            type="button"
            onClick={() => toggle("menu")}
            aria-label="Open menu"
            className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg text-ink transition-colors hover:bg-line active:scale-95 cursor-pointer"
          >
            <Menu className="size-6 stroke-[2.2]" />
          </button>
          <Link to="/chats" aria-label="Messages" className="relative flex items-center justify-center min-h-[44px] min-w-[44px]"><Send className="size-6" />{badge}</Link>
        </div>
      </header>

      <main className={cn("md:pl-[72px] xl:pl-[244px]", collapsed && "xl:pl-[244px]")}>
        <div className={cn("mx-auto w-full max-w-[960px] pb-20 md:pt-6 md:pb-10", path === "/" ? "px-0 sm:px-4" : "px-4 pt-5 sm:px-6")}>
          {children}
          <footer className="mt-16 border-t border-sand/60 pt-6 pb-4 text-center text-xs text-ink-muted">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
              <Link to="/terms" className="hover:text-ink transition-colors underline-offset-2 hover:underline">Terms of Service</Link>
              <span>·</span>
              <Link to="/privacy" className="hover:text-ink transition-colors underline-offset-2 hover:underline">Privacy Policy</Link>
              <span>·</span>
              <Link to="/places" className="hover:text-ink transition-colors underline-offset-2 hover:underline">Places</Link>
              <span>·</span>
              <Link to="/passport" className="hover:text-ink transition-colors underline-offset-2 hover:underline">Rewards & Stamps</Link>
              <span>·</span>
              <span>Outstagram © 2026</span>
            </div>
            <p className="mt-1.5 text-[11px] text-ink-muted/70">Anti-algorithm · Pro-presence · Zero tracking ads</p>
          </footer>
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 border-t border-sand bg-paper-raised pb-[env(safe-area-inset-bottom)] md:hidden">
        <ul className="grid h-12 grid-cols-5 place-items-center">
          <li><Link to="/" aria-label="Home" onClick={() => setPanel(null)}><Home className={cn("size-6", on("/") && "fill-ink")} /></Link></li>
          <li><Link to="/rack" aria-label="Rack"><Clapperboard className={cn("size-6", on("/rack") && "stroke-[3]")} /></Link></li>
          <li><Link to="/capture" aria-label="Capture" className="-mt-5 grid size-12 place-items-center rounded-full bg-stamp text-primary-foreground shadow-postcard"><PlusSquare className="size-6" /></Link></li>
          <li><Link to="/passport" search={{ tab: "rewards" }} aria-label="Rewards" onClick={() => setPanel(null)}><Gift className={cn("size-6 transition-all", isRewardsActive ? "stroke-[2.5] text-stamp" : "text-ink")} /></Link></li>
          <li><Link to="/passport" search={{ tab: "stamps" }} aria-label="Passport" onClick={() => setPanel(null)}><Avatar src={ME.avatar} size="size-6" className={cn("rounded-full transition-all", isPassportActive && "ring-2 ring-ink")} /></Link></li>
        </ul>
      </nav>
    </div>
  );
}

function SearchPanel({ onPick }: { onPick: () => void }) {
  const [q, setQ] = useState("");
  const all = searchPeople(q);
  return (
    <div>
      <div className="px-6 pb-4">
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, handle or friend code" className="h-10 w-full rounded-lg bg-line px-4 text-sm text-ink outline-none placeholder:text-ink-muted" />
      </div>
      <div className="border-t border-sand px-3 pt-3">
        <p className="px-3 pb-2 font-bold text-ink">{q ? "Results" : "Recent"}</p>
        {all.slice(0, 8).map((p) => (
          <Link key={p.handle} to="/passport" search={{ user: p.handle }} onClick={onPick} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-line">
            <Avatar src={p.avatar} size="size-11" />
            <span><span className="block text-sm font-semibold text-ink">{p.handle}</span><span className="text-sm text-ink-muted">{p.name}</span></span>
          </Link>
        ))}
        {all.length === 0 && <p className="px-3 py-6 text-sm text-ink-muted">No results found.</p>}
      </div>
    </div>
  );
}

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stamp-ink">{eyebrow}</p>}
        <h1 className="mt-1 text-3xl font-extrabold text-ink sm:text-4xl">{title}</h1>
      </div>
      {children}
    </div>
  );
}

export function CharCount({ value, min = 8, max = 140 }: { value: string; min?: number; max?: number }) {
  const n = value.trim().length;
  const ok = n >= min && n <= max;
  return <span className={cn("text-xs tabular-nums", ok ? "text-moss" : "text-ink-muted")}>{n}/{max}{n > 0 && n < min ? ` · ${min - n} more` : ""}</span>;
}
