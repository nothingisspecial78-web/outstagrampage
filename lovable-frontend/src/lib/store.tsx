import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import cafe from "@/assets/pc-cafe.jpg";
import garden from "@/assets/pc-garden.jpg";
import books from "@/assets/pc-books.jpg";
import pier from "@/assets/pc-pier.jpg";
import { supabase, fetchLiveQuests, fetchLivePlaces, fetchLiveOffers } from "./supabase";
import { logQuestToSupabase, logCraftToSupabase } from "./api";

export const MESSAGE_LIMIT_STEP = 20;

export type Postcard = { id: string; from: string; place: string; date: string; img: string; caption: string };
export type Stamp = { id: string; kind: "place" | "meetup" | "quest" | "craft"; label: string; date: string };
export type Msg = { id: string; mine: boolean; text: string };
export type Chat = { id: string; name: string; place: string; limit: number; messages: Msg[] };
export type Craft = { id: string; title: string; mediums: string[]; notes: string; date: string };

const imgs = [cafe, garden, books, pier];
const places = ["Riverside Cafe", "Old Greenhouse", "Remparts Books", "West Pier", "Linden Park", "Harbor Steps", "Corner Bakery", "Hill Lookout", "Night Market", "Tram Stop 9"];
const names = ["Maya", "Jonas", "Priya", "Theo", "Ana", "Ravi", "Lena", "Omar", "Sun", "Elise"];
const captions = [
  "Sat here until the coffee went cold. Worth it.",
  "Fog lifted right as I walked in.",
  "Found a 1962 atlas for two coins.",
  "Everyone stopped talking when the sun dipped.",
  "Ducks have strong opinions about bread.",
  "Counted 14 boats. Lost count after.",
  "Still warm. Ate it on the bench outside.",
  "Climbed it twice. Legs hate me.",
  "Bought a lantern I don't need.",
  "Missed the tram. Glad I did.",
];
export const RACK: Postcard[] = places.map((p, i) => ({
  id: `pc${i}`, from: names[i]!, place: p, date: `NOV ${16 - (i % 5)}`, img: imgs[i % 4]!, caption: captions[i]!,
}));

const mkMsgs = (n: number): Msg[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `m${i}`, mine: i % 2 === 1,
    text: ["Are you around Saturday?", "Maybe! Where?", "The pier, around five?", "I'll bring the thermos.", "Perfect. Bring a scarf too.", "Deal.", "Did you finish that book?", "Two chapters left.", "No spoilers then.", "Promise."][i % 10]!,
  }));

const initialChats: Chat[] = [
  { id: "maya", name: "Maya", place: "West Pier", limit: 20, messages: mkMsgs(20) },
  { id: "jonas", name: "Jonas", place: "Remparts Books", limit: 20, messages: mkMsgs(14) },
  { id: "priya", name: "Priya", place: "Linden Park", limit: 20, messages: mkMsgs(6) },
];

const initialStamps: Stamp[] = [
  { id: "s1", kind: "place", label: "West Pier", date: "NOV 12" },
  { id: "s2", kind: "meetup", label: "with Priya", date: "NOV 10" },
  { id: "s3", kind: "quest", label: "Notice 3 things", date: "NOV 09" },
  { id: "s4", kind: "place", label: "Old Greenhouse", date: "NOV 07" },
  { id: "s5", kind: "craft", label: "Linocut", date: "NOV 03" },
];

const initialCrafts: Craft[] = [
  { id: "c1", title: "Linocut of the pier", mediums: ["linocut", "ink"], notes: "Carved too deep on the left rail. Love it anyway.", date: "NOV 03" },
  { id: "c2", title: "Sourdough, attempt four", mediums: ["baking"], notes: "Finally an ear. Shared half with the neighbor.", date: "OCT 28" },
];

export type Role = "user" | "admin";
export type Session = { name: string; email: string; role: Role };
export type Report = { id: string; what: string; by: string; reason: string; status: "open" | "kept" | "removed" };
export type Offer = { id: string; place: string; partner: string; text: string; status: "pending" | "live" | "rejected" };
export type Member = { id: string; name: string; handle: string; role: Role | "partner"; status: "active" | "suspended"; joined: string };
export const PLACES_INFO = places.map((p, i) => ({ id: p.toLowerCase().replace(/[^a-z0-9]+/g, "-"), name: p, x: 12 + ((i * 37) % 76), y: 14 + ((i * 53) % 70) }));

