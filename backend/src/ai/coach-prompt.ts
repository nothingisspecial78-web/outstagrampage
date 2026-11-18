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
          title: '15m quiet reading with tea',
          days: 5,
          why: 'Reading on paper allows your nervous system to settle.',
        },
      },
    ],
  },
  {
    id: 'lonely',
    keywords: ['lonely', 'alone', 'isolated', 'isolation', 'solitude', 'empty', 'disconnected', 'unconnected', 'nobody'],
    options: [
      {
        reply: 'Take a gentle fifteen-minute walk through your neighborhood. Make eye contact and nod at one person.',
        experiment: {
          title: 'Neighborhood hello walk',
          days: 1,
          why: 'A brief human acknowledgment grounds you in the community.',
        },
      },
      {
        reply: 'Sit in a quiet local cafe or on a public park bench for twenty minutes without headphones. Just watch the world pass by.',
        experiment: {
          title: '20m quiet presence among people',
          days: 1,
          why: 'Sharing physical space softens feelings of separation.',
        },
      },
    ],
  },
  {
    id: 'friend',
    keywords: ['friend', 'friends', 'connect', 'connection', 'meet', 'meeting', 'reconnect', 'catch up', 'talk', 'call', 'someone', 'companion', 'neighbor'],
    options: [
      {
        reply: 'Send one handwritten postcard or a five-word message to someone you miss. Invite them for tea.',
        experiment: {
          title: 'Invite one friend offline',
          days: 3,
          why: 'Real connection starts with simple, unhurried overtures.',
        },
      },
      {
        reply: 'Plan a brief face-to-face meet with a nearby friend or neighbor this week. Keep it simple—just a walk around the block.',
        experiment: {
          title: '15m neighborhood stroll with a friend',
          days: 3,
          why: 'Side-by-side walking sparks unforced conversation.',
        },
      },
    ],
  },
  {
    id: 'nature',
    keywords: ['nature', 'outside', 'walk', 'walking', 'fresh air', 'trees', 'tree', 'park', 'outdoor', 'outdoors', 'stroll', 'sunshine', 'sunlight', 'sky', 'greenery', 'neighborhood', 'garden', 'forest'],
    options: [
      {
        reply: 'Step outside without headphones for 15 minutes. Find three distinct natural sounds.',
        experiment: {
          title: '15-minute sound walk',
          days: 1,
          why: 'Listening to the wind, birds, and leaves reorients the senses.',
        },
      },
      {
        reply: 'Step outside and touch the rough bark of a tree or the stone of an old wall. Take five deep breaths of fresh air.',
        experiment: {
          title: '5-minute sensory tree pause',
          days: 1,
          why: 'Physical contact with natural elements grounds wandering thoughts.',
        },
      },
    ],
  },
  {
    id: 'anxious',
    keywords: ['anxious', 'anxiety', 'stress', 'stressed', 'overwhelmed', 'worry', 'worried', 'panic', 'nervous', 'racing', 'tension', 'breathe', 'breath', 'calm'],
    options: [
      {
        reply: 'Sit quietly for five minutes with your feet flat on the floor. Take five slow breaths with your eyes closed.',
        experiment: {
          title: '5-minute grounding pause',
          days: 1,
          why: 'Physical stillness gently calms an overstimulated nervous system.',
        },
      },
      {
        reply: 'Place both hands on a cup of warm water or tea. Feel the warmth through your palms and breathe gently for three minutes.',
        experiment: {
          title: '3-minute warm cup grounding',
          days: 1,
          why: 'Sensory touch interrupts racing thoughts.',
        },
      },
    ],
  },
  {
    id: 'bored',
    keywords: ['bored', 'boredom', 'restless', 'nothing to do', 'stuck', 'uninspired', 'aimless', 'fidgety', 'idle'],
    options: [
      {
        reply: 'Find a piece of paper and sketch the view from your nearest window, even roughly.',
        experiment: {
          title: 'Window sketch',
          days: 1,
          why: 'Translating what you see onto paper turns restlessness into observation.',
        },
      },
      {
        reply: 'Take a notebook and list 10 curious details you can see in the room right now that you never noticed before.',
        experiment: {
          title: '10 unnoticed room details',
          days: 1,
          why: 'Noticing the familiar with fresh eyes unlocks curiosity.',
        },
      },
    ],
  },
  {
    id: 'make',
    keywords: ['make', 'making', 'craft', 'crafting', 'create', 'creating', 'creative', 'hands', 'handmade', 'drawing', 'draw', 'sketch', 'art', 'wood', 'clay', 'origami', 'bake', 'baking', 'cook', 'build'],
    options: [
      {
        reply: 'Make something tangible with your hands today using materials you already have at home.',
        experiment: {
          title: 'Small handmade object',
          days: 2,
          why: 'Working with physical materials grounds the mind in tactile reality.',
        },
      },
      {
        reply: 'Fold a sheet of paper into an origami crane or write a three-line poem on the back of an old receipt.',
        experiment: {
          title: 'Paper craft or tiny poem',
          days: 1,
          why: 'Small creative acts spark joy without digital screens.',
        },
      },
    ],
  },
];

