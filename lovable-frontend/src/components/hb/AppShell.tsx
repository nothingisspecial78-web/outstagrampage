import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Home, Clapperboard, Send, Search, Heart, PlusSquare, Menu, Footprints, KeyRound, Sparkles, Hammer, Settings, LayoutGrid, Instagram, Hourglass, X, Users, MapPinned, Store as StoreIcon, ShieldCheck, LogOut } from "lucide-react";
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
  const [panel, setPanel] = useState<Panel>(null);
  const [tray, setTray] = useState(false);
  const [seenNotes, setSeenNotes] = useState(false);
  const unread = 2;
  const toggle = (p: Panel) => { setPanel((c) => (c === p ? null : p)); if (p === "notifications") setSeenNotes(true); };
  const on = (to: string) => panel === null && (to === "/" ? path === "/" : path.startsWith(to));
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
          <Link to="/passport" className="group" onClick={() => setPanel(null)}>{item("Passport", <Avatar src={ME.avatar} size="size-6" className={cn(on("/passport") && "rounded-full ring-2 ring-ink")} />, on("/passport"))}</Link>
          <div className="mt-auto flex flex-col gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger className="group text-left outline-none">{item("More", <Menu className="size-6" />, false)}</DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-64 rounded-2xl border-sand bg-paper-raised p-2 shadow-postcard">
                {MORE.map((m) => (
                  <DropdownMenuItem key={m.to} asChild className="rounded-lg p-3"><Link to={m.to}><m.icon className="size-5" />{m.label}</Link></DropdownMenuItem>
                ))}
                {isAdmin && <DropdownMenuItem asChild className="rounded-lg p-3 font-semibold text-stamp-ink"><Link to="/admin"><ShieldCheck className="size-5" />Admin console</Link></DropdownMenuItem>}
                <DropdownMenuItem onSelect={() => { signOut(); navigate({ to: "/login" }); }} className="rounded-lg p-3"><LogOut className="size-5" />Log out {session?.name.split(" ")[0]}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Link to="/meet" className="group">{item("From Hereabouts", <LayoutGrid className="size-6" />, false)}</Link>
          </div>
        </nav>
      </aside>

      {/* Slide-out panels */}
      {panel && (
        <>
          <button aria-label="Close panel" className="fixed inset-0 z-30 cursor-default" onClick={() => setPanel(null)} />
          <section className="animate-in slide-in-from-left-4 fade-in fixed inset-y-0 left-0 z-40 w-full overflow-y-auto rounded-r-2xl border-r border-sand bg-paper-raised shadow-postcard duration-200 md:left-[72px] md:w-[397px]">
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <h2 className="text-2xl font-bold text-ink">{panel === "search" ? "Search" : panel === "menu" ? "Menu" : "Notifications"}</h2>
              <button onClick={() => setPanel(null)} aria-label="Close" className="rounded-full p-1 hover:bg-line md:hidden"><X className="size-5" /></button>
            </div>
            {panel === "search" ? (
              <SearchPanel onPick={() => setPanel(null)} />
            ) : panel === "menu" ? (
              <div className="flex flex-col gap-1 p-4 pb-16">
                <div className="mb-2 px-3 py-1">
                  <HoursChip />
                </div>
                <p className="px-3 text-xs font-bold uppercase tracking-wider text-ink-muted">Explore</p>
                <Link
                  to="/"
                  onClick={() => setPanel(null)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium text-ink transition-colors hover:bg-line"
                >
                  <Home className="size-5 text-stamp-ink" />
                  <span>Home</span>
                </Link>
                {MORE.map((m) => (
                  <Link
                    key={m.to}
                    to={m.to}
                    onClick={() => setPanel(null)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium text-ink transition-colors hover:bg-line"
                  >
                    <m.icon className="size-5 text-stamp-ink" />
                    <span>{m.label}</span>
                  </Link>
                ))}
                <div className="my-2 border-t border-sand" />
                <p className="px-3 text-xs font-bold uppercase tracking-wider text-ink-muted">Quick Access</p>
                <Link
                  to="/rack"
                  onClick={() => setPanel(null)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium text-ink transition-colors hover:bg-line"
                >
                  <Clapperboard className="size-5 text-stamp-ink" />
                  <span>Finite Rack</span>
                </Link>
                <Link
                  to="/capture"
                  onClick={() => setPanel(null)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium text-ink transition-colors hover:bg-line"
                >
                  <PlusSquare className="size-5 text-stamp-ink" />
                  <span>Capture Moment</span>
                </Link>
                <Link
                  to="/chats"
                  onClick={() => setPanel(null)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium text-ink transition-colors hover:bg-line"
                >
                  <Send className="size-5 text-stamp-ink" />
                  <span>Chats ({unread} unread)</span>
                </Link>
                <Link
                  to="/passport"
                  onClick={() => setPanel(null)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium text-ink transition-colors hover:bg-line"
                >
                  <Avatar src={ME.avatar} size="size-5" />
                  <span>Passport & Stats</span>
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setPanel(null)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-semibold text-stamp-ink transition-colors hover:bg-line"
                  >
                    <ShieldCheck className="size-5 text-stamp-ink" />
                    <span>Admin console</span>
                  </Link>
                )}
                <div className="my-2 border-t border-sand" />
                <button
                  type="button"
                  onClick={() => {
                    setPanel(null);
                    signOut();
                    navigate({ to: "/login" });
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[15px] font-medium text-destructive transition-colors hover:bg-line"
                >
                  <LogOut className="size-5" />
                  <span>Log out {session?.name ? `(${session.name.split(' ')[0]})` : ''}</span>
                </button>
              </div>
            ) : (
              <ul className="px-3">
                <p className="px-3 pb-2 text-sm font-bold text-ink">This week</p>
                {NOTES.map((n, i) => (
                  <li key={i} className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-line">
                    <Avatar src={n.p.avatar} size="size-11" />
                    <p className="flex-1 text-sm text-ink"><b>{n.p.handle}</b> {n.t} <span className="text-ink-muted">{n.time}</span></p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-[60px] items-center justify-between border-b border-sand bg-paper-raised px-4 md:hidden">
        <Link to="/"><Wordmark className="text-[30px]" /></Link>
        <div className="flex items-center gap-5">
          {isAdmin && <Link to="/admin" aria-label="Admin console" className="text-stamp-ink"><ShieldCheck className="size-6" /></Link>}
          <button type="button" onClick={() => toggle("menu")} aria-label="Open menu" className="rounded-md p-1 text-ink transition-colors hover:bg-line"><Menu className="size-6" /></button>
          <Link to="/chats" aria-label="Messages" className="relative"><Send className="size-6" />{badge}</Link>
        </div>
      </header>

      <main className={cn("md:pl-[72px] xl:pl-[244px]", collapsed && "xl:pl-[244px]")}>
        <div className={cn("mx-auto w-full max-w-[960px] pb-20 md:pt-6 md:pb-10", path === "/" ? "px-0 sm:px-4" : "px-4 pt-5 sm:px-6")}>{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 border-t border-sand bg-paper-raised pb-[env(safe-area-inset-bottom)] md:hidden">
        <ul className="grid h-12 grid-cols-5 place-items-center">
          <li><Link to="/" aria-label="Home" onClick={() => setPanel(null)}><Home className={cn("size-6", on("/") && "fill-ink")} /></Link></li>
          <li><Link to="/rack" aria-label="Rack"><Clapperboard className={cn("size-6", on("/rack") && "stroke-[3]")} /></Link></li>
          <li><Link to="/capture" aria-label="Capture" className="-mt-5 grid size-12 place-items-center rounded-full bg-stamp text-primary-foreground shadow-postcard"><PlusSquare className="size-6" /></Link></li>
          <li><Link to="/chats" aria-label="Chats" className="relative"><Send className={cn("size-6", on("/chats") && "stroke-[3]")} />{badge}</Link></li>
          <li><Link to="/passport" aria-label="Passport"><Avatar src={ME.avatar} size="size-6" className={cn("rounded-full", on("/passport") && "ring-2 ring-ink")} /></Link></li>
        </ul>
      </nav>

      {/* Floating messenger pill */}
      <div className="fixed right-6 bottom-6 z-30 hidden md:block">
        {tray && (
          <div className="animate-in fade-in slide-in-from-bottom-2 absolute right-0 bottom-16 w-80 overflow-hidden rounded-2xl border border-sand bg-paper-raised shadow-postcard">
            <p className="border-b border-sand px-4 py-3 font-bold text-ink">Messages</p>
            {chats.map((c, i) => (
              <Link key={c.id} to="/chats/$id" params={{ id: c.id }} onClick={() => setTray(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-line">
                <Avatar src={PEOPLE[i]!.avatar} size="size-11" />
                <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-ink">{c.name}</span><span className="block truncate text-xs text-ink-muted">{c.messages.at(-1)?.text}</span></span>
                <span className="text-[11px] text-ink-muted">{c.messages.length}/{c.limit}</span>
              </Link>
            ))}
          </div>
        )}
        <button onClick={() => setTray((t) => !t)} className="flex items-center gap-3 rounded-full border border-sand bg-paper-raised py-3 pr-3 pl-5 shadow-postcard transition-transform hover:scale-[1.02]">
          <span className="relative"><Send className="size-6" />{badge}</span>
          <span className="font-semibold text-ink">Messages</span>
          <span className="flex -space-x-2">{PEOPLE.slice(0, 3).map((p) => <Avatar key={p.handle} src={p.avatar} size="size-6" className="rounded-full ring-2 ring-paper-raised" />)}</span>
        </button>
      </div>
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