const initialReports: Report[] = [
  { id: "r1", what: "Postcard · Night Market", by: "lena.hikes", reason: "Shows a stranger's face", status: "open" },
  { id: "r2", what: "Chat message · Omar", by: "ana.bakes", reason: "Unkind language", status: "open" },
  { id: "r3", what: "Postcard · Hill Lookout", by: "theo.pier", reason: "Location looks wrong", status: "open" },
];
const initialOffers: Offer[] = [
  { id: "o1", place: "Riverside Cafe", partner: "Riverside Cafe", text: "Show your stamp for a free chai", status: "live" },
  { id: "o2", place: "Remparts Books", partner: "Remparts Books", text: "10% off any used atlas", status: "pending" },
  { id: "o3", place: "Corner Bakery", partner: "Corner Bakery", text: "Day-old loaf free after 5pm", status: "pending" },
];
const initialMembers: Member[] = [
  { id: "u1", name: "Sam Okafor", handle: "sam.okafor", role: "user", status: "active", joined: "OCT 02" },
  { id: "u2", name: "Maya Lind", handle: "maya.walks", role: "user", status: "active", joined: "OCT 05" },
  { id: "u3", name: "Jonas Berg", handle: "jonas.reads", role: "user", status: "active", joined: "OCT 11" },
  { id: "u4", name: "Riverside Cafe", handle: "riverside", role: "partner", status: "active", joined: "OCT 14" },
  { id: "u5", name: "Omar Haddad", handle: "omar.cycles", role: "user", status: "suspended", joined: "OCT 20" },
  { id: "u6", name: "Ada Admin", handle: "ada.admin", role: "admin", status: "active", joined: "SEP 30" },
];

type Store = ReturnType<typeof useStoreState>;
// Keep one context across hot reloads so a reloaded store module still finds the provider.
const g = globalThis as unknown as { __osStoreCtx?: React.Context<Store | null> };
const Ctx = g.__osStoreCtx ?? (g.__osStoreCtx = createContext<Store | null>(null));

function today() {
  return new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit" }).toUpperCase();
}