export const DEFAULT_CATEGORY: IntentCategory = {
  id: 'default',
  keywords: [],
  options: [
    {
      reply: 'Step away from your screen for a gentle breath of fresh air. Notice the light and the temperature right outside your door.',
      experiment: { title: 'Threshold pause', days: 1, why: 'Crossing the doorway resets your mental state.' },
    },
    {
      reply: 'Pick one tactile object near you—a stone, a wooden spoon, or a pen. Hold it and inspect how it was made.',
      experiment: { title: 'Tactile curiosity pause', days: 1, why: 'Physical textures ground you firmly in the present moment.' },
    },
    {
      reply: 'Brew a cup of tea or pour a glass of cold water with your full attention. Drink it without checking anything.',
      experiment: { title: 'Unplugged drink ritual', days: 1, why: 'Single-tasking a simple routine invites quiet clarity.' },
    },
    {
      reply: 'Take three slow, deep breaths with your eyes turned away from all screens. Give yourself permission to pause.',
      experiment: { title: 'Three conscious breaths', days: 1, why: 'A deliberate pause reminds your body that it is safe to slow down.' },
    },
  ],
};

// Export FALLBACK_RULES for backward compatibility
export const FALLBACK_RULES: Record<string, FallbackRule> = {
  learn: INTENT_CATEGORIES.find((c) => c.id === 'learn')!.options[0],
  distraction: INTENT_CATEGORIES.find((c) => c.id === 'distraction')!.options[0],
  scroll: INTENT_CATEGORIES.find((c) => c.id === 'distraction')!.options[0],
  read: INTENT_CATEGORIES.find((c) => c.id === 'read')!.options[0],
  lonely: INTENT_CATEGORIES.find((c) => c.id === 'lonely')!.options[0],
  friend: INTENT_CATEGORIES.find((c) => c.id === 'friend')!.options[0],
  nature: INTENT_CATEGORIES.find((c) => c.id === 'nature')!.options[0],
  anxious: INTENT_CATEGORIES.find((c) => c.id === 'anxious')!.options[0],
  bored: INTENT_CATEGORIES.find((c) => c.id === 'bored')!.options[0],
  make: INTENT_CATEGORIES.find((c) => c.id === 'make')!.options[0],
  default: DEFAULT_CATEGORY.options[0],
};

// Memory rotation tracker
const recentHistory: string[] = [];

export function getRuleBasedFallback(message: string): FallbackRule {
  const normalized = (message || '').toLowerCase();

  // Dynamic intent scoring
  let bestCategory: IntentCategory | null = null;
  let highestScore = 0;

  for (const cat of INTENT_CATEGORIES) {
    let score = 0;
    for (const kw of cat.keywords) {
      if (normalized.includes(kw)) {
        // Longer keyword matches receive higher relevance weights
        score += kw.length;
      }
    }
    if (score > highestScore) {
      highestScore = score;
      bestCategory = cat;
    }
  }

  const selectedCategory = highestScore > 0 && bestCategory ? bestCategory : DEFAULT_CATEGORY;

  // Rotation: select option whose experiment title was not recently used
  let chosenOption = selectedCategory.options[0];
  for (const opt of selectedCategory.options) {
    if (!recentHistory.includes(opt.experiment.title)) {
      chosenOption = opt;
      break;
    }
  }

  // If all options in this category have been used recently, pick the least recently used
  if (recentHistory.includes(chosenOption.experiment.title) && selectedCategory.options.length > 1) {
    let oldestIndex = -1;
    let minHistoryPos = Infinity;
    for (let i = 0; i < selectedCategory.options.length; i++) {
      const pos = recentHistory.indexOf(selectedCategory.options[i].experiment.title);
      if (pos < minHistoryPos) {
        minHistoryPos = pos;
        oldestIndex = i;
      }
    }
    if (oldestIndex !== -1) {
      chosenOption = selectedCategory.options[oldestIndex];
    }
  }

  // Record rotation history (retain up to 10 entries)
  recentHistory.push(chosenOption.experiment.title);
  if (recentHistory.length > 10) {
    recentHistory.shift();
  }

  return chosenOption;
}

export function extractExperimentFromText(text: string): Experiment {
  let days = 1;
  const numMatch = text.match(/(\d+)\s+days?/i);
  if (numMatch && numMatch[1]) {
    days = Math.min(7, Math.max(1, parseInt(numMatch[1], 10)));
  }

  const sentences = text.split(/(?<=[.!?])\s+/);
  let title = 'Small offline experiment';
  for (const s of sentences) {
    if (/experiment|try|leave|put|walk|read|reach|step|sit|sketch|make|fold|pick/i.test(s)) {
      title = s.replace(/^.*?(try|let's try|put|leave|read|take|reach|spend|sketch|make|fold|pick)/i, '$1').trim();
      if (title.length > 50) {
        title = title.slice(0, 47) + '…';
      }
      break;
    }
  }

  return { title, days };
}
