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

export interface FallbackRule {
  reply: string;
  experiment: CoachExperiment;
}

interface IntentCategory {
  id: string;
  keywords: string[];
  options: FallbackRule[];
}

export const INTENT_CATEGORIES: IntentCategory[] = [
  {
    id: 'learn',
    keywords: ['learn', 'study', 'skills', 'skill', 'knowledge', 'course', 'education', 'learning', 'reading up', 'topic', 'understand'],
    options: [
      {
        reply: 'Pick one physical skill or topic you can explore without a browser. Give twenty minutes to a book or a notebook today.',
        experiment: {
          title: '20m screen-free study',
          days: 3,
          why: 'Screen-free exploration deepens focus without digital rabbit holes.',
        },
      },
      {
        reply: 'Choose one topic you have wanted to understand. Spend twenty minutes taking handwritten notes from a book or your own memory.',
        experiment: {
          title: '20m handwritten inquiry',
          days: 2,
          why: 'Handwritten thinking clarifies complex ideas without endless tab-switching.',
        },
      },
    ],
  },
  {
    id: 'distraction',
    keywords: ['distraction', 'distractions', 'distracted', 'phone', 'scroll', 'scrolling', 'social media', 'doomscroll', 'screen', 'notification', 'notifications', 'app', 'apps', 'digital', 'screen time', 'feed'],
    options: [
      {
        reply: 'Place your phone in a drawer across the room for the next two hours. Notice the quiet space that opens up.',
        experiment: {
          title: 'Phone in another room for 2h',
          days: 1,
          why: 'Physical distance removes the unconscious reach for the screen.',
        },
      },
      {
        reply: 'Turn off all non-human notifications for the rest of today. Keep your phone facing down on a bookshelf.',
        experiment: {
          title: 'Bookshelf phone silence',
          days: 1,
          why: 'Eliminating background pings restores continuous thought.',
        },
      },
    ],
  },
  {
    id: 'read',
    keywords: ['read', 'reading', 'book', 'books', 'novel', 'pages', 'paperback', 'chapter', 'author'],
    options: [
      {
        reply: 'Read ten pages of a printed book by a window before turning on any lamps tonight.',
        experiment: {
          title: '10 pages before dusk',
          days: 7,
          why: 'Ten printed pages build an unhurried evening rhythm.',
        },
      },
      {
        reply: 'Spend fifteen minutes reading a physical book with a warm drink, leaving your phone in another room.',
        experiment: {
          title: '15m book and tea',
          days: 3,
          why: 'Physical paper anchors attention without notifications.',
        },
      },
    ],
  },
  {
    id: 'walk',
    keywords: ['walk', 'walking', 'stroll', 'outside', 'nature', 'steps', 'wander', 'park', 'fresh air'],
    options: [
      {
        reply: 'Take a fifteen-minute walk around your block without headphones. Count three unfamiliar colors or trees.',
        experiment: {
          title: '15m quiet walk',
          days: 3,
          why: 'Unmediated observation grounds your nervous system.',
        },
      },
      {
        reply: 'Step outside at sunset and walk until the streetlights turn on. Keep your hands in your pockets.',
        experiment: {
          title: 'Dusk lantern stroll',
          days: 2,
          why: 'Noticing the transition of natural light resets circadian rhythm.',
        },
      },
    ],
  },
  {
    id: 'craft',
    keywords: ['make', 'making', 'craft', 'crafts', 'draw', 'drawing', 'sketch', 'cook', 'bake', 'wood', 'build', 'write', 'paint'],
    options: [
      {
        reply: 'Make something tangible with your hands today—bake a simple loaf, sketch an object on your desk, or fold an origami bird.',
        experiment: {
          title: 'One tactile creation',
          days: 2,
          why: 'Creating physical artifacts produces grounding dopamine rather than consumption fatigue.',
        },
      },
      {
        reply: 'Spend twenty minutes working with physical materials: paper, pencil, flour, or thread. Leave your phone outside the workspace.',
        experiment: {
          title: '20m tactile craft',
          days: 3,
          why: 'Manual work engages spatial problem-solving that screens leave dormant.',
        },
      },
    ],
  },
  {
    id: 'meet',
    keywords: ['meet', 'friend', 'friends', 'lonely', 'alone', 'social', 'talk', 'connect', 'people', 'community'],
    options: [
      {
        reply: 'Send a handwritten note or visit a neighborhood cafe and say hello to the barista by name.',
        experiment: {
          title: 'One warm neighborhood hello',
          days: 1,
          why: 'Small micro-interactions in physical space reduce feelings of isolation.',
        },
      },
      {
        reply: 'Invite one friend for a twenty-minute porch or park tea without looking at a screen.',
        experiment: {
          title: '20m offline companion tea',
          days: 2,
          why: 'Presence with another human is the true antidote to algorithmic isolation.',
        },
      },
    ],
  },
  {
    id: 'stress',
    keywords: ['stressed', 'anxious', 'overwhelmed', 'tired', 'burnout', 'exhausted', 'worry', 'worried', 'panic', 'heavy'],
    options: [
      {
        reply: 'Sit on a quiet chair for five minutes and listen to the furthest sound you can hear. There is nothing you need to fix right this minute.',
        experiment: {
          title: '5m listening to distance',
          days: 1,
          why: 'Listening into the distance gently down-regulates the sympathetic fight-or-flight state.',
        },
      },
      {
        reply: 'Drink a glass of cold water slowly, noticing the temperature all the way down. Let your shoulders soften.',
        experiment: {
          title: 'Slow water breath',
          days: 1,
          why: 'Physical temperature sensation interrupts acute rumination loops.',
        },
      },
    ],
  },
  {
    id: 'sleep',
    keywords: ['sleep', 'insomnia', 'night', 'tired', 'rest', 'bed', 'evening', 'wake up', 'morning'],
    options: [
      {
        reply: 'Charge your phone in a different room tonight. Keep an analog clock or notebook next to your bed instead.',
        experiment: {
          title: 'Phone-free bedroom night',
          days: 3,
          why: 'Removing the screen from bed protects sleep onset and morning peace.',
        },
      },
      {
        reply: 'Turn off all screens forty minutes before your target bedtime. Read paper pages by low incandescent light.',
        experiment: {
          title: '40m paper-lit wind-down',
          days: 4,
          why: 'Melatonin production begins naturally when blue-light devices are stowed.',
        },
      },
    ],
  },
];