function useStoreState() {
  const [hours, setHours] = useState(12.5);
  const [questDone, setQuestDone] = useState(false);
  const [seen, setSeen] = useState(0);
  const [rack, setRack] = useState<Postcard[]>(RACK);
  const [chats, setChats] = useState(initialChats);
  const [stamps, setStamps] = useState(initialStamps);
  const [crafts, setCrafts] = useState(initialCrafts);
  const [demo, setDemo] = useState(false);
  const [coachLeft, setCoachLeft] = useState(3);
  const [friends, setFriends] = useState<string[]>(["Maya", "Jonas", "Priya"]);
  const [session, setSessionState] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [dwell, setDwell] = useState(true);
  const [reports, setReports] = useState(initialReports);
  const [offers, setOffers] = useState(initialOffers);
  const [members, setMembers] = useState(initialMembers);
  const [quests, setQuests] = useState(["Walk 100 steps and notice three things", "Say hi to a shopkeeper by name", "Sit somewhere new for 15 minutes"]);
  useEffect(() => {
    try { const raw = localStorage.getItem("os-session"); if (raw) setSessionState(JSON.parse(raw)); } catch {}
    try { const c = localStorage.getItem("os-chats"); if (c) setChats(JSON.parse(c)); } catch {}
    try { if (localStorage.getItem("os-demo") === "1") setDemo(true); } catch {}
    setReady(true);

    // Hydrate live data from Supabase if connected
    Promise.all([fetchLiveQuests(), fetchLiveOffers()]).then(([qList, oList]) => {
      if (qList && qList.length > 0) {
        setQuests(qList.map((q: any) => q.title || q.description));
      }
      if (oList && oList.length > 0) {
        setOffers(oList.map((o: any) => ({
          id: o.id,
          place: o.place_id || "Riverside Cafe",
          partner: o.partner_name || "Partner",
          text: o.description || o.title || "Special perk",
          status: o.status || "live"
        })));
      }
    }).catch((err) => {
      console.warn("Supabase initial sync fallback:", err);
    });

    // Also fetch live postcards from Supabase
    supabase.from('postcards').select('*').order('taken_at', { ascending: false }).limit(10).then(({ data }) => {
      if (data && data.length > 0) {
        const liveCards: Postcard[] = data.map((p: any) => ({
          id: p.id,
          from: "You",
          place: "Riverside Cafe",
          date: "TODAY",
          img: p.image_path || cafe,
          caption: p.caption,
        }));
        setRack((existing) => [...liveCards, ...existing]);
      }
    }).catch(() => {});
  }, []);
  useEffect(() => { if (ready) { try { localStorage.setItem("os-demo", demo ? "1" : "0"); } catch {} } }, [demo, ready]);
  useEffect(() => { if (ready) { try { localStorage.setItem("os-chats", JSON.stringify(chats)); } catch {} } }, [chats, ready]);
  const setSession = (s: Session | null) => {
    setSessionState(s);
    try { s ? localStorage.setItem("os-session", JSON.stringify(s)) : localStorage.removeItem("os-session"); } catch {}
  };

  const addStamp = (kind: Stamp["kind"], label: string) =>
    setStamps((s) => [{ id: crypto.randomUUID(), kind, label, date: today() }, ...s]);

  return {
    hours, questDone, seen, rack, chats, stamps, crafts, demo, coachLeft, friends,
    session, ready, dwell, setDwell, reports, offers, members, quests,
    signIn: (email: string, role: Role, name?: string) => setSession({ email, role, name: name || (role === "admin" ? "Ada Admin" : "Sam Okafor") }),
    signOut: () => setSession(null),
    resolveReport: (id: string, status: Report["status"]) => setReports((r) => r.map((x) => x.id === id ? { ...x, status } : x)),
    reviewOffer: (id: string, status: Offer["status"]) => setOffers((o) => o.map((x) => x.id === id ? { ...x, status } : x)),
    setMember: (id: string, patch: Partial<Member>) => setMembers((m) => m.map((x) => x.id === id ? { ...x, ...patch } : x)),
    addQuest: (q: string) => setQuests((qs) => [...qs, q]),
    removeQuest: (q: string) => setQuests((qs) => qs.filter((x) => x !== q)),
    groupStamp: (label: string) => addStamp("meetup", label),
    setSeen, setDemo,
    completeQuest: (minutes: number) => {
      setQuestDone(true);
      setHours((h) => Math.round((h + minutes / 60) * 10) / 10);
      addStamp("quest", "Notice 3 things");
      logQuestToSupabase("11111111-1111-1111-1111-111111111101", "Completed daily outdoor reflection", minutes);
    },
    send: (chatId: string, text: string) =>
      setChats((cs) => cs.map((c) => c.id === chatId && c.messages.length < c.limit
        ? { ...c, messages: [...c.messages, { id: crypto.randomUUID(), mine: true, text }] } : c)),
    unlock: (chatId: string) => {
      const c = chats.find((x) => x.id === chatId) ?? chats[0]!;
      setChats((cs) => cs.map((x) => x.id === c.id ? { ...x, limit: x.limit + MESSAGE_LIMIT_STEP } : x));
      addStamp("meetup", `with ${c.name}`);
      setHours((h) => h + 1);
      return c;
    },
    startChat: (name: string) => {
      const first = name.split(" ")[0] ?? name;
      const id = first.toLowerCase().replace(/[^a-z0-9]+/g, "");
      setChats((cs) => cs.some((c) => c.id === id) ? cs : [{ id, name: first, place: "Somewhere nearby", limit: MESSAGE_LIMIT_STEP, messages: [{ id: crypto.randomUUID(), mine: false, text: `Hi! It's ${first}. Fancy a walk sometime?` }] }, ...cs]);
      return id;
    },
    addFriendName: (name: string) => setFriends((f) => f.includes(name) ? f : [...f, name]),
    capture: (place: string) => addStamp("place", place),
    addPostcard: (p: Postcard) => {
      setRack((r) => [p, ...r]);
      addStamp("place", p.place);
    },
    useCoach: () => setCoachLeft((n) => Math.max(0, n - 1)),
    addCraft: (c: Omit<Craft, "id" | "date">) => {
      setCrafts((cs) => [{ ...c, id: crypto.randomUUID(), date: today() }, ...cs]);
      addStamp("craft", c.mediums[0] ?? "Craft");
      logCraftToSupabase(c.title, c.mediums, c.notes);
    },
    addFriend: (code: string) => setFriends((f) => [...f, `Friend ${code.slice(-3)}`]),
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const s = useStoreState();
  return <Ctx.Provider value={s}>{children}</Ctx.Provider>;
}
export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore outside provider");
  return s;
}

export function captionValid(t: string) {
  const n = t.trim().length;
  return n >= 8 && n <= 140;
}
