import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { CoachMessageSchema } from '../utils/validator.js';
import { CoachService } from '../services/coach.service.js';
import { config } from '../config.js';

export const coachRouter = Router();

const supabase =
  config.supabase.url && (config.supabase.serviceRoleKey || config.supabase.anonKey)
    ? createClient(config.supabase.url, config.supabase.serviceRoleKey || config.supabase.anonKey)
    : null;

// In-memory fallback usage counter if Supabase is offline
const userDailyMessageCount: Record<string, number> = {};

coachRouter.post('/chat', async (req: Request, res: Response) => {
  try {
    const parseResult = CoachMessageSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'validation_error', details: parseResult.error.flatten() });
    }

    const { action, message = '' } = parseResult.data;

    // Resolve user ID from auth token or fallback header
    let userId = (req.headers['x-user-id'] as string) || '33333333-3333-3333-3333-333333333301';
    const authHeader = req.headers.authorization;
    if (authHeader && supabase) {
      const token = authHeader.replace('Bearer ', '');
      try {
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) {
          userId = user.id;
        }
      } catch {
        // Fallback to default user
      }
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const today = new Date().toISOString().split('T')[0];

    // Build context
    let daysDoneLast7 = 0;
    let stampsLast7 = 0;
    let meetupsLast7 = 0;
    let creationsLast7 = 0;
    let userMsgsToday = userDailyMessageCount[userId] || 0;

    if (supabase) {
      try {
        const [questRes, stampsRes, meetupsRes, creationsRes, msgsRes] = await Promise.all([
          supabase.from('quest_logs').select('id', { count: 'exact' }).eq('user_id', userId).gte('created_at', sevenDaysAgo),
          supabase.from('stamps').select('id', { count: 'exact' }).eq('user_id', userId).gte('created_at', sevenDaysAgo),
          supabase.from('meetups').select('id', { count: 'exact' }).gte('met_at', sevenDaysAgo),
          supabase.from('postcards').select('id', { count: 'exact' }).eq('author_id', userId).gte('taken_at', sevenDaysAgo),
          supabase.from('coach_messages').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('role', 'user').gte('created_at', `${today}T00:00:00.000Z`),
        ]);

        daysDoneLast7 = questRes.count || 0;
        stampsLast7 = stampsRes.count || 0;
        meetupsLast7 = meetupsRes.count || 0;
        creationsLast7 = creationsRes.count || 0;
        if (typeof msgsRes.count === 'number') {
          userMsgsToday = msgsRes.count;
        }
      } catch (err) {
        console.warn('[Coach] Supabase stats query fallback:', err);
      }
    }

    const habitContext = {
      daysDoneLast7,
      stampsLast7,
      meetupsLast7,
      creationsLast7,
    };

    // ACTION: SUMMARY
    if (action === 'summary') {
      const weekStart = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const summaryText = CoachService.generateWeeklySummary('Friend', habitContext, weekStart);

      if (supabase) {
        try {
          await supabase.from('coach_summaries').upsert(
            {
              user_id: userId,
              week_start: weekStart,
              summary: summaryText,
            },
            { onConflict: 'user_id,week_start' }
          );
        } catch (err) {
          console.warn('[Coach] Supabase summary upsert error:', err);
        }
      }

      return res.status(200).json({
        success: true,
        summary: summaryText,
        stats: habitContext,
      });
    }

    // ACTION: CHAT
    const trimmed = (message || '').trim();
    if (!trimmed || trimmed.length > 500) {
      return res.status(400).json({
        error: 'invalid_message',
        message: 'Message must be between 1 and 500 characters.',
      });
    }

    if (userMsgsToday >= 3) {
      return res.status(429).json({
        error: 'daily_limit_reached',
        message: 'You have used your 3 coach check-ins for today. Come back tomorrow.',
        remaining_today: 0,
      });
    }

    // Persist user message if supabase connected
    if (supabase) {
      try {
        await supabase.from('coach_messages').insert({
          user_id: userId,
          role: 'user',
          content: trimmed,
          source: 'ai',
        });
      } catch (e) {
        console.warn('[Coach] Persist user message error:', e);
      }
    }

    const response = await CoachService.processMessage(trimmed, userMsgsToday, habitContext);
    userDailyMessageCount[userId] = userMsgsToday + 1;

    // Persist assistant reply if supabase connected
    if (supabase) {
      try {
        await supabase.from('coach_messages').insert({
          user_id: userId,
          role: 'assistant',
          content: response.reply,
          source: response.source,
        });
      } catch (e) {
        console.warn('[Coach] Persist assistant reply error:', e);
      }
    }

    return res.status(200).json({
      success: true,
      ...response,
    });
  } catch (err: any) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({ error: err.error || 'server_error', message: err.message });
  }
});
