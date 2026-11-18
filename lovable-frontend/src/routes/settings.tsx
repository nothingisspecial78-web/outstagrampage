import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { ChevronRight, UserRound, Bell, Lock, Copy, UserPlus, LogOut, ShieldCheck, FlaskConical, Timer, Footprints, KeyRound, Sparkles, Hammer, Users, MapPinned, Store, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar } from "@/components/hb/AppShell";
import { useStore } from "@/lib/store";
import { ME } from "@/lib/people";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Outstagram" },
      { name: "description", content: "Edit your profile, notifications, privacy, friend code and demo mode." },
      { property: "og:title", content: "Settings — Outstagram" },
      { property: "og:description", content: "Add friends by code, never by search." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Settings,
});

const MY_CODE = "HB-7K2-QX9";
type Modal = null | "profile" | "notify" | "privacy";

function Row({ icon: I, label, hint, onClick, right }: { icon: typeof Bell; label: string; hint?: string; onClick?: () => void; right?: ReactNode }) {
  const inner = <><I className="size-5 text-ink" /><span className="flex-1 text-left"><span className="block text-sm font-medium text-ink">{label}</span>{hint && <span className="block text-xs text-ink-muted">{hint}</span>}</span>{right ?? <ChevronRight className="size-4 text-ink-muted" />}</>;
  return onClick ? <button onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3.5 hover:bg-line/60">{inner}</button> : <div className="flex items-center gap-3 px-4 py-3.5">{inner}</div>;
}
const Group = ({ title, children }: { title: string; children: ReactNode }) => (
  <section><h2 className="mb-1.5 px-1 text-xs font-bold tracking-wider text-ink-muted uppercase">{title}</h2><div className="divide-y divide-line overflow-hidden rounded-2xl border border-sand bg-paper-raised">{children}</div></section>
);

