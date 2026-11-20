import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck, Flag, Store, Users, Footprints, Check, X, Trash2, Plus, Lock, KeyRound, Hourglass } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin console — Outstagram" },
      { name: "description", content: "Review reports, approve partner offers, manage members and set daily quests." },
      { property: "og:title", content: "Admin console — Outstagram" },
      { property: "og:description", content: "Quiet tools that keep Outstagram kind and local." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Admin,
});

const pill = (s: string) => cn("rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider",
  s === "open" || s === "pending" ? "bg-stamp-soft text-stamp-ink" : s === "removed" || s === "rejected" || s === "suspended" ? "bg-line text-ink-muted" : "bg-moss/15 text-moss");

function Admin() {
  const st = useStore();
  const [q, setQ] = useState("");
  if (st.session?.role !== "admin") {
    return (
      <div className="paper-card mx-auto mt-10 max-w-md p-8 text-center">
        <Lock className="mx-auto size-10 text-stamp" />
        <h1 className="mt-3 text-2xl font-extrabold text-ink">Admins only</h1>
        <p className="mt-1 text-sm text-ink-muted">You're signed in as a member. Log out and choose “Admin” to open the console.</p>
        <Button asChild className="mt-5"><Link to="/">Back to Home</Link></Button>
      </div>
    );
  }
  const open = st.reports.filter((r) => r.status === "open").length;
  const pending = st.offers.filter((o) => o.status === "pending").length;
  const stats = [
    { label: "Members", value: st.members.length, icon: Users },
    { label: "Meetups this week", value: 48, icon: KeyRound },
    { label: "Open reports", value: open, icon: Flag },
    { label: "Hours reclaimed", value: "1,240", icon: Hourglass },
  ];
  return (
    <div className="space-y-6">
      <header className="overflow-hidden rounded-3xl bg-gradient-hero p-6 text-primary-foreground shadow-postcard">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-90"><ShieldCheck className="size-4" /> Admin console</p>
        <h1 className="mt-2 text-3xl font-extrabold">Hi {st.session.name.split(" ")[0]}, keep it kind.</h1>
        <p className="mt-1 max-w-lg text-sm opacity-90">Admins see totals only, never private messages, thank-you notes or anyone's location history.</p>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="paper-card p-4">
            <s.icon className="size-5 text-stamp" />
            <p className="mt-3 text-2xl font-extrabold tabular-nums text-ink">{s.value}</p>
            <p className="text-xs text-ink-muted">{s.label}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="reports">
        <TabsList className="no-scrollbar h-auto w-full justify-start gap-1 overflow-x-auto rounded-2xl bg-line p-1">
          <TabsTrigger value="reports" className="rounded-xl"><Flag className="size-4" /> Reports {open > 0 && <span className="ml-1 rounded-full bg-badge px-1.5 text-[10px] text-primary-foreground">{open}</span>}</TabsTrigger>
          <TabsTrigger value="offers" className="rounded-xl"><Store className="size-4" /> Partner offers {pending > 0 && <span className="ml-1 rounded-full bg-badge px-1.5 text-[10px] text-primary-foreground">{pending}</span>}</TabsTrigger>
          <TabsTrigger value="members" className="rounded-xl"><Users className="size-4" /> Members</TabsTrigger>
          <TabsTrigger value="quests" className="rounded-xl"><Footprints className="size-4" /> Quests</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="mt-4 space-y-3">
          {st.reports.length === 0 ? (
            <div className="paper-card p-6 text-center text-sm text-ink-muted">
              No open reports. Outstagram is kind and peaceful.
            </div>
          ) : (
            st.reports.map((r) => (
              <div key={r.id} className="paper-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2"><p className="font-semibold text-ink">{r.what}</p><span className={pill(r.status)}>{r.status}</span></div>
                  <p className="text-sm text-ink-muted">“{r.reason}” · reported by {r.by}</p>
                </div>
                {r.status === "open" && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => { st.resolveReport(r.id, "kept"); toast("Kept — reporter notified"); }}><Check /> Keep</Button>
                    <Button size="sm" variant="destructive" onClick={() => { st.resolveReport(r.id, "removed"); toast.success("Removed"); }}><Trash2 /> Remove</Button>
                  </div>
                )}
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="offers" className="mt-4 space-y-3">
          <p className="text-sm text-ink-muted">Offers appear only on a place's page and in Passports — never in the rack, never targeted.</p>
          {st.offers.map((o) => (
            <div key={o.id} className="paper-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2"><p className="font-semibold text-ink">{o.text}</p><span className={pill(o.status)}>{o.status}</span></div>
                <p className="text-sm text-ink-muted">{o.partner} · needs a {o.place} stamp</p>
              </div>
              {o.status === "pending" && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => { st.reviewOffer(o.id, "live"); toast.success("Offer approved"); }}><Check /> Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => st.reviewOffer(o.id, "rejected")}><X /> Reject</Button>
                </div>
              )}
            </div>
          ))}
        </TabsContent>

        <TabsContent value="members" className="mt-4">
          <div className="paper-card divide-y divide-line">
            {st.members.length === 0 ? (
              <p className="p-6 text-center text-sm text-ink-muted">No registered members yet.</p>
            ) : (
              st.members.map((m) => (
                <div key={m.id} className="flex flex-wrap items-center gap-3 p-4">
                  <span className="grid size-10 place-items-center rounded-full bg-stamp-soft font-bold text-stamp-ink">{m.name[0]}</span>
                  <div className="min-w-0 flex-1"><p className="font-semibold text-ink">{m.name}</p><p className="text-xs text-ink-muted">@{m.handle} · joined {m.joined}</p></div>
                  <select value={m.role} onChange={(e) => { st.setMember(m.id, { role: e.target.value as typeof m.role }); toast(`${m.name} is now ${e.target.value}`); }} aria-label={`Role for ${m.name}`}
                    className="rounded-lg border border-sand bg-paper px-2 py-1.5 text-sm text-ink">
                    <option value="user">Member</option><option value="partner">Partner</option><option value="admin">Admin</option>
                  </select>
                  <button onClick={() => st.setMember(m.id, { status: m.status === "active" ? "suspended" : "active" })} className={pill(m.status)}>{m.status}</button>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="quests" className="mt-4 space-y-3">
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); const t = q.trim(); if (t.length >= 8) { st.addQuest(t); setQ(""); toast.success("Quest added to rotation"); } }}>
            <Input value={q} onChange={(e) => setQ(e.target.value)} maxLength={140} placeholder="A small offline quest (8–140 chars)" className="bg-paper-raised" />
            <Button type="submit" disabled={q.trim().length < 8}><Plus /> Add</Button>
          </form>
          <ol className="paper-card divide-y divide-line">
            {st.quests.map((x, i) => (
              <li key={x} className="flex items-center gap-3 p-4">
                <span className="grid size-8 place-items-center rounded-full bg-line text-sm font-bold text-ink">{i + 1}</span>
                <p className="flex-1 text-ink">{x}</p>
                {i === 0 && <span className={pill("live")}>today</span>}
                <button onClick={() => st.removeQuest(x)} aria-label="Remove quest" className="text-ink-muted hover:text-stamp-ink"><Trash2 className="size-4" /></button>
              </li>
            ))}
          </ol>
        </TabsContent>
      </Tabs>
    </div>
  );
}