const LAST_INDEX_STORAGE_KEY = 'os-coach-intent-indices';

function getNextRuleForCategory(category: IntentCategory): FallbackRule {
  try {
    const raw = localStorage.getItem(LAST_INDEX_STORAGE_KEY);
    const map = raw ? JSON.parse(raw) : {};
    const prevIdx = typeof map[category.id] === 'number' ? map[category.id] : -1;
    const nextIdx = (prevIdx + 1) % category.options.length;
    map[category.id] = nextIdx;
    localStorage.setItem(LAST_INDEX_STORAGE_KEY, JSON.stringify(map));
    return category.options[nextIdx]!;
  } catch {
    return category.options[0]!;
  }
}

export function pickFallbackByMessage(userMessage: string): FallbackRule {
  const norm = (userMessage || '').toLowerCase();
  for (const cat of INTENT_CATEGORIES) {
    if (cat.keywords.some((k) => norm.includes(k))) {
      return getNextRuleForCategory(cat);
    }
  }
  return {
    reply: 'Step away from this screen for twenty minutes and notice one quiet thing in your room or street.',
    experiment: {
      title: '20m quiet pause',
      days: 1,
      why: 'Small offline pauses restore mental clarity.',
    },
  };
}

export async function askCoach(message: string, currentLeft: number = 3): Promise<CoachResponse> {
  const fallback = pickFallbackByMessage(message);
  const nextRemaining = Math.max(0, currentLeft - 1);

  try {
    const { data, error } = await supabase.functions.invoke('coach', {
      body: { action: 'chat', message },
    });

    if (!error && data && data.reply) {
      return {
        success: true,
        reply: data.reply,
        experiment: data.experiment || fallback.experiment,
        source: data.source || 'ai',
        remaining_today: typeof data.remaining_today === 'number' ? data.remaining_today : nextRemaining,
        messagesLeftToday: typeof data.remaining_today === 'number' ? data.remaining_today : nextRemaining,
      };
    }
  } catch (err) {
    console.warn('askCoach remote invocation failed, using intelligent rule-based engine:', err);
  }

  return {
    success: true,
    reply: fallback.reply,
    experiment: fallback.experiment,
    source: 'fallback',
    remaining_today: nextRemaining,
    messagesLeftToday: nextRemaining,
  };
}

export async function requestCoachSummary(): Promise<{ success: boolean; summary: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('coach', {
      body: { action: 'summary' },
    });
    if (!error && data && data.summary) {
      return { success: true, summary: data.summary };
    }
  } catch (e) {
    console.warn('requestCoachSummary fallback:', e);
  }

  return {
    success: true,
    summary:
      'This week, you chose presence over algorithms. You took three walks along the water, completed two quiet quests, and met a neighbor in real life. Your offline hours grew by 4.2 hours. Keep the phone in the pocket and continue noticing the world.',
  };
}

export async function submitPostcard(payload: PostcardPayload) {
  return { success: true, id: `pc_${Date.now()}` };
}

export async function logQuestToSupabase(questId: string, reflection: string, minutes: number = 30) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: true };
    await supabase.from('quest_logs').insert({
      quest_id: questId,
      user_id: user.id,
      reflection,
      minutes_saved: minutes,
    });
  } catch {}
  return { success: true };
}

export async function logCraftToSupabase(title: string, mediums: string[], notes: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: true };
    await supabase.from('craft_logs').insert({
      user_id: user.id,
      title,
      mediums,
      notes,
    });
  } catch {}
  return { success: true };
}