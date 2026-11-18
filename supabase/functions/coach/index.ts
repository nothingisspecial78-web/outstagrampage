import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders } from "../_shared/cors.ts";

/**
 * AI Life Coach Supabase Edge Function
 * Implements F8 AI Life Coach specification with Provider Fallback Chain & Circuit Breakers
 * adapted from Universal AI Assistant Kit.
 */

interface CoachRequest {
  action: "chat" | "summary";
  message?: string;
}

interface Experiment {
  title: string;
  days: number;
}

interface CoachResponse {
  reply: string;
  experiment?: Experiment;
  source: "ai" | "fallback";
  remaining_today: number;
}

// Exact rule-based fallback specifications
interface FallbackItem {
  reply: string;
  experiment: Experiment;
}

const FALLBACK_RULES: Record<string, FallbackItem> = {
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

export function getRuleBasedFallback(message: string): FallbackItem {
  const lower = (message || "").toLowerCase();
  for (const key of ["scroll", "read", "friend", "lonely", "bored"]) {
    if (lower.includes(key)) {
      return FALLBACK_RULES[key];
    }
  }
  return FALLBACK_RULES.default;
}

/**
 * Circuit Breaker Pattern adapted from Universal AI Assistant Kit
 * (ai-assistant-kit/core/providers/providerChain.ts)
 */
export class CircuitBreaker {
  public readonly name: string;
  private readonly threshold: number;
  private readonly cooldownMs: number;
  private state: "closed" | "open" | "half_open" = "closed";
  private failureCount = 0;
  private lastFailureTime = 0;

  constructor(name: string, threshold = 3, cooldownMs = 60000) {
    this.name = name;
    this.threshold = threshold;
    this.cooldownMs = cooldownMs;
  }

  canAttempt(): boolean {
    const now = Date.now();
    if (this.state === "open") {
      if (now - this.lastFailureTime >= this.cooldownMs) {
        this.state = "half_open";
        return true;
      }
      return false;
    }
    return true;
  }

  recordSuccess(): void {
    this.failureCount = 0;
    this.state = "closed";
  }

  recordFailure(reason?: string): void {
    this.failureCount += 1;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.threshold) {
      this.state = "open";
      console.warn(`[CircuitBreaker] OPEN for provider "${this.name}": ${reason || "repeated failures"}`);
    }
  }
}

// Global in-memory circuit breakers across function invocations
const breakers = {
  anthropic: new CircuitBreaker("anthropic", 3, 60000),
  groq: new CircuitBreaker("groq", 3, 60000),
  gemini: new CircuitBreaker("gemini", 3, 60000),
  openrouter: new CircuitBreaker("openrouter", 3, 60000),
};

/**
 * Multi-Provider Sequential Failover Chain with 8-second Timeout
 * Order: Anthropic (Primary: claude-haiku-5-5 / COACH_MODEL) -> Groq -> Gemini -> OpenRouter
 */
