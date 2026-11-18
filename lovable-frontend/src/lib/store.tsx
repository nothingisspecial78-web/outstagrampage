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
export type Msg = {
  id: string;
  mine: boolean;
  text: string;
  audioUrl?: string;
  audioDuration?: number;
  postcard?: Postcard;
  callRecord?: {
    type: "voice" | "video";
    status: "completed" | "missed" | "declined";
    duration?: number;
  };
};
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
  const [seen, setSeenState] = useState(0);
  const [rack, setRack] = useState<Postcard[]>(RACK);
  const [stamps, setStamps] = useState<Stamp[]>(initialStamps);
  const [crafts, setCrafts] = useState<Craft[]>(initialCrafts);
  const [chats, setChats] = useState<Chat[]>(initialChats);
  const [coachLeft, setCoachLeft] = useState(3);
  const [demo, setDemo] = useState(false);
  const [friends, setFriends] = useState<string[]>(["Maya", "Jonas", "Priya"]);
  const [dwell, setDwell] = useState(true);
  const [session, setSessionState] = useState<Session | null>(null);
  const [reports, setReports] = useState<Report[]>(initialReports);
  const [offers, setOffers] = useState<Offer[]>(initialOffers);
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [quests, setQuests] = useState<string[]>([
    "Notice 3 things in nature",
    "Walk for 20 minutes without your phone",
    "Find a local cafe and sit outside",
    "Send a postcard to an old friend",
    "Visit a bookstore and browse a new section",
  ]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const d = localStorage.getItem("os-demo");
      if (d !== null) setDemo(d === "1");
      const c = localStorage.getItem("os-chats");
      if (c) setChats(JSON.parse(c));
      const s = localStorage.getItem("os-session");
      if (s) setSessionState(JSON.parse(s));
      const f = localStorage.getItem("os-friends");
      if (f) setFriends(JSON.parse(f));
    } catch {}
    setReady(true);

    // Initial background sync with Supabase tables
    Promise.all([fetchLiveQuests(), fetchLivePlaces(), fetchLiveOffers()]).then(([q, p, o]) => {
      if (o && o.length > 0) {
        const liveOffers: Offer[] = o.map((item: any) => ({
          id: item.id,
          place: item.places?.name || "Local Shop",
          partner: item.places?.name || "Partner",
          text: item.description,
          status: item.status as Offer["status"],
        }));
        setOffers((prev) => [...liveOffers, ...prev]);
      }
    }).catch((err) => {
      console.warn("Supabase initial sync fallback:", err);
    });

    // Also fetch live postcards from Supabase
    Promise.resolve(
      supabase.from('postcards').select('*').order('taken_at', { ascending: false }).limit(10)
    ).then(({ data }: any) => {
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
  useEffect(() => { if (ready) { try { localStorage.setItem("os-friends", JSON.stringify(friends)); } catch {} } }, [friends, ready]);

  const setSession = (s: Session | null) => {
    setSessionState(s);
    try { s ? localStorage.setItem("os-session", JSON.stringify(s)) : localStorage.removeItem("os-session"); } catch {}
  };

  const signIn = (email: string, role: Role, name?: string) => {
    setSession({
      email,
      role,
      name: name || (role === "admin" ? "Ada Admin" : "Sam Okafor"),
    });
  };

  const signOut = () => setSession(null);

  const addStamp = (kind: Stamp["kind"], label: string) =>
    setStamps((s) => [{ id: `s_${Date.now()}`, kind, label, date: today() }, ...s]);

  const addPostcard = (pc: Postcard) => {
    setRack((r) => [pc, ...r]);
    addStamp("place", pc.place);
  };

  const logQuest = (reflection: string, minutes: number = 30) => {
    setQuestDone(true);
    setHours((h) => +(h + minutes / 60).toFixed(1));
    addStamp("quest", reflection.slice(0, 24));
    logQuestToSupabase(
      "11111111-1111-1111-1111-111111111101",
      reflection,
      minutes
    ).catch(() => {});
  };

  const completeQuest = (minutes: number = 30) => {
    setQuestDone(true);
    setHours((h) => Math.round((h + minutes / 60) * 10) / 10);
    addStamp("quest", "Notice 3 things");
    logQuestToSupabase(
      "11111111-1111-1111-1111-111111111101",
      "Completed daily outdoor reflection",
      minutes
    ).catch(() => {});
  };

  const addCraft = (
    titleOrCraft: string | { title: string; mediums: string[]; notes: string },
    maybeMediums?: string[],
    maybeNotes?: string
  ) => {
    const title = typeof titleOrCraft === "string" ? titleOrCraft : titleOrCraft.title;
    const mediums = typeof titleOrCraft === "string" ? (maybeMediums || []) : titleOrCraft.mediums;
    const notes = typeof titleOrCraft === "string" ? (maybeNotes || "") : titleOrCraft.notes;
    setCrafts((c) => [{ id: `c_${Date.now()}`, title, mediums, notes, date: today() }, ...c]);
    addStamp("craft", title);
    logCraftToSupabase(title, mediums, notes).catch(() => {});
  };

  const sendMsg = (chatId: string, text: string) => {
    setChats((cs) =>
      cs.map((c) =>
        c.id === chatId
          ? { ...c, messages: [...c.messages, { id: `m_${Date.now()}`, mine: true, text }] }
          : c
      )
    );
  };

  const send = (chatId: string, text: string) => {
    sendMsg(chatId, text);
  };

  const sendVoice = (chatId: string, audioUrl: string, duration: number) => {
    setChats((cs) =>
      cs.map((c) =>
        c.id === chatId
          ? {
              ...c,
              messages: [
                ...c.messages,
                {
                  id: `m_voice_${Date.now()}`,
                  mine: true,
                  text: "Voice message",
                  audioUrl,
                  audioDuration: duration,
                },
              ],
            }
          : c
      )
    );
  };

  const logCallEvent = (
    chatId: string,
    type: "voice" | "video",
    status: "completed" | "missed" | "declined",
    duration?: number
  ) => {
    const durationLabel = duration !== undefined
      ? ` · ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, "0")}`
      : "";
    const callRecord = duration !== undefined ? { type, status, duration } : { type, status };
    setChats((cs) =>
      cs.map((c) =>
        c.id === chatId
          ? {
              ...c,
              messages: [
                ...c.messages,
                {
                  id: `m_call_${Date.now()}`,
                  mine: true,
                  text: `${type === "voice" ? "Voice" : "Video"} call (${status})${durationLabel}`,
                  callRecord,
                },
              ],
            }
          : c
      )
    );
  };

  const sendPostcardNote = (targetUser: string, noteText: string, postcard: Postcard) => {
    const first = targetUser.split(" ")[0] ?? targetUser;
    const chatId = first.toLowerCase().replace(/[^a-z0-9]+/g, "");

    const newMsg: Msg = {
      id: `m_note_${Date.now()}`,
      mine: true,
      text: noteText,
      postcard: {
        id: postcard.id,
        from: postcard.from,
        place: postcard.place,
        date: postcard.date,
        img: postcard.img,
        caption: postcard.caption,
      },
    };

    setChats((cs) => {
      const exists = cs.some((c) => c.id === chatId);
      if (exists) {
        return cs.map((c) => (c.id === chatId ? { ...c, messages: [...c.messages, newMsg] } : c));
      } else {
        const newChat: Chat = {
          id: chatId,
          name: first,
          place: postcard.place || "Somewhere nearby",
          limit: MESSAGE_LIMIT_STEP,
          messages: [
            { id: `m_intro_${Date.now() - 100}`, mine: false, text: `Hi! Thanks for checking out my postcard from ${postcard.place}.` },
            newMsg,
          ],
        };
        return [newChat, ...cs];
      }
    });

    return chatId;
  };

  const unlockChat = (chatId: string) => {
    setChats((cs) => cs.map((c) => (c.id === chatId ? { ...c, limit: c.limit + MESSAGE_LIMIT_STEP } : c)));
    const chat = chats.find((c) => c.id === chatId);
    addStamp("meetup", `with ${chat?.name ?? "Friend"}`);
  };

  const unlock = (chatId: string) => {
    unlockChat(chatId);
    const chat = chats.find((x) => x.id === chatId) ?? chats[0]!;
    setHours((h) => h + 1);
    return chat;
  };

  const startChat = (name: string) => {
    const first = name.split(" ")[0] ?? name;
    const id = first.toLowerCase().replace(/[^a-z0-9]+/g, "");
    setChats((cs) =>
      cs.some((c) => c.id === id)
        ? cs
        : [
            {
              id,
              name: first,
              place: "Somewhere nearby",
              limit: MESSAGE_LIMIT_STEP,
              messages: [{ id: `m_${Date.now()}`, mine: false, text: `Hi! It's ${first}. Fancy a walk sometime?` }],
            },
            ...cs,
          ]
    );
    return id;
  };

  const addFriend = (code: string) => {
    setFriends((f) => [...f, `Friend ${code.slice(-3)}`]);
  };

  const addFriendName = (name: string) => {
    setFriends((f) => (f.includes(name) ? f : [...f, name]));
  };

  const groupStamp = (label: string) => {
    addStamp("meetup", label);
  };

  const useCoach = () => setCoachLeft((n) => Math.max(0, n - 1));
  const toggleDemo = () => setDemo((d) => !d);
  const markSeen = (idx: number) => setSeenState((n) => Math.max(n, idx + 1));
  const setSeen = (n: number | ((prev: number) => number)) =>
    setSeenState((prev) => (typeof n === "function" ? n(prev) : Math.max(prev, n)));

  // Admin moderation actions
  const resolveReport = (reportId: string, status: "kept" | "removed") => {
    setReports((rs) => rs.map((r) => (r.id === reportId ? { ...r, status } : r)));
  };

  const reviewOffer = (offerId: string, status: "live" | "rejected") => {
    setOffers((os) => os.map((o) => (o.id === offerId ? { ...o, status } : o)));
  };

  const setMemberStatus = (memberId: string, status: "active" | "suspended") => {
    setMembers((ms) => ms.map((m) => (m.id === memberId ? { ...m, status } : m)));
  };

  const setMember = (id: string, patch: Partial<Member>) => {
    setMembers((ms) => ms.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  };

  const addQuest = (q: string) => setQuests((prev) => [q, ...prev]);
  const removeQuest = (q: string) => setQuests((prev) => prev.filter((x) => x !== q));

  return {
    hours, questDone, seen, rack, stamps, crafts, chats, coachLeft, demo, session, ready,
    reports, offers, members, quests,
    friends, setFriends, addFriend, addFriendName,
    dwell, setDwell, setDemo,
    signIn, signOut,
    setSession,
    addStamp,
    addPostcard, logQuest, completeQuest, addCraft, sendMsg, send, sendVoice, sendPostcardNote, logCallEvent, unlockChat, unlock, startChat,
    groupStamp, useCoach, toggleDemo, markSeen, setSeen,
    resolveReport, reviewOffer, setMemberStatus, setMember, addQuest, removeQuest,
    capture: (place: string) => addStamp("place", place),
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const store = useStoreState();
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore outside StoreProvider");
  return ctx;
}

export const captionValid = (c: string) => c.trim().length >= 8 && c.length <= 140;
