import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Users, Check, Sparkles, Trophy, Plus, Copy, ArrowRight, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FakeQR } from "@/components/hb/CodeSheet";
import { useStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/group")({
  head: () => ({
    meta: [
      { title: "Group Goals & Points — Outstagram" },
      { name: "description", content: "Generate custom group meetups, achieve group goals, and earn reward points." },
      { property: "og:title", content: "Group Goals & Points — Outstagram" },
      { property: "og:description", content: "Gather friends in person, achieve goals, and earn offline reward points." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GroupGoalsView,
});

const DEFAULT_QUESTS = [
  "20-Minute Nature Walk (No Phones)",
  "Coffee & Book Reading Session",
  "Sketch or Paint Outdoors",
  "Plant a Tree or Community Clean",
  "Sunset Watch at the Overlook",
];

export interface GroupMeetup {
  id: string;
  title: string;
  goal_quest: string;
  points_reward: number;
  plain_code: string;
  status: string;
  host_id?: string | undefined;
  created_at?: string | undefined;
}

function GroupGoalsView() {
  const { groupStamp, points, addPoints, session } = useStore();
  const [tab, setTab] = useState<"create" | "join" | "browse">("create");

  // Creation form state
  const [title, setTitle] = useState("Sunset Walkers Club");
  const [quest, setQuest] = useState(DEFAULT_QUESTS[0]!);
  const [customQuest, setCustomQuest] = useState("");
  const [rewardPoints, setRewardPoints] = useState(250);
  const [submitting, setSubmitting] = useState(false);

  // Active / generated group state
  const [activeGroup, setActiveGroup] = useState<GroupMeetup | null>(null);
  const [goalCompleted, setGoalCompleted] = useState(false);

  // Join code state
  const [inputCode, setInputCode] = useState("");
  const [joining, setJoining] = useState(false);

  // Community groups list
  const [communityGroups, setCommunityGroups] = useState<GroupMeetup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  // Load existing groups from Supabase
  const loadCommunityGroups = async () => {
    setLoadingGroups(true);
    try {
      const { data, error } = await supabase
        .from("group_meetups")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (!error && data && data.length > 0) {
        setCommunityGroups(
          data.map((row: any) => ({
            id: row.id,
            title: row.title || "Outdoor Meetup",
            goal_quest: row.goal_quest || "Gather outdoors without phones",
            points_reward: row.points_reward || 250,
            plain_code: row.plain_code || "731406",
            status: row.status || "active",
            host_id: row.host_id,
            created_at: row.created_at,
          }))
        );
      }
    } catch (err) {
      console.warn("Could not load community groups:", err);
    } finally {
      setLoadingGroups(false);
    }
  };

  useEffect(() => {
    loadCommunityGroups();
  }, []);

  // Generate a new group
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a group title");
      return;
    }
    const finalQuest = customQuest.trim() || quest;
    const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
    const newId = crypto.randomUUID();

    setSubmitting(true);
    try {
      const newMeetup: GroupMeetup = {
        id: newId,
        title: title.trim(),
        goal_quest: finalQuest,
        points_reward: rewardPoints,
        plain_code: randomCode,
        status: "active",
        host_id: session?.id,
      };

      await supabase.from("group_meetups").insert({
        id: newId,
        host_id: session?.id || "33333333-3333-3333-3333-333333333301",
        title: newMeetup.title,
        goal_quest: newMeetup.goal_quest,
        points_reward: newMeetup.points_reward,
        plain_code: newMeetup.plain_code,
        status: "active",
        expires_at: new Date(Date.now() + 86400000).toISOString(),
      });

      setActiveGroup(newMeetup);
      setGoalCompleted(false);
      toast.success(`Group "${title}" generated! Code: ${randomCode}`);
      loadCommunityGroups();
    } catch (err: any) {
      toast.error(err.message || "Failed to create group meetup");
    } finally {
      setSubmitting(false);
    }
  };

  // Join a group with code
  const handleJoinWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputCode.replace(/\D/g, "");
    if (clean.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }

    setJoining(true);
    try {
      const { data, error } = await supabase
        .from("group_meetups")
        .select("*")
        .eq("plain_code", clean)
        .maybeSingle();

      if (error || !data) {
        // Fallback demo match
        if (clean === "731406") {
          setActiveGroup({
            id: "demo-group",
            title: "Nature Walkers",
            goal_quest: "Walk 20 minutes without screens",
            points_reward: 250,
            plain_code: "731406",
            status: "active",
          });
          setGoalCompleted(false);
          toast.success("Joined group: Nature Walkers!");
          return;
        }
        toast.error("No active group found with that 6-digit code");
        return;
      }

      const joined: GroupMeetup = {
        id: data.id,
        title: data.title || "Group Meetup",
        goal_quest: data.goal_quest || "Outdoor activity",
        points_reward: data.points_reward || 250,
        plain_code: data.plain_code,
        status: data.status || "active",
        host_id: data.host_id,
      };

      setActiveGroup(joined);
      setGoalCompleted(joined.status === "completed");
      toast.success(`Joined group: ${joined.title}!`);
    } catch (err: any) {
      toast.error("Could not join group");
    } finally {
      setJoining(false);
    }
  };

  // Complete group goal and claim reward points
  const handleCompleteGoal = async () => {
    if (!activeGroup) return;
    const pts = activeGroup.points_reward || 250;

    try {
      await supabase
        .from("group_meetups")
        .update({ status: "completed" })
        .eq("id", activeGroup.id);
    } catch {}

    await addPoints(pts, `Group Goal: ${activeGroup.title}`);
    groupStamp(`Group · ${activeGroup.title}`);
    setGoalCompleted(true);
    toast.success(`🎉 Group goal achieved! +${pts} Points awarded to your passport!`);
    loadCommunityGroups();
  };

  const copyCode = (code: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
      toast.success(`Code ${code} copied to clipboard!`);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6 pb-12">
      {/* Header with live points badge */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-sand pb-4">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-2xl bg-gradient-hero text-primary-foreground shadow-postcard">
            <Users className="size-6" />
          </span>
          <div>
            <h1 className="font-serif text-2xl font-bold text-ink">Group Goals</h1>
            <p className="text-xs text-ink-muted">Create groups, complete goals & claim community points</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto rounded-xl bg-stamp-soft px-3.5 py-1.5 border border-stamp/20 shadow-sm">
          <Trophy className="size-4 text-stamp" />
          <div className="text-left">
            <p className="text-[10px] font-bold uppercase tracking-wider text-stamp-ink">Your Balance</p>
            <p className="font-mono text-base font-extrabold text-stamp-ink tabular-nums">{points} PTS</p>
          </div>
        </div>
      </header>

      {/* Main Mode Navigation */}
      <div className="grid grid-cols-3 rounded-2xl border border-sand bg-paper p-1">
        <button
          onClick={() => { setTab("create"); setActiveGroup(null); }}
          className={cn(
            "rounded-xl py-2.5 text-xs sm:text-sm font-bold transition-all",
            tab === "create" ? "bg-paper-raised text-ink shadow-paper" : "text-ink-muted hover:text-ink"
          )}
        >
          Create Group
        </button>
        <button
          onClick={() => { setTab("join"); setActiveGroup(null); }}
          className={cn(
            "rounded-xl py-2.5 text-xs sm:text-sm font-bold transition-all",
            tab === "join" ? "bg-paper-raised text-ink shadow-paper" : "text-ink-muted hover:text-ink"
          )}
        >
          Join with Code
        </button>
        <button
          onClick={() => { setTab("browse"); setActiveGroup(null); }}
          className={cn(
            "rounded-xl py-2.5 text-xs sm:text-sm font-bold transition-all",
            tab === "browse" ? "bg-paper-raised text-ink shadow-paper" : "text-ink-muted hover:text-ink"
          )}
        >
          Community ({communityGroups.length})
        </button>
      </div>

      {/* 1. Active or Just-Generated Group Display */}
      {activeGroup ? (
        <section className="rounded-3xl border border-sand bg-paper-raised p-6 shadow-postcard animate-in fade-in slide-in-from-bottom-2">
          {goalCompleted ? (
            <div className="text-center py-4 space-y-4">
              <div className="mx-auto grid size-24 place-items-center rounded-full bg-moss/20 text-moss border-4 border-dashed border-moss animate-bounce">
                <Check className="size-12" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-ink">Group Goal Completed!</h2>
              <p className="text-sm text-ink-muted max-w-md mx-auto">
                Congratulations! You achieved <strong className="text-ink font-semibold">"{activeGroup.goal_quest}"</strong> with your group.
              </p>
              <div className="inline-flex items-center gap-2 rounded-2xl bg-stamp-soft px-5 py-2.5 border border-stamp/30 text-stamp-ink font-bold text-lg">
                <Sparkles className="size-5 text-stamp" /> +{activeGroup.points_reward} Points Added to Passport!
              </div>
              <div className="pt-4 flex justify-center gap-3">
                <Button variant="outline" onClick={() => { setActiveGroup(null); setTab("create"); }}>
                  Create Another Group
                </Button>
                <Button onClick={() => { setActiveGroup(null); setTab("browse"); }}>
                  Browse Groups
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 text-center">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-stamp-soft px-3 py-1 text-xs font-bold text-stamp-ink">
                <ShieldCheck className="size-3.5" /> Group Meetup Live
              </div>

              <div>
                <h2 className="font-serif text-3xl font-bold text-ink">{activeGroup.title}</h2>
                <p className="mt-1.5 text-sm text-ink-muted font-medium">🎯 Goal: {activeGroup.goal_quest}</p>
              </div>

              {/* QR & Code Box */}
              <div className="rounded-2xl border-2 border-dashed border-sand bg-paper p-5 max-w-sm mx-auto shadow-inner space-y-4">
                <div className="mx-auto size-40 bg-paper-raised rounded-xl p-2 shadow-sm flex items-center justify-center">
                  <FakeQR />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-ink-muted font-bold">Group 6-Digit Code</p>
                  <p className="font-mono text-3xl font-extrabold tracking-[0.25em] text-ink my-1">
                    {activeGroup.plain_code}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyCode(activeGroup.plain_code)}
                    className="gap-1.5 text-xs font-semibold"
                  >
                    <Copy className="size-3.5" /> Copy Code
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-sm font-semibold text-moss">
                <Trophy className="size-4" /> Goal Reward: +{activeGroup.points_reward} Points for all members
              </div>

              {/* Complete Action */}
              <div className="pt-2">
                <Button
                  size="lg"
                  onClick={handleCompleteGoal}
                  className="w-full bg-stamp hover:bg-stamp-ink text-primary-foreground font-bold shadow-md gap-2"
                >
                  <Check className="size-5" /> Complete Group Goal & Claim +{activeGroup.points_reward} PTS
                </Button>
                <p className="text-[11px] text-ink-muted mt-2">
                  Click once everyone in the group has gathered and completed the quest.
                </p>
              </div>
            </div>
          )}
        </section>
      ) : tab === "create" ? (
        /* 2. Create Group Form */
        <form onSubmit={handleCreateGroup} className="rounded-3xl border border-sand bg-paper-raised p-6 shadow-paper space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-ink-muted">Group Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sunset Walkers, Coffee & Sketch"
              className="bg-paper font-semibold"
              maxLength={40}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-ink-muted">Select Group Goal / Quest</label>
            <div className="flex flex-wrap gap-1.5">
              {DEFAULT_QUESTS.map((q) => (
                <button
                  type="button"
                  key={q}
                  onClick={() => { setQuest(q); setCustomQuest(""); }}
                  className={cn(
                    "rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all text-left",
                    quest === q && !customQuest
                      ? "border-stamp bg-stamp-soft text-stamp-ink shadow-sm"
                      : "border-sand bg-paper text-ink-muted hover:border-ink-muted"
                  )}
                >
                  {q}
                </button>
              ))}
            </div>

            <Input
              value={customQuest}
              onChange={(e) => setCustomQuest(e.target.value)}
              placeholder="Or write a custom group goal..."
              className="bg-paper text-xs mt-2"
              maxLength={80}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-ink-muted">Points Reward for Group</label>
            <div className="grid grid-cols-3 gap-2">
              {[150, 250, 500].map((pts) => (
                <button
                  type="button"
                  key={pts}
                  onClick={() => setRewardPoints(pts)}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-2xl border p-3 text-center transition-all",
                    rewardPoints === pts
                      ? "border-stamp bg-stamp-soft text-stamp-ink shadow-sm font-bold"
                      : "border-sand bg-paper text-ink-muted hover:border-ink-muted"
                  )}
                >
                  <Trophy className="size-4 mb-1 text-stamp" />
                  <span className="font-mono text-base font-extrabold">{pts} PTS</span>
                  <span className="text-[10px] opacity-75">Per Member</span>
                </button>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-stamp hover:bg-stamp-ink text-primary-foreground font-bold shadow-md gap-2 py-6 text-base"
          >
            {submitting ? "Generating..." : <><Plus className="size-5" /> Generate Group & 6-Digit Code</>}
          </Button>
        </form>
      ) : tab === "join" ? (
        /* 3. Join with 6-digit Code */
        <section className="rounded-3xl border border-sand bg-paper-raised p-6 shadow-paper space-y-4">
          <div>
            <h3 className="font-serif text-xl font-bold text-ink">Enter 6-Digit Group Code</h3>
            <p className="text-xs text-ink-muted mt-1">
              Ask your friend or host for their 6-digit code to join their group meetup in person.
            </p>
          </div>

          <form onSubmit={handleJoinWithCode} className="flex gap-2">
            <Input
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              inputMode="numeric"
              maxLength={7}
              placeholder="e.g. 731 406"
              className="bg-paper font-mono text-2xl tracking-[0.2em] font-extrabold text-center h-14"
              required
            />
            <Button
              type="submit"
              disabled={joining || inputCode.replace(/\D/g, "").length !== 6}
              className="h-14 px-6 bg-stamp hover:bg-stamp-ink text-primary-foreground font-bold"
            >
              {joining ? "Joining..." : "Join"}
            </Button>
          </form>

          <div className="rounded-2xl bg-paper p-4 border border-sand text-xs text-ink-muted space-y-1">
            <p className="font-semibold text-ink">💡 Tip:</p>
            <p>You can also explore active public community groups in the "Community" tab and join directly.</p>
          </div>
        </section>
      ) : (
        /* 4. Community Groups List */
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold text-ink">Active Community Groups</h3>
            <Button size="sm" variant="ghost" onClick={loadCommunityGroups} className="text-xs text-stamp-ink">
              Refresh
            </Button>
          </div>

          {loadingGroups ? (
            <div className="py-8 text-center text-sm text-ink-muted">Loading active groups...</div>
          ) : communityGroups.length === 0 ? (
            <div className="rounded-2xl border border-sand bg-paper-raised p-8 text-center text-ink-muted space-y-3">
              <Users className="size-8 mx-auto text-sand" />
              <p className="text-sm font-semibold">No active community groups yet.</p>
              <Button size="sm" onClick={() => setTab("create")}>Be the first to create one</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {communityGroups.map((g) => (
                <div
                  key={g.id}
                  className="rounded-2xl border border-sand bg-paper-raised p-4 shadow-paper flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-stamp/40 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-ink truncate">{g.title}</h4>
                      <span className="rounded-md bg-sand/30 px-1.5 py-0.5 font-mono text-[11px] font-bold text-ink-muted">
                        Code: {g.plain_code}
                      </span>
                    </div>
                    <p className="text-xs text-ink-muted mt-1 truncate">🎯 {g.goal_quest}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-stamp-soft px-2 py-0.5 text-[11px] font-bold text-stamp-ink">
                        <Trophy className="size-3" /> +{g.points_reward} PTS
                      </span>
                      <span className="text-[11px] text-ink-muted">
                        Status: <strong className={g.status === "completed" ? "text-moss font-semibold" : "text-stamp font-semibold"}>{g.status}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyCode(g.plain_code)}
                      className="text-xs gap-1"
                    >
                      <Copy className="size-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        setActiveGroup(g);
                        setGoalCompleted(g.status === "completed");
                      }}
                      className="bg-stamp hover:bg-stamp-ink text-primary-foreground text-xs font-bold gap-1"
                    >
                      View & Claim <ArrowRight className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
