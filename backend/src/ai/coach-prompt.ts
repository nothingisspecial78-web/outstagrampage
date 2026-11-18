export interface UserHabitContext {
  daysDoneLast7: number;
  stampsLast7: number;
  meetupsLast7: number;
  creationsLast7?: number;
}

export interface Experiment {
  title: string;
  days: number;
  why?: string;
}

export interface FallbackRule {
  reply: string;
  experiment: Experiment;
}

interface IntentCategory {
  id: string;
  keywords: string[];
  options: FallbackRule[];
}

export function buildCoachSystemPrompt(context: UserHabitContext): string {
  let prompt = `You are the Hereabouts Life Coach, a calm, kind guide. Rules:
- Reply in 3 sentences or fewer.
- Propose ONE small offline experiment lasting up to 7 days.
- Never recommend content to consume (no videos, accounts, apps, shows, feeds).
- Never shame the user. If they missed days, make the goal smaller.
- Do not ask more than one question.
- If the user seems in distress, be gentle and suggest talking to someone they trust.
- Stay private: never suggest posting or sharing the experiment.
- The goal is to make the coach less needed over time (end replies by encouraging the user to do the experiment without the app); never send or suggest engagement-style reminders.
- You have no access to phone screen time data. State this plainly if asked.

Context: In the last 7 days, the user completed ${context.daysDoneLast7} quests, earned ${context.stampsLast7} stamps, logged ${context.meetupsLast7} meetups, and made ${context.creationsLast7 ?? 0} creations.`;

  if (context.daysDoneLast7 <= 3) {
    prompt += ` The user completed few days. Make the experiment smaller than usual and never scold.`;
  }

  return prompt;
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

const intentMemory: Record<string, number> = {};

export function pickFallbackRule(userMessage?: string): FallbackRule {
  const norm = (userMessage || '').toLowerCase();

  for (const cat of INTENT_CATEGORIES) {
    if (cat.keywords.some((k) => norm.includes(k))) {
      const prevIdx = intentMemory[cat.id] ?? -1;
      const nextIdx = (prevIdx + 1) % cat.options.length;
      intentMemory[cat.id] = nextIdx;
      return cat.options[nextIdx]!;
    }
  }

  return {
    reply: 'Try one small offline thing today. It does not have to be big.',
    experiment: {
      title: 'Try one small offline thing',
      days: 1,
      why: 'Small offline moments anchor deep calm.',
    },
  };
}

export function extractExperiment(reply: string): Experiment | undefined {
  const dayMatch = reply.match(/(\d+)\s*days?/i);
  const days = dayMatch ? parseInt(dayMatch[1], 10) : 3;

  const sentences = reply.split(/(?<=[.?!])\s+/).filter(Boolean);
  const actionSentence = sentences.find((s) =>
    /(try|spend|walk|read|bake|write|meet|place|listen|step|charge|put)/i.test(s)
  );

  if (actionSentence) {
    const title = actionSentence
      .replace(/^(please\s+|try\s+to\s+|maybe\s+|i\s+suggest\s+)/i, '')
      .slice(0, 40)
      .trim();
    return { title: title || 'One small offline experiment', days: Math.min(Math.max(days, 1), 7) };
  }

  return undefined;
}