// Sound chimes and calling tones synthesized with Web Audio API (zero external assets)

class SoundFX {
  private ctx: AudioContext | null = null;
  private ringOsc1: OscillatorNode | null = null;
  private ringOsc2: OscillatorNode | null = null;
  private ringGain: GainNode | null = null;
  private ringTimer: any = null;

  private initCtx() {
    if (!this.ctx || this.ctx.state === "suspended") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    return this.ctx;
  }

  // Play a soft harmonious chime for incoming calls (melody: C5, E5, G5, C6)
  startIncomingRingtone() {
    this.stopRingtone();
    const ctx = this.initCtx();
    if (!ctx) return;

    const playChimeSequence = () => {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.14);

        gain.gain.setValueAtTime(0, now + idx * 0.14);
        gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.14 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.14 + 0.55);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.14);
        osc.stop(now + idx * 0.14 + 0.6);
      });
    };

    playChimeSequence();
    this.ringTimer = setInterval(playChimeSequence, 2400);
  }

  // Dual tone calling sound (US standard ringback: 440Hz + 480Hz)
  startOutgoingRingback() {
    this.stopRingtone();
    const ctx = this.initCtx();
    if (!ctx) return;

    const pulseRing = () => {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.frequency.value = 440;
      osc2.frequency.value = 480;

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.05, now + 0.05);
      gain.gain.setValueAtTime(0.05, now + 1.6);
      gain.gain.linearRampToValueAtTime(0, now + 1.8);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.8);
      osc2.stop(now + 1.8);
    };

    pulseRing();
    this.ringTimer = setInterval(pulseRing, 4000);
  }

  stopRingtone() {
    if (this.ringTimer) {
      clearInterval(this.ringTimer);
      this.ringTimer = null;
    }
    if (this.ringGain && this.ctx) {
      try {
        this.ringGain.gain.setValueAtTime(0, this.ctx.currentTime);
      } catch {}
    }
  }

  // Connected confirmation ping
  playConnectedTone() {
    this.stopRingtone();
    const ctx = this.initCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    [587.33, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.1, now + i * 0.1 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.1 + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.4);
    });
  }

  // Call ended short descending note
  playEndedTone() {
    this.stopRingtone();
    const ctx = this.initCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    [520, 390].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.08, now + i * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.35);
    });
  }
}

export const sound = new SoundFX();
