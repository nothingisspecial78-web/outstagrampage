import { supabase } from "@/lib/supabase";

export type Person = {
  id?: string;
  handle: string;
  name: string;
  avatar: string;
  friendCode?: string;
};

const av = (n: number) => `https://i.pravatar.cc/150?img=${n}`;
export const ME: Person = { handle: "user", name: "You", avatar: av(12) };

// Fallback demo references (only used if explicitly in isolated demo mode)
export const DEMO_PEOPLE: Person[] = [
  { id: "demo-maya", handle: "maya.walks", name: "Maya Lin", avatar: av(5), friendCode: "318492" },
  { id: "demo-jonas", handle: "jonas.reads", name: "Jonas Berg", avatar: av(11), friendCode: "492015" },
  { id: "demo-priya", handle: "priya.outside", name: "Priya Nair", avatar: av(9), friendCode: "820147" },
];

export const PEOPLE: Person[] = DEMO_PEOPLE;
export const SUGGESTED: Person[] = [];
export const ALL_PEOPLE: Person[] = DEMO_PEOPLE;

// Memory cache of real registered users across sessions
let cachedRealUsers: Person[] = [];

export function getCachedRealUsers(): Person[] {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("os-registered-users");
      if (stored) {
        const parsed: Person[] = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          parsed.forEach((p) => {
            if (!cachedRealUsers.some((u) => (p.id && u.id === p.id) || u.handle === p.handle)) {
              cachedRealUsers.push(p);
            }
          });
        }
      }
    } catch {}
  }
  return cachedRealUsers;
}

export function saveRegisteredUser(p: Person) {
  if (!p || !p.name) return;
  getCachedRealUsers();
  const idx = cachedRealUsers.findIndex((u) => (p.id && u.id === p.id) || u.handle === p.handle);
  if (idx >= 0) {
    cachedRealUsers[idx] = { ...cachedRealUsers[idx], ...p };
  } else {
    cachedRealUsers.unshift(p);
  }
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("os-registered-users", JSON.stringify(cachedRealUsers));
    } catch {}
  }
}

export async function searchRealUsers(q: string, excludeId?: string): Promise<Person[]> {
  const query = q.trim().toLowerCase();
  const localList = getCachedRealUsers();

  let remoteProfiles: Person[] = [];
  try {
    let queryBuilder = supabase
      .from("profiles")
      .select("id, display_name, friend_code, created_at")
      .limit(40);

    if (query) {
      queryBuilder = queryBuilder.or(`display_name.ilike.%${query}%,friend_code.ilike.%${query}%`);
    }

    const { data, error } = await queryBuilder;
    if (!error && data && data.length > 0) {
      remoteProfiles = data.map((item: any) => ({
        id: item.id,
        name: item.display_name || "Member",
        handle: item.friend_code ? item.friend_code.toLowerCase() : item.id.slice(0, 8),
        friendCode: item.friend_code,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(item.display_name || "User")}`,
      }));

      remoteProfiles.forEach(saveRegisteredUser);
    }
  } catch (err) {
    console.warn("Could not query Supabase profiles:", err);
  }

  // Combine remote and local registered profiles, deduplicating by ID/handle
  const map = new Map<string, Person>();
  remoteProfiles.forEach((p) => map.set(p.id || p.handle, p));
  localList.forEach((p) => {
    const key = p.id || p.handle;
    if (!map.has(key)) {
      if (!query || p.name.toLowerCase().includes(query) || p.handle.toLowerCase().includes(query)) {
        map.set(key, p);
      }
    }
  });

  const allFound = Array.from(map.values());

  // Filter out the current logged in user so they cannot search for themselves
  return allFound.filter((p) => {
    if (excludeId && (p.id === excludeId || p.handle === excludeId || p.name.toLowerCase() === excludeId.toLowerCase())) {
      return false;
    }
    return true;
  });
}

export type Profile = Person & {
  bio: string;
  location: string;
  hours: number;
  code: string;
  stamps: { kind: "place" | "meetup" | "quest" | "craft"; label: string; date: string }[];
};

const BIOS = [
  "Walks first, coffee second.",
  "Reads on benches. Returns books late.",
  "Always outside, usually in a park.",
  "Pier at sunset, every Friday.",
  "Bakes too much. Shares it all.",
  "Sketches strangers' dogs (with permission).",
  "Hikes, then naps.",
  "Two wheels, no headphones.",
];
const LOCS = [
  "West Pier",
  "Remparts Books",
  "Linden Park",
  "Harbor Steps",
  "Corner Bakery",
  "Old Greenhouse",
  "Hill Lookout",
  "Riverside Cafe",
];

export function profileFor(handle: string): Profile | undefined {
  const all = [...getCachedRealUsers(), ...DEMO_PEOPLE];
  const i = all.findIndex((p) => p.handle === handle || p.id === handle);
  const p = all[i];
  if (!p) return undefined;
  const loc = LOCS[i % LOCS.length]!;
  return {
    ...p,
    bio: BIOS[i % BIOS.length]!,
    location: loc,
    hours: 6 + ((i * 7) % 30) + 0.5,
    code: p.friendCode || String(100000 + ((i + 1) * 137911) % 900000),
    stamps: [
      { kind: "place", label: loc, date: "TODAY" },
      { kind: "quest", label: "Notice 3 things", date: "YESTERDAY" },
    ],
  };
}

export function searchPeople(q: string, excludeId?: string): Person[] {
  const s = q.trim().toLowerCase();
  const real = getCachedRealUsers();
  const pool = real.length > 0 ? real : [];

  const filtered = !s
    ? pool
    : pool.filter(
        (p) =>
          `${p.handle} ${p.name}`.toLowerCase().includes(s) ||
          (p.friendCode && p.friendCode.toLowerCase().includes(s))
      );

  return filtered.filter((p) => {
    if (excludeId && (p.id === excludeId || p.handle === excludeId || p.name.toLowerCase() === excludeId.toLowerCase())) {
      return false;
    }
    return true;
  });
}