function Settings() {
  const { demo, setDemo, friends, addFriend, session, signOut, dwell, setDwell } = useStore();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [modal, setModal] = useState<Modal>(null);
  const [bio, setBio] = useState("Walking more, scrolling less.");
  const [name, setName] = useState(session?.name ?? ME.name);
  const [toggles, setToggles] = useState<Record<string, boolean>>({ Messages: true, "Meetup reminders": true, "Thank-you notes": true, "Private account": true, "Hide activity status": false, "Only friends can message": true });
  const T = (k: string) => <Switch checked={!!toggles[k]} onCheckedChange={(v) => setToggles((t) => ({ ...t, [k]: v }))} aria-label={k} />;
  const isAdmin = session?.role === "admin";

  return (
    <div className="mx-auto max-w-xl space-y-6 pb-6">
      <h1 className="text-2xl font-extrabold text-ink">Settings</h1>
      <div className="flex items-center gap-4 rounded-2xl border border-sand bg-paper-raised p-4">
        <Avatar src={ME.avatar} size="size-14" ring="story" />
        <div className="min-w-0 flex-1"><p className="font-semibold text-ink">{name}</p><p className="truncate text-sm text-ink-muted">{session?.email ?? ME.handle}</p></div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${isAdmin ? "bg-stamp text-primary-foreground" : "bg-line text-ink"}`}>{isAdmin ? "Admin" : "Member"}</span>
      </div>
      {isAdmin && <Button asChild className="w-full"><Link to="/admin"><ShieldCheck /> Open admin console</Link></Button>}

      <Group title="Your account">
        <Row icon={UserRound} label="Edit profile" hint="Name, bio" onClick={() => setModal("profile")} />
        <Row icon={Bell} label="Notifications" hint="Quiet by default" onClick={() => setModal("notify")} />
        <Row icon={Lock} label="Privacy & Security" onClick={() => setModal("privacy")} />
      </Group>

      <Group title="Friends">
        <div className="px-4 py-3.5">
          <p className="text-sm font-medium text-ink">Your friend code</p>
          <div className="mt-2 flex gap-2">
            <code className="flex-1 rounded-xl border border-dashed border-sand bg-paper px-4 py-2.5 font-mono text-lg tracking-widest text-ink">{MY_CODE}</code>
            <Button variant="outline" onClick={() => { navigator.clipboard?.writeText(MY_CODE); toast.success("Code copied"); }}><Copy /> Copy</Button>
          </div>
        </div>
        <form className="flex gap-2 px-4 py-3.5" onSubmit={(e) => { e.preventDefault(); if (code.trim().length >= 6) { addFriend(code.trim()); toast.success("Friend added"); setCode(""); } }}>
          <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Add friend: HB-XXX-XXX" className="bg-paper font-mono tracking-widest" />
          <Button type="submit" disabled={code.trim().length < 6}><UserPlus /> Add</Button>
        </form>
        <p className="px-4 py-3 text-xs text-ink-muted">Friends: {friends.join(", ")} · no search, codes only</p>
      </Group>

      <Group title="How you use Outstagram">
        <Row icon={FlaskConical} label="Demo mode" hint="Simulate your location for testing" right={<Switch checked={demo} onCheckedChange={setDemo} aria-label="Demo mode" />} />
        <Row icon={Timer} label="Slow moments" hint="Pause ~3s on each postcard" right={<Switch checked={dwell} onCheckedChange={setDwell} aria-label="Slow moments" />} />
      </Group>

      <Group title="About & Policies">
        <Link to="/terms" className="flex w-full items-center gap-3 px-4 py-3.5 hover:bg-line/60">
          <FileText className="size-5 text-ink" />
          <span className="flex-1 text-left">
            <span className="block text-sm font-medium text-ink">Terms of Service</span>
            <span className="block text-xs text-ink-muted">The anti-addiction pact & presence rules</span>
          </span>
          <ChevronRight className="size-4 text-ink-muted" />
        </Link>
        <Link to="/privacy" className="flex w-full items-center gap-3 px-4 py-3.5 hover:bg-line/60">
          <Lock className="size-5 text-ink" />
          <span className="flex-1 text-left">
            <span className="block text-sm font-medium text-ink">Privacy Policy</span>
            <span className="block text-xs text-ink-muted">Zero tracking, no ad brokers, encrypted storage</span>
          </span>
          <ChevronRight className="size-4 text-ink-muted" />
        </Link>
      </Group>

      <Group title="More">
        <div className="grid grid-cols-4 gap-1 p-2">
          {([["/quest", "Quest", Footprints], ["/meet", "Meet", KeyRound], ["/coach", "Coach", Sparkles], ["/make", "Maker", Hammer], ["/group", "Group", Users], ["/map", "Map", MapPinned], ["/places", "Places", Store]] as const).map(([to, l, I]) => (
            <Link key={to} to={to} className="flex flex-col items-center gap-1.5 rounded-xl p-3 text-xs font-semibold text-ink hover:bg-line"><I className="size-5 text-stamp-ink" />{l}</Link>
          ))}
        </div>
      </Group>

      <div className="overflow-hidden rounded-2xl border border-sand bg-paper-raised">
        <button onClick={() => { signOut(); navigate({ to: "/login" }); }} className="flex w-full items-center gap-3 px-4 py-3.5 text-sm font-semibold text-badge hover:bg-line/60"><LogOut className="size-5" /> Log out</button>
      </div>

      <Dialog open={modal !== null} onOpenChange={(o) => !o && setModal(null)}>
        <DialogContent className="rounded-2xl border-sand bg-paper-raised">
          <DialogHeader><DialogTitle>{modal === "profile" ? "Edit profile" : modal === "notify" ? "Notifications" : "Privacy & Security"}</DialogTitle></DialogHeader>
          {modal === "profile" && (
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); toast.success("Profile saved"); setModal(null); }}>
              <div className="flex items-center gap-3"><Avatar src={ME.avatar} size="size-14" /><span className="text-sm font-semibold text-link">Change photo (camera only)</span></div>
              <label className="block text-sm font-medium text-ink">Name<Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 bg-paper" /></label>
              <label className="block text-sm font-medium text-ink">Bio<Input value={bio} maxLength={150} onChange={(e) => setBio(e.target.value)} className="mt-1 bg-paper" /></label>
              <Button type="submit" className="w-full">Save</Button>
            </form>
          )}
          {modal === "notify" && <div className="divide-y divide-line">{["Messages", "Meetup reminders", "Thank-you notes"].map((k) => <div key={k} className="flex items-center justify-between py-3 text-sm text-ink">{k}{T(k)}</div>)}<p className="pt-3 text-xs text-ink-muted">Outstagram never sends "come back" nudges.</p></div>}
          {modal === "privacy" && <div className="divide-y divide-line">{["Private account", "Hide activity status", "Only friends can message"].map((k) => <div key={k} className="flex items-center justify-between py-3 text-sm text-ink">{k}{T(k)}</div>)}</div>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
