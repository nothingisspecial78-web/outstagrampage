/**
 * Circuit Breaker adapted from Universal AI Assistant Kit
 * (ai-assistant-kit/core/providers/providerChain.ts)
 */
export class CircuitBreaker {
  public readonly name: string;
  private readonly threshold: number;
  private readonly cooldownMs: number;
  private state: 'closed' | 'open' | 'half_open' = 'closed';
  private failureCount = 0;
  private lastFailureTime = 0;

  constructor(name: string, threshold = 3, cooldownMs = 60000) {
    this.name = name;
    this.threshold = threshold;
    this.cooldownMs = cooldownMs;
  }

  canAttempt(): boolean {
    const now = Date.now();
    if (this.state === 'open') {
      if (now - this.lastFailureTime >= this.cooldownMs) {
        this.state = 'half_open';
        return true;
      }
      return false;
    }
    return true;
  }

  recordSuccess(): void {
    this.failureCount = 0;
    this.state = 'closed';
  }

  recordFailure(reason?: string): void {
    this.failureCount += 1;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.threshold) {
      this.state = 'open';
      console.warn(
        `[CircuitBreaker] Provider ${this.name} circuit OPEN for ${this.cooldownMs / 1000}s. Reason: ${reason || 'error'}`
      );
    }
  }

  getStatus(): { state: 'closed' | 'open' | 'half_open'; failureCount: number; lastFailureTime: number } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
    };
  }
}
