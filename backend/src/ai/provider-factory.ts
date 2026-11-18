import { IAIProvider, AICompletionOptions } from './ai-provider.interface.js';
import { GroqProvider } from './groq-provider.js';
import { GeminiProvider } from './gemini-provider.js';
import { OpenRouterProvider } from './openrouter-provider.js';
import { AnthropicProvider } from './anthropic-provider.js';
import { CircuitBreaker } from './circuit-breaker.js';
import { config } from '../config.js';

const breakers = {
  anthropic: new CircuitBreaker('anthropic', 3, 60000),
  groq: new CircuitBreaker('groq', 3, 60000),
  gemini: new CircuitBreaker('gemini', 3, 60000),
  openrouter: new CircuitBreaker('openrouter', 3, 60000),
};

export function getAIProvider(explicitProvider?: string): IAIProvider {
  const chosen = (explicitProvider || config.ai.activeProvider).toLowerCase();

  switch (chosen) {
    case 'anthropic':
    case 'claude':
      return new AnthropicProvider();
    case 'groq':
      return new GroqProvider();
    case 'gemini':
      return new GeminiProvider();
    case 'openrouter':
      return new OpenRouterProvider();
    default:
      // Default priority order: Anthropic (Primary) -> Groq -> Gemini -> OpenRouter
      if (config.ai.anthropic.apiKey) return new AnthropicProvider();
      if (config.ai.groq.apiKey) return new GroqProvider();
      if (config.ai.gemini.apiKey) return new GeminiProvider();
      if (config.ai.openrouter.apiKey) return new OpenRouterProvider();
      return new AnthropicProvider();
  }
}

/**
 * Sequential Provider Fallback Runner adapted from Universal AI Assistant Kit
 * Order: Anthropic (Primary) -> Groq -> Gemini -> OpenRouter
 */
export async function executeWithFallback(
  options: AICompletionOptions
): Promise<{ reply: string; provider: string }> {
  const providers: Array<{ name: keyof typeof breakers; getProvider: () => IAIProvider; hasKey: boolean }> = [
    {
      name: 'anthropic',
      getProvider: () => new AnthropicProvider(),
      hasKey: Boolean(config.ai.anthropic.apiKey),
    },
    {
      name: 'groq',
      getProvider: () => new GroqProvider(),
      hasKey: Boolean(config.ai.groq.apiKey),
    },
    {
      name: 'gemini',
      getProvider: () => new GeminiProvider(),
      hasKey: Boolean(config.ai.gemini.apiKey),
    },
    {
      name: 'openrouter',
      getProvider: () => new OpenRouterProvider(),
      hasKey: Boolean(config.ai.openrouter.apiKey),
    },
  ];

  let lastError: any = null;

  for (const { name, getProvider, hasKey } of providers) {
    const breaker = breakers[name];
    if (!hasKey || !breaker.canAttempt()) {
      continue;
    }

    try {
      const provider = getProvider();
      const reply = await provider.generateCompletion({
        ...options,
        timeoutMs: options.timeoutMs || 8000,
      });

      if (reply && reply.trim()) {
        breaker.recordSuccess();
        return { reply: reply.trim(), provider: name };
      }
      breaker.recordFailure('Empty reply returned');
    } catch (err: any) {
      breaker.recordFailure(err.message);
      lastError = err;
      console.warn(`[ProviderFallback] Provider ${name} failed:`, err.message);
    }
  }

  throw lastError || new Error('No AI provider available or all circuits open.');
}
