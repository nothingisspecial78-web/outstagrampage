import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders } from "../_shared/cors.ts";

/**
 * AI Life Coach Supabase Edge Function
 * Implements F8 AI Life Coach specification with Provider Fallback Chain & Circuit Breakers
 * Supporting Google Gemini (GEMINI_API_KEY), Anthropic (ANTHROPIC_API_KEY), Groq (GROQ_API_KEY), and OpenRouter.
 */

interface CoachRequest {
  action: "chat" | "summary";
  message?: string;
}

interface Experiment {
  title: string;
  days: number;
  why?: string;
}

interface CoachResponse {
  reply: string;
  experiment?: Experiment;
  source: "ai" | "fallback";
  remaining_today: number;
}

interface FallbackItem {
  reply: string;
  experiment: Experiment;
}

interface IntentCategory {
  id: string;
  keywords: string[];
  options: FallbackItem[];
}

export const INTENT_CATEGORIES: IntentCategory[] = [
  {
    id: "learn",
    keywords: ["learn", "study", "skills", "skill", "knowledge", "course", "education", "learning", "reading up", "topic", "understand"],
    options: [
      {
        reply: "Pick one physical skill or topic you can explore without a browser. Give twenty minutes to a book or a notebook today.",
        experiment: {
          title: "20m screen-free study",
          days: 3,
          why: "Screen-free exploration deepens focus without digital rabbit holes.",
        },
      },
      {
        reply: "Choose one topic you have wanted to understand. Spend twenty minutes taking handwritten notes from a book or your own memory.",
        experiment: {
          title: "20m handwritten inquiry",
          days: 2,
          why: "Handwritten thinking clarifies complex ideas without endless tab-switching.",
        },
      },
    ],
  },
  {
    id: "distraction",
    keywords: ["distraction", "distractions", "distracted", "phone", "scroll", "scrolling", "social media", "doomscroll", "screen", "notification", "notifications", "app", "apps", "digital", "screen time", "feed"],
    options: [
      {
        reply: "Place your phone in a drawer across the room for the next two hours. Notice the quiet space that opens up.",
        experiment: {
          title: "Phone in another room for 2h",
          days: 1,
          why: "Physical distance removes the unconscious reach for the screen.",
        },
      },
      {
        reply: "Turn off all non-human notifications for the rest of today. Keep your phone facing down on a bookshelf.",
        experiment: {
          title: "Bookshelf phone silence",
          days: 1,
          why: "Eliminating background pings restores continuous thought.",
        },
      },
    ],
  },
  {
    id: "read",
    keywords: ["read", "reading", "book", "books", "novel", "pages", "paperback", "chapter", "author"],
    options: [
      {
        reply: "Read ten pages of a printed book by a window before turning on any lamps tonight.",
        experiment: {
          title: "10 pages before dusk",
          days: 7,
          why: "Ten printed pages build an unhurried evening rhythm.",
        },
      },
      {
        reply: "Spend fifteen minutes reading a physical book with a warm drink, leaving your phone in another room.",
        experiment: {
          title: "15m quiet reading with tea",
          days: 5,
          why: "Reading on paper allows your nervous system to settle.",
        },
      },
    ],
  },
  {
    id: "lonely",
    keywords: ["lonely", "alone", "isolated", "isolation", "solitude", "empty", "disconnected", "unconnected", "nobody"],
    options: [
      {
        reply: "Take a gentle fifteen-minute walk through your neighborhood. Make eye contact and nod at one person.",
        experiment: {
          title: "Neighborhood hello walk",
          days: 1,
          why: "A brief human acknowledgment grounds you in the community.",
        },
      },
      {
        reply: "Sit in a quiet local cafe or on a public park bench for twenty minutes without headphones. Just watch the world pass by.",
        experiment: {
          title: "20m quiet presence among people",
          days: 1,
          why: "Sharing physical space softens feelings of separation.",
        },
      },
    ],
  },
  {
    id: "friend",
    keywords: ["friend", "friends", "connect", "connection", "meet", "meeting", "reconnect", "catch up", "talk", "call", "someone", "companion", "neighbor"],
    options: [
      {
        reply: "Send one handwritten postcard or a five-word message to someone you miss. Invite them for tea.",
        experiment: {
          title: "Invite one friend offline",
          days: 3,
          why: "Real connection starts with simple, unhurried overtures.",
        },
      },
      {
        reply: "Plan a brief face-to-face meet with a nearby friend or neighbor this week. Keep it simple—just a walk around the block.",
        experiment: {
          title: "15m neighborhood stroll with a friend",
          days: 3,
          why: "Side-by-side walking sparks unforced conversation.",
        },
      },
    ],
  },
  {
    id: "nature",
    keywords: ["nature", "outside", "walk", "walking", "fresh air", "trees", "tree", "park", "outdoor", "outdoors", "stroll", "sunshine", "sunlight", "sky", "greenery", "neighborhood", "garden", "forest"],
    options: [
      {
        reply: "Step outside without headphones for 15 minutes. Find three distinct natural sounds.",
        experiment: {
          title: "15-minute sound walk",
          days: 1,
          why: "Listening to the wind, birds, and leaves reorients the senses.",
        },
      },
      {
        reply: "Step outside and touch the rough bark of a tree or the stone of an old wall. Take five deep breaths of fresh air.",
        experiment: {
          title: "5-minute sensory tree pause",
          days: 1,
          why: "Physical contact with natural elements grounds wandering thoughts.",
        },
      },
    ],
  },
  {
    id: "anxious",
    keywords: ["anxious", "anxiety", "stress", "stressed", "overwhelmed", "worry", "worried", "panic", "nervous", "racing", "tension", "breathe", "breath", "calm"],
    options: [
      {
        reply: "Sit quietly for five minutes with your feet flat on the floor. Take five slow breaths with your eyes closed.",
        experiment: {
          title: "5-minute grounding pause",
          days: 1,
          why: "Physical stillness gently calms an overstimulated nervous system.",
        },
      },
      {
        reply: "Place both hands on a cup of warm water or tea. Feel the warmth through your palms and breathe gently for three minutes.",
        experiment: {
          title: "3-minute warm cup grounding",
          days: 1,
          why: "Sensory touch interrupts racing thoughts.",
        },
      },
    ],
  },
  {
    id: "bored",
    keywords: ["bored", "boredom", "restless", "nothing to do", "stuck", "uninspired", "aimless", "fidgety", "idle"],
    options: [
      {
        reply: "Find a piece of paper and sketch the view from your nearest window, even roughly.",
        experiment: {
          title: "Window sketch",
          days: 1,
          why: "Translating what you see onto paper turns restlessness into observation.",
        },
      },
      {
        reply: "Take a notebook and list 10 curious details you can see in the room right now that you never noticed before.",
        experiment: {
          title: "10 unnoticed room details",
          days: 1,
          why: "Noticing the familiar with fresh eyes unlocks curiosity.",
        },
      },
    ],
  },
  {
    id: "make",
    keywords: ["make", "making", "craft", "crafting", "create", "creating", "creative", "hands", "handmade", "drawing", "draw", "sketch", "art", "wood", "clay", "origami", "bake", "baking", "cook", "build"],
    options: [
      {
        reply: "Make something tangible with your hands today using materials you already have at home.",
        experiment: {
          title: "Small handmade object",
          days: 2,
          why: "Working with physical materials grounds the mind in tactile reality.",
        },
      },
      {
        reply: "Fold a sheet of paper into an origami crane or write a three-line poem on the back of an old receipt.",
        experiment: {
          title: "Paper craft or tiny poem",
          days: 1,
          why: "Small creative acts spark joy without digital screens.",
        },
      },
    ],
  },
];

