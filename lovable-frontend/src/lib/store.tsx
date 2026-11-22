import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import cafe from "@/assets/pc-cafe.jpg";
import garden from "@/assets/pc-garden.jpg";
import books from "@/assets/pc-books.jpg";
import pier from "@/assets/pc-pier.jpg";
import { supabase, fetchLiveQuests, fetchLivePlaces, fetchLiveOffers } from "./supabase";
import { logQuestToSupabase, logCraftToSupabase } from "./api";

export const MESSAGE_LIMIT_STEP = 20;

export type Postcard = {
  id: string;
  from: string;
  place: string;
  date: string;
  img: string;
  caption: string;
  authorId?: string;
  avatar?: string;
  handle?: string;
  isDemo?: boolean;
};
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
  clientMsgId?: string;
  createdAt?: number;
};
export type Chat = { id: string; peerId?: string; peerAvatar?: string; name: string; place: string; limit: number; messages: Msg[] };
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
export const DEMO_RACK: Postcard[] = places.map((p, i) => ({
  id: `pc${i}`, from: names[i]!, place: p, date: `NOV ${16 - (i % 5)}`, img: imgs[i % 4]!, caption: captions[i]!,
}));
export const RACK: Postcard[] = [];

const initialChats: Chat[] = [];
const initialStamps: Stamp[] = [];
const initialCrafts: Craft[] = [];

export type Role = "user" | "admin";
export type Session = { id?: string; name: string; email: string; role: Role; friendCode?: string; avatar?: string; bio?: string };
export type Report = { id: string; what: string; by: string; reason: string; status: "open" | "kept" | "removed" };
export type Offer = { id: string; place: string; partner: string; text: string; status: "pending" | "live" | "rejected" };
export type Member = { id: string; name: string; handle: string; role: Role | "partner"; status: "active" | "suspended"; joined: string };
export const PLACES_INFO = places.map((p, i) => ({ id: p.toLowerCase().replace(/[^a-z0-9]+/g, "-"), name: p, x: 12 + ((i * 37) % 76), y: 14 + ((i * 53) % 70) }));

const initialReports: Report[] = [];
const initialOffers: Offer[] = [
  { id: "o1", place: "Riverside Cafe", partner: "Riverside Cafe", text: "Show your stamp for a free chai", status: "live" },
  { id: "o2", place: "Remparts Books", partner: "Remparts Books", text: "10% off any used atlas", status: "pending" },
  { id: "o3", place: "Corner Bakery", partner: "Corner Bakery", text: "Day-old loaf free after 5pm", status: "pending" },
];
const initialMembers: Member[] = [];

type Store = ReturnType<typeof useStoreState>;
// Keep one context across hot reloads so a reloaded store module still finds the provider.
const g = globalThis as unknown as { __osStoreCtx?: React.Context<Store | null> };
const Ctx = g.__osStoreCtx ?? (g.__osStoreCtx = createContext<Store | null>(null));

function today() {
  return new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit" }).toUpperCase();
}

const sentMsgIds = new Set<string>();
const receivedMsgIds = new Set<string>();
let lastSendTrack = { text: "", time: 0 };

