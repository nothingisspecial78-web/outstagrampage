import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Home, Clapperboard, Send, Search, Heart, PlusSquare, Menu, Footprints, KeyRound, Sparkles, Hammer, Settings, LayoutGrid, Instagram, Hourglass, X, Users, MapPinned, Store as StoreIcon, ShieldCheck, LogOut, FileText, Lock, Gift, Compass, Bell } from "lucide-react";
import { useState, useEffect, type ReactNode } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useStore } from "@/lib/store";
import { ME, searchRealUsers, getCachedRealUsers, type Person } from "@/lib/people";
import { cn } from "@/lib/utils";
import { OutstagramIcon } from "./OutstagramLogo";

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
const NOTES: { p: { name: string; handle: string; avatar: string }; t: string; time: string }[] = [];

export function AppShell({ children }: { children: ReactNode }) {
  const { demo, chats, session, signOut } = useStore();
  const navigate = useNavigate();
  const isAdmin = session?.role === "admin";
  const myAvatar = session?.avatar || (session?.name ? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(session.name)}` : ME.avatar);
  const path = useLocation({ select: (l) => l.pathname });
  const search = useLocation({ select: (l) => l.search as Record<string, string | undefined> });
  const [panel, setPanel] = useState<Panel>(null);
  const [seenNotes, setSeenNotes] = useState(false);
  const unread = chats.filter((c) => c.messages.some((m) => !m.mine)).length;
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
  const badge = unread > 0 ? (
    <span className="absolute -top-1.5 -right-1.5 grid size-[18px] place-items-center rounded-full bg-badge text-[11px] font-bold text-primary-foreground ring-2 ring-paper-raised">
      {unread}
    </span>
  ) : null;
  const dot = !seenNotes && <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-badge ring-2 ring-paper-raised" />;

  return (
    <div className="min-h-screen w-full max-w-full bg-paper-raised">
      {demo && <div role="status" className="fixed top-0 inset-x-0 z-50 bg-demo py-1 text-center text-xs font-bold tracking-widest text-demo-foreground">DEMO MODE: location check simulated</div>}

      {/* Constant Universal Top Bar (Always fixed and constant on all screens) */}
      <header className={cn(
        "fixed inset-x-0 top-0 z-40 flex h-14 md:h-16 w-full items-center justify-between border-b border-sand bg-paper-raised/95 px-3 sm:px-6 backdrop-blur-md shadow-xs select-none",
        demo && "top-6"
      )}>
        {/* Left: Brand Logo & Hours reclaimed */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 transition-transform hover:scale-[1.02] active:scale-95" aria-label="Outstagram Home">
            <OutstagramIcon size={30} />
            <Wordmark className="text-2xl md:text-3xl text-ink" />
          </Link>
          <div className="hidden lg:block ml-2">
            <HoursChip />
          </div>
        </div>

        {/* Center: Search button / Quick find */}
        <div className="hidden sm:flex items-center flex-1 max-w-xs md:max-w-sm mx-4">
          <button
            type="button"
            onClick={() => toggle("search")}
            className="flex items-center gap-2.5 w-full rounded-full border border-sand bg-paper px-3.5 py-1.5 text-xs text-ink-muted hover:border-stamp/60 hover:text-ink transition-all shadow-xs cursor-pointer text-left"
          >
            <Search className="size-3.5 shrink-0 text-ink-muted" />
            <span className="truncate">Search registered members…</span>
            <kbd className="hidden md:inline-block ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded bg-sand/30 text-ink-muted">⌘K</kbd>
          </button>
        </div>

        {/* Right: Quick Actions, Notifications, Messages, User Profile */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Mobile search toggle */}
          <button
            type="button"
            onClick={() => toggle("search")}
            aria-label="Search"
            className="sm:hidden flex items-center justify-center size-9 rounded-full text-ink hover:bg-line active:scale-95 cursor-pointer"
          >
            <Search className="size-5" />
          </button>

          {/* Group Meetups Link */}
          <Link
            to="/group"
            aria-label="Group meetups"
            className="flex items-center justify-center size-9 rounded-full text-ink hover:bg-line hover:text-stamp-ink transition-colors cursor-pointer"
          >
            <Users className="size-5" />
          </Link>

          {/* Messages Link with live badge */}
          <Link
            to="/chats"
            aria-label="Messages"
            className="relative flex items-center justify-center size-9 rounded-full text-ink hover:bg-line hover:text-stamp-ink transition-colors cursor-pointer"
          >
            <Send className="size-5" />
            {badge}
          </Link>

          {/* Admin console link if user is admin */}
          {isAdmin && (
            <Link
              to="/admin"
              aria-label="Admin console"
              className="flex items-center justify-center size-9 rounded-full text-stamp-ink hover:bg-stamp-soft transition-colors cursor-pointer"
            >
              <ShieldCheck className="size-5" />
            </Link>
          )}

          {/* Profile Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger className="outline-none flex items-center justify-center p-0.5 cursor-pointer">
              <Avatar src={myAvatar} size="size-8" ring={isPassportActive ? "story" : undefined} className="hover:ring-2 hover:ring-stamp transition-all" />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="end" className="w-56 rounded-2xl border-sand bg-paper-raised p-2 shadow-postcard">
              <div className="px-3 py-2 border-b border-sand mb-1">
                <p className="font-bold text-sm text-ink truncate">{session?.name || "Member"}</p>
                <p className="text-xs text-ink-muted truncate">{session?.email || ""}</p>
              </div>
              <DropdownMenuItem asChild className="rounded-lg p-2.5 text-xs font-semibold cursor-pointer">
                <Link to="/passport" search={{ tab: "stamps" }}><Avatar src={myAvatar} size="size-4" className="mr-2" />My Passport & Stamps</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="rounded-lg p-2.5 text-xs font-semibold cursor-pointer">
                <Link to="/passport" search={{ tab: "rewards" }}><Gift className="size-4 mr-2 text-stamp" />Rewards & Points</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="rounded-lg p-2.5 text-xs font-semibold cursor-pointer">
                <Link to="/group"><Users className="size-4 mr-2 text-moss" />Group Goals & Points</Link>
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem asChild className="rounded-lg p-2.5 text-xs font-bold text-stamp-ink cursor-pointer">
                  <Link to="/admin"><ShieldCheck className="size-4 mr-2" />Admin Console</Link>
                </DropdownMenuItem>
              )}
              <div className="my-1 border-t border-sand" />
              <DropdownMenuItem asChild className="rounded-lg p-2 text-xs text-ink-muted cursor-pointer">
                <Link to="/about"><Compass className="size-3.5 mr-2" />About Outstagram</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="rounded-lg p-2 text-xs text-ink-muted cursor-pointer">
                <Link to="/terms"><FileText className="size-3.5 mr-2" />Terms of Service</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="rounded-lg p-2 text-xs text-ink-muted cursor-pointer">
                <Link to="/privacy"><Lock className="size-3.5 mr-2" />Privacy Policy</Link>
              </DropdownMenuItem>
              <div className="my-1 border-t border-sand" />
              <DropdownMenuItem onSelect={() => { signOut(); navigate({ to: "/login" }); }} className="rounded-lg p-2 text-xs font-semibold text-rose-600 cursor-pointer">
                <LogOut className="size-3.5 mr-2" />Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile slide drawer button */}
          <button
            type="button"
            onClick={() => toggle("menu")}
            aria-label="Open menu"
            className="md:hidden flex items-center justify-center size-9 rounded-full text-ink hover:bg-line active:scale-95 cursor-pointer"
          >
            <Menu className="size-5" />
          </button>
        </div>
      </header>

      {/* Desktop / tablet side rail (neatly starts right under the constant top bar) */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-sand bg-paper-raised px-3 pb-5 md:flex md:w-[72px] xl:w-[244px]",
        demo ? "top-20" : "top-14 md:top-16",
        collapsed && "xl:w-[72px]"
      )}>
        <nav className="flex flex-1 flex-col gap-1 pt-4" aria-label="Main">
          <Link to="/" className="group" onClick={() => setPanel(null)}>{item("Home", <Home className={cn("size-6", on("/") && "fill-ink")} />, on("/"))}</Link>
          <Link to="/rack" className="group" onClick={() => setPanel(null)}>{item("Rack", <Clapperboard className="size-6" />, on("/rack"))}</Link>
          <Link to="/chats" className="group" onClick={() => setPanel(null)}>{item("Messages", <Send className="size-6" />, on("/chats"), badge)}</Link>
          <button className="group text-left" onClick={() => toggle("search")}>{item("Search", <Search className="size-6" />, panel === "search")}</button>
          <Link to="/capture" className="group" onClick={() => setPanel(null)}>{item("Create", <PlusSquare className="size-6" />, on("/capture"))}</Link>
          <Link to="/group" className="group" onClick={() => setPanel(null)}>{item("Groups", <Users className="size-6" />, on("/group"))}</Link>
          <Link to="/passport" search={{ tab: "rewards" }} className="group" onClick={() => setPanel(null)}>{item("Rewards", <Gift className={cn("size-6", isRewardsActive && "text-stamp stroke-[2.5]")} />, isRewardsActive)}</Link>
          <Link to="/passport" search={{ tab: "stamps" }} className="group" onClick={() => setPanel(null)}>{item("Passport", <Avatar src={myAvatar} size="size-6" className={cn(isPassportActive && "rounded-full ring-2 ring-ink")} />, isPassportActive)}</Link>
          <div className="mt-auto flex flex-col gap-1">
            <Link to="/meet" className="group">{item("From Hereabouts", <LayoutGrid className="size-6" />, false)}</Link>
          </div>
        </nav>
      </aside>

      {/* Slide-out panels & Mobile Drawer */}
      {panel && (
        <div className="fixed inset-0 z-[80]">
          <div
            aria-hidden="true"
            className="fixed inset-0 bg-ink/40 backdrop-blur-xs transition-opacity"
            onClick={() => setPanel(null)}
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-label={panel === "search" ? "Search panel" : panel === "menu" ? "Navigation menu" : "Notifications panel"}
            className="fixed inset-y-0 right-0 z-[90] flex w-[85vw] max-w-[360px] md:right-auto md:left-[72px] md:w-[397px] flex-col border-l md:border-l-0 md:border-r border-sand bg-paper-raised shadow-2xl overflow-hidden animate-in slide-in-from-right md:slide-in-from-left duration-200"
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
                      Chats {unread > 0 && <span className="rounded-full bg-badge px-1.5 py-0.2 text-[10px] font-bold text-primary-foreground">{unread}</span>}
                    </span>
                  </Link>
                  <Link
                    to="/passport"
                    search={{ tab: "stamps" }}
                    onClick={() => setPanel(null)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium text-ink transition-colors hover:bg-line"
                  >
                    <Avatar src={myAvatar} size="size-5" />
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
                  <Link
                    to="/about"
                    onClick={() => setPanel(null)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-ink-muted hover:text-ink hover:bg-line"
                  >
                    <Compass className="size-4" />
                    <span>About Outstagram (Our Story & Manifesto)</span>
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
                <div className="px-3 py-4">
                  <p className="px-3 pb-2 text-sm font-bold text-ink">Notifications</p>
                  {NOTES.length > 0 ? (
                    <ul>
                      {NOTES.map((n, i) => (
                        <li key={i} className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-line">
                          <Avatar src={n.p.avatar} size="size-11" />
                          <p className="flex-1 text-sm text-ink"><b>{n.p.handle}</b> {n.t} <span className="text-ink-muted">{n.time}</span></p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="px-4 py-10 text-center">
                      <Bell className="mx-auto mb-2 size-8 text-ink-muted/50" />
                      <p className="text-sm font-semibold text-ink">No notifications yet</p>
                      <p className="mt-1 text-xs text-ink-muted">When friends interact with your postcards or stamps, you'll see them here.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      <main className={cn(
        "w-full max-w-full overflow-x-hidden pt-14 md:pt-16 md:pl-[72px] xl:pl-[244px]",
        collapsed && "xl:pl-[72px]"
      )}>
        {path.startsWith("/chats") ? (
          <div className={cn(
            "w-full overflow-hidden",
            path.match(/^\/chats\/[^/]+/)
              ? "h-[calc(100dvh-3.5rem)] md:h-[calc(100dvh-4rem)]"
              : "h-[calc(100dvh-6.5rem)] md:h-[calc(100dvh-4rem)]"
          )}>
            {children}
          </div>
        ) : (
          <div className={cn("mx-auto w-full max-w-5xl pb-24 md:pb-12", path === "/" ? "px-3 sm:px-6 pt-3 md:pt-6" : "px-4 pt-5 sm:px-6")}>
            {children}
            <footer className="mt-16 border-t border-sand/60 pt-6 pb-4 text-center text-xs text-ink-muted">
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                <Link to="/about" className="hover:text-ink transition-colors underline-offset-2 hover:underline">About</Link>
                <span>•</span>
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
        )}
      </main>

      {/* Mobile bottom nav - hidden when inside an active conversation thread so typing area is pinned and fully visible */}
      {!path.match(/^\/chats\/[^/]+/) && (
        <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 w-full max-w-full border-t border-sand bg-paper-raised pb-[env(safe-area-inset-bottom)] md:hidden shadow-lg">
          <ul className="grid h-12 grid-cols-5 place-items-center">
            <li><Link to="/" aria-label="Home" onClick={() => setPanel(null)}><Home className={cn("size-6", on("/") && "fill-ink")} /></Link></li>
            <li><Link to="/rack" aria-label="Rack"><Clapperboard className={cn("size-6", on("/rack") && "stroke-[3]")} /></Link></li>
            <li><Link to="/capture" aria-label="Capture" className="-mt-5 grid size-12 place-items-center rounded-full bg-stamp text-primary-foreground shadow-postcard"><PlusSquare className="size-6" /></Link></li>
            <li><Link to="/passport" search={{ tab: "rewards" }} aria-label="Rewards" onClick={() => setPanel(null)}><Gift className={cn("size-6 transition-all", isRewardsActive ? "stroke-[2.5] text-stamp" : "text-ink")} /></Link></li>
            <li><Link to="/passport" search={{ tab: "stamps" }} aria-label="Passport" onClick={() => setPanel(null)}><Avatar src={myAvatar} size="size-6" className={cn("rounded-full transition-all", isPassportActive && "ring-2 ring-ink")} /></Link></li>
          </ul>
        </nav>
      )}
    </div>
  );
}

function SearchPanel({ onPick }: { onPick: () => void }) {
  const { session } = useStore();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Person[]>([]);

  useEffect(() => {
    let active = true;
    searchRealUsers(q, session?.id || session?.name).then((res) => {
      if (active) setResults(res);
    });
    return () => {
      active = false;
    };
  }, [q, session?.id, session?.name]);

  return (
    <div>
      <div className="px-6 pb-4">
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, handle or friend code"
          className="h-10 w-full rounded-lg bg-line px-4 text-sm text-ink outline-none placeholder:text-ink-muted"
        />
      </div>
      <div className="border-t border-sand px-3 pt-3">
        <p className="px-3 pb-2 font-bold text-ink">{q ? "Results" : "Recent Members"}</p>
        {results.slice(0, 8).map((p) => (
          <Link
            key={p.id || p.handle}
            to="/passport"
            search={{ user: p.handle }}
            onClick={onPick}
            className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-line"
          >
            <Avatar src={p.avatar} size="size-11" />
            <span>
              <span className="block text-sm font-semibold text-ink">{p.handle}</span>
              <span className="text-sm text-ink-muted">{p.name}</span>
            </span>
          </Link>
        ))}
        {results.length === 0 && (
          <p className="px-3 py-6 text-center text-sm text-ink-muted">
            {q ? "No members match your search." : "No members found yet. Tell friends to sign up!"}
          </p>
        )}
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