export const DEFAULT_CATEGORY: IntentCategory = {
  id: "default",
  keywords: [],
  options: [
    {
      reply: "Step away from your screen for a gentle breath of fresh air. Notice the light and the temperature right outside your door.",
      experiment: { title: "Threshold pause", days: 1, why: "Crossing the doorway resets your mental state." },
    },
    {
      reply: "Pick one tactile object near you—a stone, a wooden spoon, or a pen. Hold it and inspect how it was made.",
      experiment: { title: "Tactile curiosity pause", days: 1, why: "Physical textures ground you firmly in the present moment." },
    },
    {
      reply: "Brew a cup of tea or pour a glass of cold water with your full attention. Drink it without checking anything.",
      experiment: { title: "Unplugged drink ritual", days: 1, why: "Single-tasking a simple routine invites quiet clarity." },
    },
    {
      reply: "Take three slow, deep breaths with your eyes turned away from all screens. Give yourself permission to pause.",
      experiment: { title: "Three conscious breaths", days: 1, why: "A deliberate pause reminds your body that it is safe to slow down." },
    },
  ],
};

const recentHistory: string[] = [];

export function getRuleBasedFallback(message: string): FallbackItem {
  const normalized = (message || "").toLowerCase();

  // Dynamic intent scoring
  let bestCategory: IntentCategory | null = null;
  let highestScore = 0;

  for (const cat of INTENT_CATEGORIES) {
    let score = 0;
    for (const kw of cat.keywords) {
      if (normalized.includes(kw)) {
        score += kw.length;
      }
    }
    if (score > highestScore) {
      highestScore = score;
      bestCategory = cat;
    }
  }

  const selectedCategory = highestScore > 0 && bestCategory ? bestCategory : DEFAULT_CATEGORY;

  // Rotation: pick an option from pool that wasn't recently returned
  let chosenOption = selectedCategory.options[0];
  for (const opt of selectedCategory.options) {
    if (!recentHistory.includes(opt.experiment.title)) {
      chosenOption = opt;
      break;
    }
  }

  // If all options in this category have been used, pick the least recently used
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

  // Record rotation history
  recentHistory.push(chosenOption.experiment.title);
  if (recentHistory.length > 10) {
    recentHistory.shift();
  }

  return chosenOption;
}