function useStoreState() {
  const [hours, setHours] = useState(12.5);
  const [points, setPoints] = useState(350);
  const [questDone, setQuestDone] = useState(false);
  const [seen, setSeenState] = useState(0);
  const [rack, setRack] = useState<Postcard[]>(RACK);
  const [stamps, setStamps] = useState<Stamp[]>(initialStamps);
  const [crafts, setCrafts] = useState<Craft[]>(initialCrafts);
  const [chats, setChats] = useState<Chat[]>(initialChats);
  const [coachLeft, setCoachLeft] = useState(3);
  const [demo, setDemo] = useState(false);
  const [friends, setFriends] = useState<string[]>([]);
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
      localStorage.removeItem("os-chats"); // Clear any legacy un-scoped mock chats
      const d = localStorage.getItem("os-demo");
      if (d !== null) setDemo(d === "1");
      const s = localStorage.getItem("os-session");
      if (s) {
        const parsed: Session = JSON.parse(s);
        setSessionState(parsed);
        if (parsed?.id) {
          const userChats = localStorage.getItem(`os-chats_${parsed.id}`);
          if (userChats) setChats(JSON.parse(userChats));
        }
      }
      const f = localStorage.getItem("os-friends");
      if (f) setFriends(JSON.parse(f));
    } catch {}
    setReady(true);

    // Supabase auth state subscriber (handles OAuth, email verification redirects with hash, session recovery)
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, authSession) => {
      if (authSession?.user) {
        const u = authSession.user;
        let displayName = u.user_metadata?.display_name || u.user_metadata?.username || u.email?.split("@")[0] || "Member";
        let userRole: Role = u.email === "nothingisspecial78@gmail.com" ? "admin" : "user";
        let friendCode: string | undefined = undefined;
        let avatarUrl: string | undefined = u.user_metadata?.avatar_url;
        let bioText: string | undefined = u.user_metadata?.bio;

        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, display_name, username, friend_code, role, avatar_url, bio, points")
            .eq("id", u.id)
            .maybeSingle();

          if (profile) {
            if (profile.username || profile.display_name) displayName = profile.username || profile.display_name;
            if (profile.friend_code) friendCode = profile.friend_code;
            if (profile.role === "admin" || u.email === "nothingisspecial78@gmail.com") userRole = "admin";
            if (profile.avatar_url) avatarUrl = profile.avatar_url;
            if (profile.bio) bioText = profile.bio;
            if (typeof profile.points === "number") setPoints(profile.points);
          }
        } catch {}

        setSessionState({
          id: u.id,
          email: u.email || `${displayName}@user`,
          name: displayName,
          role: userRole,
          friendCode,
          avatar: avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`,
          bio: bioText,
        });
      }
    });

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

    // Fetch live shared community postcards from Supabase
    Promise.resolve(
      supabase
        .from('postcards')
        .select('id, image_path, caption, taken_at, author_id, is_demo, profiles!postcards_author_id_fkey(display_name, username, avatar_url), places(name)')
        .order('taken_at', { ascending: false })
        .limit(50)
    ).then(({ data, error }: any) => {
      if (error) {
        console.warn("Could not fetch postcards from Supabase:", error);
      }
      if (data && data.length > 0) {
        const liveCards: Postcard[] = data.map((p: any) => ({
          id: p.id,
          from: p.profiles?.display_name || p.profiles?.username || "Community Member",
          handle: p.profiles?.username || undefined,
          avatar: p.profiles?.avatar_url || undefined,
          place: p.places?.name || "Riverside Artisan Cafe",
          date: new Date(p.taken_at).toLocaleDateString("en-US", { month: "short", day: "2-digit" }).toUpperCase(),
          img: p.image_path || cafe,
          caption: p.caption,
          authorId: p.author_id,
          isDemo: Boolean(p.is_demo),
        }));
        setRack((existing) => {
          const ids = new Set(liveCards.map((c) => c.id));
          return [...liveCards, ...existing.filter((c) => !ids.has(c.id))];
        });
      }
    }).catch((err) => {
      console.warn("Failed fetching live postcards:", err);
    });

    // Real-time listener for newly shared postcards across all accounts
    const postcardSubName = `public_postcards_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const postcardSub = supabase
      .channel(postcardSubName)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'postcards' }, async (payload: any) => {
        const row = payload.new;
        if (!row) return;
        let authorName = "Community Member";
        let handleName: string | undefined = undefined;
        let avatarUrl: string | undefined = undefined;
        let placeName = "Riverside Artisan Cafe";
        try {
          if (row.author_id) {
            const { data: prof } = await supabase.from('profiles').select('username, display_name, avatar_url').eq('id', row.author_id).maybeSingle();
            if (prof) {
              authorName = prof.display_name || prof.username || authorName;
              handleName = prof.username || undefined;
              avatarUrl = prof.avatar_url || undefined;
            }
          }
          if (row.place_id) {
            const { data: pl } = await supabase.from('places').select('name').eq('id', row.place_id).maybeSingle();
            if (pl) placeName = pl.name || placeName;
          }
        } catch {}

        const newPost: Postcard = {
          id: row.id,
          from: authorName,
          handle: handleName,
          avatar: avatarUrl,
          place: placeName,
          date: 'TODAY',
          img: row.image_path,
          caption: row.caption,
          authorId: row.author_id,
          isDemo: Boolean(row.is_demo),
        };
        setRack((prev) => [newPost, ...prev.filter((c) => c.id !== newPost.id)]);
      })
      .subscribe();

    // Fetch live registered members from Supabase profiles
    Promise.resolve(
      supabase.from("profiles").select("id, display_name, friend_code, created_at").limit(50)
    ).then(({ data }: any) => {
      if (data && data.length > 0) {
        const liveMembers: Member[] = data.map((p: any) => ({
          id: p.id,
          name: p.display_name || "Member",
          handle: p.friend_code ? p.friend_code.toLowerCase() : p.id.slice(0, 8),
          role: "user" as Role,
          status: "active" as const,
          joined: p.created_at
            ? new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "2-digit" }).toUpperCase()
            : "TODAY",
        }));
        setMembers(liveMembers);
      }
    }).catch(() => {});

    return () => {
      authListener?.subscription?.unsubscribe();
      try {
        supabase.removeChannel(postcardSub);
      } catch {}
    };
  }, []);

  // Listen for real-time incoming chat messages and load persistent history across users
  useEffect(() => {
    if (!session?.id && !session?.name && !session?.email) return;

    const myId = session.id || "";
    const myName = (session.name || "").toLowerCase();
    const myEmail = (session.email || "").toLowerCase();

    // 1. Initial Load of past Direct Messages from Supabase
    supabase
      .from("direct_messages")
      .select("*")
      .order("created_at", { ascending: true })
      .then(({ data }: any) => {
        if (!data || data.length === 0) return;
        const relevant = data.filter((m: any) => {
          const recId = (m.receiver_id || "").toLowerCase();
          const sndId = (m.sender_id || "").toLowerCase();
          const recName = (m.receiver_name || "").toLowerCase();
          const sndName = (m.sender_name || "").toLowerCase();
          return (
            recId === myId.toLowerCase() ||
            sndId === myId.toLowerCase() ||
            (myEmail && (recId === myEmail || sndId === myEmail)) ||
            (myName && (recName === myName || sndName === myName))
          );
        });

        if (relevant.length > 0) {
          setChats((prev) => {
            const updated = [...prev];
            relevant.forEach((row: any) => {
              const isMine =
                row.sender_id === myId ||
                row.sender_id === myEmail ||
                (myName && row.sender_name?.toLowerCase() === myName);
              const peerId = isMine ? row.receiver_id : row.sender_id;
              const peerName = isMine ? row.receiver_name : row.sender_name;
              const peerAvatar = isMine ? undefined : row.sender_avatar;

              const msg: Msg = {
                id: row.id,
                mine: isMine,
                text: row.body || "",
                audioUrl: row.audio_url,
                audioDuration: row.audio_duration,
                postcard: row.postcard,
              };

              let chat = updated.find(
                (c) => c.peerId === peerId || c.name.toLowerCase() === peerName.toLowerCase() || c.id === peerId
              );
              if (chat) {
                if (!chat.messages.some((m) => m.id === msg.id)) {
                  chat.messages.push(msg);
                }
              } else {
                updated.push({
                  id: peerId,
                  peerId,
                  peerAvatar,
                  name: peerName,
                  place: "Outdoors",
                  limit: MESSAGE_LIMIT_STEP,
                  messages: [msg],
                });
              }
            });
            return updated;
          });
        }
      })
      .catch((err) => console.warn("Could not load direct messages:", err));

    // 2. Real-time PostgreSQL changes listener on direct_messages table
    const dmChannelName = `dm_global_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const dmPostgresSub = supabase
      .channel(dmChannelName)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "direct_messages" }, (payload: any) => {
        const row = payload.new;
        if (!row) return;

        const clientMsgId = row.client_msg_id;
        // Ignore if sent by myself or already present in sentMsgIds
        if (clientMsgId && sentMsgIds.has(clientMsgId)) return;
        if (
          row.sender_id === myId ||
          (myEmail && row.sender_id === myEmail) ||
          (myName && row.sender_name?.toLowerCase() === myName)
        ) {
          if (clientMsgId) sentMsgIds.add(clientMsgId);
          return;
        }

        const recId = (row.receiver_id || "").toLowerCase();
        const recName = (row.receiver_name || "").toLowerCase();
        const isForMe =
          recId === myId.toLowerCase() ||
          (myEmail && recId === myEmail) ||
          (myName && recName === myName);

        if (!isForMe) return;

        const effectiveId = clientMsgId || row.id;
        if (receivedMsgIds.has(effectiveId)) return;
        receivedMsgIds.add(effectiveId);

        const incomingMsg: Msg = {
          id: effectiveId,
          clientMsgId,
          mine: false,
          text: row.body || "",
          audioUrl: row.audio_url,
          audioDuration: row.audio_duration,
          postcard: row.postcard,
          createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
        };

        const peerId = row.sender_id;
        const peerName = row.sender_name || "Friend";

        setChats((prev) => {
          const existing = prev.find(
            (c) => c.peerId === peerId || c.name.toLowerCase() === peerName.toLowerCase() || c.id === peerId
          );
          if (existing) {
            const alreadyIn = existing.messages.some(
              (m) =>
                m.id === incomingMsg.id ||
                (clientMsgId && (m.id === clientMsgId || m.clientMsgId === clientMsgId)) ||
                (!m.mine && m.text === incomingMsg.text && Math.abs((m.createdAt || 0) - incomingMsg.createdAt!) < 6000)
            );
            if (alreadyIn) return prev;

            return prev.map((c) =>
              c.id === existing.id
                ? {
                    ...c,
                    messages: [...c.messages, incomingMsg],
                    peerAvatar: row.sender_avatar || c.peerAvatar,
                  }
                : c
            );
          } else {
            return [
              ...prev,
              {
                id: peerId,
                peerId,
                peerAvatar: row.sender_avatar,
                name: peerName,
                place: "Nearby",
                limit: MESSAGE_LIMIT_STEP,
                messages: [incomingMsg],
              },
            ];
          }
        });
      })
      .subscribe();

    // 3. Ephemeral Broadcast channels listener
    const rawIds = [
      session?.id,
      session?.email,
      session?.friendCode,
      session?.name,
    ].filter(Boolean) as string[];

    const uniqueClean = Array.from(
      new Set(rawIds.map((id) => id.replace(/[^a-zA-Z0-9_-]/g, "_")))
    );

    const channels = uniqueClean.map((cleanId) => {
      const channelName = `user_chat_${cleanId}`;
      const ch = supabase.channel(channelName, {
        config: { broadcast: { self: false } },
      });

      ch.on("broadcast", { event: "new_chat_msg" }, ({ payload }: any) => {
        if (!payload || !payload.senderId) return;
        const clientMsgId = payload.clientMsgId || payload.msgId;
        if (clientMsgId && (sentMsgIds.has(clientMsgId) || receivedMsgIds.has(clientMsgId))) return;
        if (payload.senderId === session?.id || payload.senderId === session?.email) return;

        const effectiveId = clientMsgId || `m_in_${Date.now()}`;
        receivedMsgIds.add(effectiveId);

        const incomingMsg: Msg = {
          id: effectiveId,
          clientMsgId,
          mine: false,
          text: payload.text || "",
          audioUrl: payload.audioUrl,
          audioDuration: payload.audioDuration,
          postcard: payload.postcard,
          createdAt: Date.now(),
        };

        const peerChatId = payload.chatId || payload.senderId;
        const peerName = payload.senderName || "Friend";

        setChats((prev) => {
          const existing = prev.find(
            (c) => c.id === peerChatId || c.peerId === payload.senderId || c.name.toLowerCase() === peerName.toLowerCase()
          );
          if (existing) {
            const alreadyIn = existing.messages.some(
              (m) =>
                m.id === incomingMsg.id ||
                (clientMsgId && (m.id === clientMsgId || m.clientMsgId === clientMsgId)) ||
                (!m.mine && m.text === incomingMsg.text && Math.abs((m.createdAt || 0) - incomingMsg.createdAt!) < 6000)
            );
            if (alreadyIn) return prev;

            return prev.map((c) =>
              c.id === existing.id
                ? {
                    ...c,
                    messages: [...c.messages, incomingMsg],
                    peerAvatar: payload.senderAvatar || c.peerAvatar,
                  }
                : c
            );
          } else {
            const newChat: Chat = {
              id: peerChatId,
              peerId: payload.senderId,
              peerAvatar: payload.senderAvatar,
              name: peerName,
              place: "Nearby",
              limit: MESSAGE_LIMIT_STEP,
              messages: [incomingMsg],
            };
            return [newChat, ...prev];
          }
        });
      });

      ch.subscribe();
      return ch;
    });

    return () => {
      try {
        supabase.removeChannel(dmPostgresSub);
      } catch {}
      channels.forEach((ch) => {
        try {
          supabase.removeChannel(ch);
        } catch {}
      });
    };
  }, [session?.id, session?.email, session?.friendCode, session?.name]);

  useEffect(() => { if (ready) { try { localStorage.setItem("os-demo", demo ? "1" : "0"); } catch {} } }, [demo, ready]);
  useEffect(() => {
    if (ready) {
      try {
        const key = session?.id ? `os-chats_${session.id}` : (demo ? "os-chats_guest" : null);
        if (key) localStorage.setItem(key, JSON.stringify(chats));
      } catch {}
    }
  }, [chats, ready, session?.id, demo]);
  useEffect(() => { if (ready) { try { localStorage.setItem("os-friends", JSON.stringify(friends)); } catch {} } }, [friends, ready]);

  const setSession = (s: Session | null) => {
    setSessionState(s);
    try { s ? localStorage.setItem("os-session", JSON.stringify(s)) : localStorage.removeItem("os-session"); } catch {}
  };

  const signIn = (email: string, role: Role, name?: string, id?: string, friendCode?: string, avatar?: string, bio?: string) => {
    const userId = id || email;
    setSession({
      id: userId,
      email,
      role,
      name: name || (role === "admin" ? "Admin" : email.split("@")[0]),
      friendCode,
      avatar,
      bio,
    });
    try {
      const stored = localStorage.getItem(`os-chats_${userId}`);
      setChats(stored ? JSON.parse(stored) : []);
    } catch {
      setChats([]);
    }
  };

  const signOut = () => {
    setSession(null);
    setChats([]);
    setDemo(false);
    try {
      localStorage.removeItem("os-session");
      localStorage.setItem("os-demo", "0");
    } catch {}
  };

  const addStamp = (kind: Stamp["kind"], label: string) =>
    setStamps((s) => [{ id: `s_${Date.now()}`, kind, label, date: today() }, ...s]);

  const addPoints = async (amount: number, reason?: string) => {
    setPoints((p) => {
      const next = p + amount;
      if (session?.id) {
        supabase
          .from("profiles")
          .update({ points: next })
          .eq("id", session.id)
          .then(() => {})
          .catch(() => {});
      }
      return next;
    });
    if (reason) {
      addStamp("meetup", `${reason} (+${amount} pts)`);
    }
  };

  const addPostcard = async (pc: Postcard) => {
    setRack((r) => [pc, ...r.filter((x) => x.id !== pc.id)]);
    addStamp("place", pc.place);

    try {
      const authorId = pc.authorId || session?.id || "33333333-3333-3333-3333-333333333301";
      await supabase.from("postcards").upsert({
        id: pc.id,
        author_id: authorId,
        place_id: "22222222-2222-2222-2222-222222222201",
        image_path: pc.img,
        caption: pc.caption,
        is_demo: false,
      });

      await supabase.from("stamps").insert({
        id: crypto.randomUUID(),
        user_id: authorId,
        kind: "place",
        label: pc.place,
      });
    } catch (err) {
      console.warn("Could not save postcard to Supabase:", err);
    }
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
    const trimmed = text.trim();
    if (!trimmed) return;

    // Rapid double-click / double-enter debounce guard
    const now = Date.now();
    if (trimmed === lastSendTrack.text && now - lastSendTrack.time < 500) {
      return;
    }
    lastSendTrack = { text: trimmed, time: now };

    const clientMsgId = `m_${now}_${Math.random().toString(36).slice(2, 7)}`;
    sentMsgIds.add(clientMsgId);

    setChats((cs) =>
      cs.map((c) =>
        c.id === chatId
          ? {
              ...c,
              messages: [
                ...c.messages.filter((m) => m.id !== clientMsgId && (m as any).clientMsgId !== clientMsgId),
                {
                  id: clientMsgId,
                  clientMsgId,
                  mine: true,
                  text: trimmed,
                  createdAt: now,
                },
              ],
            }
          : c
      )
    );

    const targetChat = chats.find((c) => c.id === chatId);
    const targetReceiverId = targetChat?.peerId || chatId;
    const targetReceiverName = targetChat?.name || "Friend";

    // Insert into Supabase direct_messages table for persistent cross-account chat
    supabase
      .from("direct_messages")
      .insert({
        sender_id: session?.id || session?.email || "self",
        sender_name: session?.name || "Member",
        sender_avatar: session?.avatar,
        receiver_id: targetReceiverId,
        receiver_name: targetReceiverName,
        body: trimmed,
        client_msg_id: clientMsgId,
      })
      .then(({ error }: any) => {
        if (error) console.warn("direct_messages insert error:", error);
      })
      .catch(() => {});

    const targetPeerId = targetReceiverId.replace(/[^a-zA-Z0-9_-]/g, "_");
    try {
      const ch = supabase.channel(`user_chat_${targetPeerId}`, { config: { broadcast: { self: false } } });
      ch.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await ch.send({
            type: "broadcast",
            event: "new_chat_msg",
            payload: {
              chatId,
              msgId: clientMsgId,
              clientMsgId,
              senderId: session?.id || session?.email || "self",
              senderName: session?.name || "Friend",
              senderAvatar: session?.avatar,
              text: trimmed,
            },
          });
          setTimeout(() => {
            try { supabase.removeChannel(ch); } catch {}
          }, 1000);
        }
      });
    } catch {}
  };

  const send = (chatId: string, text: string) => {
    sendMsg(chatId, text);
  };

  const sendVoice = (chatId: string, audioUrl: string, duration: number) => {
    const now = Date.now();
    const clientMsgId = `m_voice_${now}_${Math.random().toString(36).slice(2, 7)}`;
    sentMsgIds.add(clientMsgId);

    setChats((cs) =>
      cs.map((c) =>
        c.id === chatId
          ? {
              ...c,
              messages: [
                ...c.messages.filter((m) => m.id !== clientMsgId && (m as any).clientMsgId !== clientMsgId),
                {
                  id: clientMsgId,
                  clientMsgId,
                  mine: true,
                  text: "Voice message",
                  audioUrl,
                  audioDuration: duration,
                  createdAt: now,
                },
              ],
            }
          : c
      )
    );

    const targetChat = chats.find((c) => c.id === chatId);
    const targetReceiverId = targetChat?.peerId || chatId;
    const targetReceiverName = targetChat?.name || "Friend";

    // Insert voice into direct_messages table
    supabase
      .from("direct_messages")
      .insert({
        sender_id: session?.id || session?.email || "self",
        sender_name: session?.name || "Member",
        sender_avatar: session?.avatar,
        receiver_id: targetReceiverId,
        receiver_name: targetReceiverName,
        body: "Voice message",
        audio_url: audioUrl,
        audio_duration: duration,
        client_msg_id: clientMsgId,
      })
      .then(({ error }: any) => {
        if (error) console.warn("direct_messages voice insert error:", error);
      })
      .catch(() => {});

    const targetPeerId = targetReceiverId.replace(/[^a-zA-Z0-9_-]/g, "_");
    try {
      const ch = supabase.channel(`user_chat_${targetPeerId}`, { config: { broadcast: { self: false } } });
      ch.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await ch.send({
            type: "broadcast",
            event: "new_chat_msg",
            payload: {
              chatId,
              msgId: clientMsgId,
              clientMsgId,
              senderId: session?.id || session?.email || "self",
              senderName: session?.name || "Friend",
              senderAvatar: session?.avatar,
              text: "Voice message",
              audioUrl,
              audioDuration: duration,
            },
          });
          setTimeout(() => {
            try { supabase.removeChannel(ch); } catch {}
          }, 1000);
        }
      });
    } catch {}
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

    // Also persist postcard note in direct_messages
    supabase
      .from("direct_messages")
      .insert({
        sender_id: session?.id || session?.email || "self",
        sender_name: session?.name || "Member",
        sender_avatar: session?.avatar,
        receiver_id: chatId,
        receiver_name: first,
        body: noteText,
        postcard: newMsg.postcard,
      })
      .then(() => {})
      .catch(() => {});

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

  const startChat = (name: string, peerId?: string, peerAvatar?: string, place = "Outdoors") => {
    const first = name.split(" ")[0] ?? name;
    const id = peerId || first.toLowerCase().replace(/[^a-z0-9]+/g, "");
    setChats((cs) => {
      const exists = cs.find((c) => c.id === id || (peerId && c.peerId === peerId));
      if (exists) {
        if ((peerId && !exists.peerId) || (peerAvatar && !exists.peerAvatar)) {
          return cs.map((c) =>
            c.id === exists.id
              ? { ...c, peerId: peerId || c.peerId, peerAvatar: peerAvatar || c.peerAvatar }
              : c
          );
        }
        return cs;
      }
      return [
        {
          id,
          peerId: peerId || id,
          peerAvatar,
          name: name,
          place,
          limit: MESSAGE_LIMIT_STEP,
          messages: [],
        },
        ...cs,
      ];
    });
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
    hours, points, setPoints, addPoints, questDone, seen, rack: demo ? [...rack, ...DEMO_RACK] : rack, stamps, crafts, chats, coachLeft, demo, session, ready,
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
