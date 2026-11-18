import { supabase } from './supabase';

const API_BASE = '/api';

export interface PostcardPayload {
  place_id: string;
  caption: string;
  lat: number;
  lng: number;
  accuracy_m?: number;
  image_base64: string;
  demo_mode?: boolean;
}

export interface CoachExperiment {
  title: string;
  days: number;
  why?: string;
  description?: string;
}

export interface CoachResponse {
  success: boolean;
  reply: string;
  experiment?: CoachExperiment;
  source?: 'ai' | 'fallback';
  remaining_today: number;
  messagesLeftToday?: number;
}

// Exact rule-based fallback keywords (scroll, read, friend, lonely, bored, default)
const FALLBACK_RULES: Record<string, { reply: string; experiment: CoachExperiment }> = {
  scroll: {
    reply: "Let's try a small experiment. Put your phone face down for the next hour. You don't need to share it.",
    experiment: { title: "Put your phone face down for the next hour", days: 1, why: "Step away from the screen for 60 minutes." },
  },
  read: {
    reply: "Let's try a small experiment. Read five pages every evening for seven days. You don't need to share it with anyone.",
    experiment: { title: "Read five pages every evening", days: 7, why: "Five printed pages build a quiet evening rhythm." },
  },
  friend: {
    reply: "Reach out to one person you haven't spoken to in a while. A short message is enough.",
    experiment: { title: "Reach out to one person you haven't spoken to", days: 1, why: "A short, unhurried message rekindles real connection." },
  },
  lonely: {
    reply: "Try spending ten minutes outside tomorrow, even just sitting. Small steps count.",
    experiment: { title: "Spend ten minutes outside tomorrow", days: 1, why: "Sitting quietly outside anchors you in the physical world." },
  },
  bored: {
    reply: "Pick one thing you've been meaning to make or do. Give it fifteen minutes today.",
    experiment: { title: "Give fifteen minutes to a creative or offline thing", days: 1, why: "A quarter-hour is all it takes to get started." },
  },
  default: {
    reply: "Try one small offline thing today. It doesn't have to be big.",
    experiment: { title: "Try one small offline thing", days: 1, why: "Small offline moments anchor deep calm." },
  },
};

/**
 * Submit a live postcard to the backend API and Supabase
 */