/**
 * Circuit Breaker Pattern adapted from Universal AI Assistant Kit
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
  gemini: new CircuitBreaker("gemini", 3, 60000),
  anthropic: new CircuitBreaker("anthropic", 3, 60000),
  groq: new CircuitBreaker("groq", 3, 60000),
  openrouter: new CircuitBreaker("openrouter", 3, 60000),
};

/**
 * Multi-Provider Sequential Failover Chain with 8-second Timeout
 * Supports: Google Gemini (GEMINI_API_KEY), Anthropic (ANTHROPIC_API_KEY), Groq (GROQ_API_KEY), OpenRouter
 */
async function callAIWithFailover(
  systemPrompt: string,
  userMessage: string,
  timeoutMs = 8000
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const activeProvider = (Deno.env.get("COPILOT_AI_PROVIDER") || Deno.env.get("COACH_PROVIDER") || "gemini").toLowerCase();
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    const groqKey = Deno.env.get("GROQ_API_KEY");
    const openRouterKey = Deno.env.get("OPENROUTER_API_KEY");

    type ProviderFn = () => Promise<string | null>;
    const providerList: Array<{ name: keyof typeof breakers; hasKey: boolean; run: ProviderFn }> = [
      {
        name: "gemini",
        hasKey: Boolean(geminiKey),
        run: async () => {
          const model = Deno.env.get("GEMINI_MODEL") || "gemini-1.5-flash";
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
          let res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              system_instruction: { parts: [{ text: systemPrompt }] },
              contents: [{ parts: [{ text: userMessage }] }],
              generationConfig: { maxOutputTokens: 300, temperature: 0.6 },
            }),
            signal: controller.signal,
          });

          if (!res.ok && res.status === 404 && model !== "gemini-1.5-flash") {
            const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
            res = await fetch(fallbackUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                system_instruction: { parts: [{ text: systemPrompt }] },
                contents: [{ parts: [{ text: userMessage }] }],
                generationConfig: { maxOutputTokens: 300, temperature: 0.6 },
              }),
              signal: controller.signal,
            });
          }

          if (res.ok) {
            const data = await res.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text && text.trim()) return text.trim();
          }
          throw new Error(`Gemini returned ${res.status}`);
        },
      },
      {
        name: "anthropic",
        hasKey: Boolean(anthropicKey),
        run: async () => {
          const model = Deno.env.get("COACH_MODEL") || "claude-haiku-5-5";
          const res = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "x-api-key": anthropicKey!,
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
            if (text && text.trim()) return text.trim();
          }
          throw new Error(`Anthropic returned ${res.status}`);
        },
      },
      {
        name: "groq",
        hasKey: Boolean(groqKey),
        run: async () => {
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
            if (text && text.trim()) return text.trim();
          }
          throw new Error(`Groq returned ${res.status}`);
        },
      },
      {
        name: "openrouter",
        hasKey: Boolean(openRouterKey),
        run: async () => {
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
            if (text && text.trim()) return text.trim();
          }
          throw new Error(`OpenRouter returned ${res.status}`);
        },
      },
    ];

    // Prioritize active provider to front
    const prioritized = [...providerList].sort((a, b) => {
      if (a.name === activeProvider && a.hasKey) return -1;
      if (b.name === activeProvider && b.hasKey) return 1;
      return 0;
    });

    for (const p of prioritized) {
      const breaker = breakers[p.name];
      if (!p.hasKey || !breaker.canAttempt()) continue;

      try {
        const text = await p.run();
        if (text) {
          breaker.recordSuccess();
          return text;
        }
        breaker.recordFailure("Empty reply returned");
      } catch (err: any) {
        breaker.recordFailure(err.message);
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
  let days = 1;
  const numMatch = text.match(/(\d+)\s+days?/i);
  if (numMatch && numMatch[1]) {
    days = Math.min(7, Math.max(1, parseInt(numMatch[1], 10)));
  }

  const sentences = text.split(/(?<=[.!?])\s+/);
  let title = "Small offline experiment";
  for (const s of sentences) {
    if (/experiment|try|leave|put|walk|read|reach|step|sit|sketch|make|fold|pick/i.test(s)) {
      title = s.replace(/^.*?(try|let's try|put|leave|read|take|reach|spend|sketch|make|fold|pick)/i, "$1").trim();
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