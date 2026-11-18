import { executeWithFallback } from '../ai/provider-factory.js';
import {
  buildCoachSystemPrompt,
  getRuleBasedFallback,
  extractExperimentFromText,
  UserHabitContext,
} from '../ai/coach-prompt.js';
import { CoachResponse } from '../types.js';

export class CoachService {
  /**
   * Processes a user chat message to the AI coach.
   */
  static async processMessage(
    userMessage: string,
    userMessagesTodayCount: number,
    habitContext: UserHabitContext
  ): Promise<CoachResponse> {
    // 1. Quota check: max 3 messages per day
    if (userMessagesTodayCount >= 3) {
      throw {
        statusCode: 429,
        error: 'daily_limit_reached',
        message: 'You have reached your 3 coach check-ins for today. Come back tomorrow.',
      };
    }

    const systemPrompt = buildCoachSystemPrompt(habitContext);

    try {
      const { reply } = await executeWithFallback({
        systemPrompt,
        userMessage,
        timeoutMs: 8000,
      });

      const experiment = extractExperimentFromText(reply);

      return {
        reply,
        source: 'ai',
        experiment,
        remaining_today: Math.max(0, 3 - userMessagesTodayCount - 1),
      };
    } catch (err: any) {
      console.warn('AI call failed or timed out. Engaging rule-based fallback:', err.message);
      const fallback = getRuleBasedFallback(userMessage);

      return {
        reply: fallback.reply,
        source: 'fallback',
        experiment: fallback.experiment,
        remaining_today: Math.max(0, 3 - userMessagesTodayCount - 1),
      };
    }
  }

  /**
   * Generates a quiet weekly offline habit letter.
   * Covers what you did, what you made, who you met, and one suggestion for next week.
   */
  static generateWeeklySummary(
    userName: string,
    habitContext: UserHabitContext,
    weekStartDate: string
  ): string {
    const suggestion = habitContext.daysDoneLast7 <= 3
      ? "Take a gentle 5-minute walk without your phone or read two pages of a book before sleep. Small steps count; no pressure at all."
      : "Choose one afternoon to leave your phone at home and explore a street you have not walked before.";

    return (
      `Hereabouts Weekly Letter\n` +
      `Week of ${weekStartDate}\n\n` +
      `Dear ${userName},\n\n` +
      `This week you walked, noticed, and stepped away from screens. Here is what your week looked like:\n` +
      `• Quests completed: ${habitContext.daysDoneLast7} offline daily challenges.\n` +
      `• Passport stamps earned: ${habitContext.stampsLast7} real moments collected.\n` +
      `• Postcards made: ${habitContext.creationsLast7 ?? 0} physical moments documented.\n` +
      `• In-person meetups: ${habitContext.meetupsLast7} face-to-face connections.\n\n` +
      `One quiet suggestion for next week:\n` +
      `${suggestion}\n\n` +
      `Nothing to track, nothing to share. Just notice how it feels.\n\n` +
      `Gently,\nYour Hereabouts Coach`
    );
  }
}
