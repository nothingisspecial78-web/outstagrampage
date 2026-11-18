export interface UserHabitContext {
  daysDoneLast7: number;
  stampsLast7: number;
  meetupsLast7: number;
  creationsLast7?: number;
}

export interface Experiment {
  title: string;
  days: number;
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

export interface FallbackRule {
  reply: string;
  experiment: Experiment;
}

export const FALLBACK_RULES: Record<string, FallbackRule> = {
  scroll: {
    reply: "Let's try a small experiment. Put your phone face down for the next hour. You don't need to share it.",
    experiment: { title: "Put your phone face down for the next hour", days: 1 },
  },
  read: {
    reply: "Let's try a small experiment. Read five pages every evening for seven days. You don't need to share it with anyone.",
    experiment: { title: "Read five pages every evening", days: 7 },
  },
  friend: {
    reply: "Reach out to one person you haven't spoken to in a while. A short message is enough.",
    experiment: { title: "Reach out to one person you haven't spoken to", days: 1 },
  },
  lonely: {
    reply: "Try spending ten minutes outside tomorrow, even just sitting. Small steps count.",
    experiment: { title: "Spend ten minutes outside tomorrow", days: 1 },
  },
  bored: {
    reply: "Pick one thing you've been meaning to make or do. Give it fifteen minutes today.",
    experiment: { title: "Give fifteen minutes to a creative or offline thing", days: 1 },
  },
  default: {
    reply: "Try one small offline thing today. It doesn't have to be big.",
    experiment: { title: "Try one small offline thing", days: 1 },
  },
};

export function getRuleBasedFallback(message: string): FallbackRule {
  const lower = (message || '').toLowerCase();
  for (const key of ['scroll', 'read', 'friend', 'lonely', 'bored']) {
    if (lower.includes(key)) {
      return FALLBACK_RULES[key];
    }
  }
  return FALLBACK_RULES.default;
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
    if (/experiment|try|leave|put|walk|read|reach|step|sit/i.test(s)) {
      title = s.replace(/^.*?(try|let's try|put|leave|read|take|reach|spend)/i, '$1').trim();
      if (title.length > 50) {
        title = title.slice(0, 47) + '…';
      }
      break;
    }
  }

  return { title, days };
}