async function callAIWithFailover(
  systemPrompt: string,
  userMessage: string,
  timeoutMs = 8000
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    const groqKey = Deno.env.get("GROQ_API_KEY");
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    const openRouterKey = Deno.env.get("OPENROUTER_API_KEY");

    // 1. PRIMARY: Anthropic Claude (claude-haiku-5-5 or COACH_MODEL)
    if (anthropicKey && breakers.anthropic.canAttempt()) {
      try {
        const model = Deno.env.get("COACH_MODEL") || "claude-haiku-5-5";
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": anthropicKey,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            max_tokens: 300,
            system: systemPrompt,
            messages: [{ role: "user", content: userMessage }],
          }),
          signal: controller.signal,
        });

        if (res.ok) {
          const data = await res.json();
          const text = data.content?.[0]?.text;
          if (text && text.trim()) {
            breakers.anthropic.recordSuccess();
            return text.trim();
          }
        }
        breakers.anthropic.recordFailure(`HTTP ${res.status}`);
      } catch (err: any) {
        breakers.anthropic.recordFailure(err.message);
        if (controller.signal.aborted) throw err;
      }
    }

    // 2. FALLBACK 1: Groq
    if (groqKey && breakers.groq.canAttempt()) {
      try {
        const model = Deno.env.get("GROQ_MODEL") || "llama-3.3-70b-versatile";
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${groqKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userMessage },
            ],
            max_tokens: 300,
            temperature: 0.6,
          }),
          signal: controller.signal,
        });

        if (res.ok) {
          const data = await res.json();
          const text = data.choices?.[0]?.message?.content;
          if (text && text.trim()) {
            breakers.groq.recordSuccess();
            return text.trim();
          }
        }
        breakers.groq.recordFailure(`HTTP ${res.status}`);
      } catch (err: any) {
        breakers.groq.recordFailure(err.message);
        if (controller.signal.aborted) throw err;
      }
    }

    // 3. FALLBACK 2: Google Gemini
    if (geminiKey && breakers.gemini.canAttempt()) {
      try {
        const model = Deno.env.get("GEMINI_MODEL") || "gemini-2.5-flash";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: [{ parts: [{ text: userMessage }] }],
            generationConfig: { maxOutputTokens: 300, temperature: 0.6 },
          }),
          signal: controller.signal,
        });

        if (res.ok) {
          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text && text.trim()) {
            breakers.gemini.recordSuccess();
            return text.trim();
          }
        }
        breakers.gemini.recordFailure(`HTTP ${res.status}`);
      } catch (err: any) {
        breakers.gemini.recordFailure(err.message);
        if (controller.signal.aborted) throw err;
      }
    }

    // 4. FALLBACK 3: OpenRouter
    if (openRouterKey && breakers.openrouter.canAttempt()) {
      try {
        const model = Deno.env.get("OPENROUTER_MODEL") || "meta-llama/llama-3.3-70b-instruct:free";
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openRouterKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userMessage },
            ],
            max_tokens: 300,
          }),
          signal: controller.signal,
        });

        if (res.ok) {
          const data = await res.json();
          const text = data.choices?.[0]?.message?.content;
          if (text && text.trim()) {
            breakers.openrouter.recordSuccess();
            return text.trim();
          }
        }
        breakers.openrouter.recordFailure(`HTTP ${res.status}`);
      } catch (err: any) {
        breakers.openrouter.recordFailure(err.message);
        if (controller.signal.aborted) throw err;
      }
    }

    throw new Error("No AI provider responded successfully within timeout.");
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Extracts a structured experiment card from AI response
 */