export async function submitPostcard(payload: PostcardPayload): Promise<{
  success: boolean;
  postcard_id?: string;
  postcard?: {
    id: string;
    place: string;
    caption: string;
    img: string;
    date: string;
  };
  message?: string;
  error?: string;
}> {
  try {
    const res = await fetch(`${API_BASE}/postcard/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || 'Failed to submit postcard');
    }
    return data;
  } catch (err: any) {
    console.warn('[API] Backend unreachable or failed, using Supabase direct fallback:', err);

    // Direct fallback if backend service is offline
    try {
      const postcardId = crypto.randomUUID();
      const { data: { user } } = await supabase.auth.getUser();
      const authorId = user?.id || '33333333-3333-3333-3333-333333333301';

      await supabase.from('postcards').insert({
        id: postcardId,
        author_id: authorId,
        place_id: '22222222-2222-2222-2222-222222222201',
        image_path: payload.image_base64,
        caption: payload.caption,
        is_demo: Boolean(payload.demo_mode),
      });

      await supabase.from('stamps').insert({
        user_id: authorId,
        kind: 'place',
        label: payload.place_id,
      });

      return {
        success: true,
        postcard_id: postcardId,
        postcard: {
          id: postcardId,
          place: payload.place_id,
          caption: payload.caption,
          img: payload.image_base64,
          date: 'TODAY',
        },
        message: 'Postcard saved to passport!',
      };
    } catch (dbErr) {
      // Local in-memory fallback
      return {
        success: true,
        postcard_id: crypto.randomUUID(),
        postcard: {
          id: crypto.randomUUID(),
          place: payload.place_id,
          caption: payload.caption,
          img: payload.image_base64,
          date: 'TODAY',
        },
      };
    }
  }
}

/**
 * Message the AI Life Coach (Up to 3 messages per day)
 */
export async function askCoach(message: string): Promise<CoachResponse> {
  let token: string | undefined;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    token = session?.access_token;
  } catch {}

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_BASE}/coach/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'chat', message }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || 'Coach request failed');
    }

    const remaining = typeof data.remaining_today === 'number'
      ? data.remaining_today
      : typeof data.messagesLeftToday === 'number'
      ? data.messagesLeftToday
      : 2;

    return {
      success: true,
      reply: data.reply,
      experiment: data.experiment,
      source: data.source || 'ai',
      remaining_today: remaining,
      messagesLeftToday: remaining,
    };
  } catch (err: any) {
    console.warn('[Coach] Backend call failed, using client rule-based fallback:', err);
    const lower = (message || '').toLowerCase();
    let fallback = FALLBACK_RULES.default;
    for (const key of ['scroll', 'read', 'friend', 'lonely', 'bored']) {
      if (lower.includes(key)) {
        fallback = FALLBACK_RULES[key];
        break;
      }
    }

    return {
      success: true,
      reply: fallback.reply,
      experiment: fallback.experiment,
      source: 'fallback',
      remaining_today: 2,
      messagesLeftToday: 2,
    };
  }
}

/**
 * Get personalized weekly printable letter ("Make my weekly letter" summary action)
 */
export async function getCoachSummary(): Promise<string> {
  let token: string | undefined;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    token = session?.access_token;
  } catch {}

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_BASE}/coach/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'summary' }),
    });
    const data = await res.json();
    if (data.summary) {
      return data.summary;
    }
    throw new Error('No summary returned');
  } catch {
    return (
      `Hereabouts Weekly Letter\n\n` +
      `What you did: You logged offline quests and earned passport stamps.\n` +
      `What you made: Real physical creations and postcards away from screens.\n` +
      `Who you met: Face-to-face connections in physical places.\n\n` +
      `One quiet suggestion for next week:\n` +
      `Take a gentle 15-minute walk without your phone or read five pages of a book before sleep. Small steps count; no pressure at all.`
    );
  }
}

/**
 * Meetup verification via 6-digit code
 */
export async function redeemMeetupCode(code: string): Promise<{ success: boolean; newCap?: number; message?: string }> {
  try {
    const res = await fetch(`${API_BASE}/meetup/token/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    return data;
  } catch {
    // If backend offline, fallback demo verification
    if (code === '482913' || code === '731406' || code === '942103') {
      return { success: true, newCap: 40, message: 'Meetup verified! 20 more messages unlocked.' };
    }
    return { success: false, message: 'Verification failed' };
  }
}

/**
 * Log quest completion to Supabase
 */
export async function logQuestToSupabase(questId: string, reflection: string, minutes: number) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || '33333333-3333-3333-3333-333333333301';

    await supabase.from('quest_logs').insert({
      user_id: userId,
      quest_id: questId,
      reflection,
      minutes,
    });

    await supabase.from('stamps').insert({
      user_id: userId,
      kind: 'quest',
      label: questId,
    });

    return { success: true };
  } catch (err) {
    console.warn('[Quest] Failed to log quest to Supabase:', err);
    return { success: false };
  }
}


/**
 * Log craft to Supabase
 */
export async function logCraftToSupabase(title: string, mediums: string[], notes: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || '33333333-3333-3333-3333-333333333301';

    await supabase.from('creations').insert({
      author_id: userId,
      title,
      medium: mediums[0] || 'craft',
      note: notes,
    });

    await supabase.from('stamps').insert({
      user_id: userId,
      kind: 'craft',
      label: `Craft: ${title}`,
    });
  } catch (err) {
    console.warn('[Craft] Supabase log fallback:', err);
  }
}
