import { IAIProvider, AICompletionOptions } from './ai-provider.interface.js';
import { config } from '../config.js';

export class GeminiProvider implements IAIProvider {
  readonly providerId = 'gemini';
  readonly name = 'Google Gemini (Flash)';
  private apiKey: string;
  private model: string;

  constructor() {
    this.apiKey = config.ai.gemini.apiKey;
    this.model = config.ai.gemini.model;
  }

  async checkHealth(): Promise<{ online: boolean; message: string; activeModel: string }> {
    if (!this.apiKey) {
      return { online: false, message: 'GEMINI_API_KEY is not set', activeModel: this.model };
    }
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.model}?key=${this.apiKey}`
      );
      return {
        online: res.ok,
        message: res.ok ? 'Gemini API is ready' : `Gemini returned ${res.status}`,
        activeModel: this.model,
      };
    } catch (err: any) {
      return { online: false, message: err.message, activeModel: this.model };
    }
  }

  async generateCompletion(options: AICompletionOptions): Promise<string> {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is required');
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeoutMs || 8000);

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
      let res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: options.systemPrompt }] },
          contents: [{ parts: [{ text: options.userMessage }] }],
          generationConfig: { maxOutputTokens: 300, temperature: 0.6 },
        }),
        signal: controller.signal,
      });

      // Fallback if model returned 404 (e.g. invalid model string)
      if (!res.ok && res.status === 404 && this.model !== 'gemini-1.5-flash') {
        const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;
        res = await fetch(fallbackUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: options.systemPrompt }] },
            contents: [{ parts: [{ text: options.userMessage }] }],
            generationConfig: { maxOutputTokens: 300, temperature: 0.6 },
          }),
          signal: controller.signal,
        });
      }

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Gemini API error (${res.status}): ${errorText}`);
      }

      const data = await res.json() as any;
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) {
        throw new Error('Gemini returned empty response');
      }

      return content.trim();
    } finally {
      clearTimeout(timer);
    }
  }
}