function extractExperimentFromText(text: string): Experiment {
  // Look for day patterns like "for 7 days", "next 5 days", "3 days"
  const dayMatch = text.match(/(?:for\s+(?:the\s+next\s+)?|(\d+)\s+days?)/i);
  let days = 1;
  const numMatch = text.match(/(\d+)\s+days?/i);
  if (numMatch && numMatch[1]) {
    days = Math.min(7, Math.max(1, parseInt(numMatch[1], 10)));
  }

  // Extract experiment title from the text (sentence containing experiment/try/walk/read/put)
  const sentences = text.split(/(?<=[.!?])\s+/);
  let title = "Small offline experiment";
  for (const s of sentences) {
    if (/experiment|try|leave|put|walk|read|reach|step|sit/i.test(s)) {
      title = s.replace(/^.*?(try|let's try|put|leave|read|take|reach|spend)/i, "$1").trim();
      if (title.length > 50) {
        title = title.slice(0, 47) + "…";
      }
      break;
    }
  }

  return { title, days };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Validation 1: Valid Supabase JWT Bearer token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "unauthorized", message: "Bearer token required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "unauthorized", message: "Invalid JWT token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload: CoachRequest = await req.json();
    const { action = "chat", message = "" } = payload;

    // Build Server-side Context for User (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const today = new Date().toISOString().split("T")[0];

    const [questRes, stampsRes, meetupsRes, creationsRes] = await Promise.all([
      supabase.from("quest_logs").select("id", { count: "exact" }).eq("user_id", user.id).gte("created_at", sevenDaysAgo),
      supabase.from("stamps").select("id", { count: "exact" }).eq("user_id", user.id).gte("created_at", sevenDaysAgo),
      supabase.from("meetups").select("id", { count: "exact" }).gte("met_at", sevenDaysAgo),
      supabase.from("postcards").select("id", { count: "exact" }).eq("author_id", user.id).gte("taken_at", sevenDaysAgo),
    ]);

    const daysDoneLast7 = questRes.count || 0;
    const stampsLast7 = stampsRes.count || 0;
    const meetupsLast7 = meetupsRes.count || 0;
    const creationsLast7 = creationsRes.count || 0;

    // Handle ACTION = "summary"
    // Builds a private weekly note from quest_logs, stamps, postcards and meetups and saves it to coach_summaries
    if (action === "summary") {
      const weekStart = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      const suggestion = daysDoneLast7 <= 3
        ? "Take a gentle 5-minute walk without your phone or read two pages of a book before sleep. Small steps count; no pressure at all."
        : "Choose one afternoon to leave your phone at home and explore a street you have not walked before.";

      const summaryText =
        `Hereabouts Weekly Letter\nWeek of ${weekStart}\n\n` +
        `What you did: You logged ${daysDoneLast7} offline quests and earned ${stampsLast7} passport stamps.\n` +
        `What you made: You created ${creationsLast7} physical postcards capturing real-world moments.\n` +
        `Who you met: You completed ${meetupsLast7} in-person meetups with companions.\n\n` +
        `One quiet suggestion for next week:\n${suggestion}`;

      // Unique per user per week: upsert to coach_summaries
      await supabase.from("coach_summaries").upsert({
        user_id: user.id,
        week_start: weekStart,
        summary: summaryText,
      }, { onConflict: "user_id,week_start" });

      return new Response(
        JSON.stringify({
          success: true,
          summary: summaryText,
          stats: {
            days_done_last_7: daysDoneLast7,
            stamps_last_7: stampsLast7,
            meetups_last_7: meetupsLast7,
            creations_last_7: creationsLast7,
          },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Handle ACTION = "chat"
    // Validation 3: Message between 1 and 500 characters
    const trimmed = (message || "").trim();
    if (trimmed.length < 1 || trimmed.length > 500) {
      return new Response(
        JSON.stringify({
          error: "invalid_message",
          message: "Message must be between 1 and 500 characters.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validation 2: Max 3 user messages per day
    const { count: userMsgsToday } = await supabase
      .from("coach_messages")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("role", "user")
      .gte("created_at", `${today}T00:00:00.000Z`);

    const currentCount = userMsgsToday || 0;
    if (currentCount >= 3) {
      return new Response(
        JSON.stringify({
          error: "daily_limit_reached",
          message: "You have used your 3 coach check-ins for today. Come back tomorrow.",
          remaining_today: 0,
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Construct COACH SYSTEM PROMPT (Server-side only)
    let systemPrompt = `You are the Hereabouts Life Coach, a calm, kind guide. Rules:
- Reply in 3 sentences or fewer.
- Propose ONE small offline experiment lasting up to 7 days.
- Never recommend content to consume (no videos, accounts, apps, shows, feeds).
- Never shame the user. If they missed days, make the goal smaller.
- Do not ask more than one question.
- If the user seems in distress, be gentle and suggest talking to someone they trust.
- Stay private: never suggest posting or sharing the experiment.
- The goal is to make the coach less needed over time (end replies by encouraging the user to do the experiment without the app); never send or suggest engagement-style reminders.
- You have no access to phone screen time data. State this plainly if asked.

Context: In the last 7 days, the user completed ${daysDoneLast7} quests, earned ${stampsLast7} stamps, logged ${meetupsLast7} meetups, and made ${creationsLast7} creations.`;

    if (daysDoneLast7 <= 3) {
      systemPrompt += ` The user completed few days. Make the experiment smaller than usual and never scold.`;
    }

    // Persist user message to coach_messages
    await supabase.from("coach_messages").insert({
      user_id: user.id,
      role: "user",
      content: trimmed,
      source: "ai",
    });

    let replyText = "";
    let experiment: Experiment | undefined;
    let source: "ai" | "fallback" = "ai";

    try {
      replyText = await callAIWithFailover(systemPrompt, trimmed, 8000);
      experiment = extractExperimentFromText(replyText);
    } catch (aiErr) {
      console.warn("[Coach] AI call failed or timed out. Triggering rule-based fallback:", aiErr);
      const fallback = getRuleBasedFallback(trimmed);
      replyText = fallback.reply;
      experiment = fallback.experiment;
      source = "fallback";
    }

    // Persist assistant message to coach_messages
    await supabase.from("coach_messages").insert({
      user_id: user.id,
      role: "assistant",
      content: replyText,
      source,
    });

    const remainingToday = Math.max(0, 3 - currentCount - 1);

    const responsePayload: CoachResponse = {
      reply: replyText,
      experiment,
      source,
      remaining_today: remainingToday,
    };

    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[Coach] Server error:", err);
    return new Response(
      JSON.stringify({ error: "server_error", message: err.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
