import type { Preferences } from '../storage';
/** Replace cue() with recorded originals later; no animal vocalization is implied. */
export class Sound {
  private context?: AudioContext; private master?: GainNode; private beat = -1;
  constructor(private settings: Preferences) {}
  async unlock() {
    try {
      this.context ??= new AudioContext();
      if (!this.master) { this.master = this.context.createGain(); this.master.connect(this.context.destination); }
      this.update(this.settings); await this.context.resume();
    } catch { /* Browsers without audio still get the complete visual game. */ }
  }
  update(settings: Preferences) { this.settings = settings; if (this.context && this.master) this.master.gain.setTargetAtTime(settings.muted ? 0 : settings.volume * 0.3, this.context.currentTime, 0.04); }
  private tone(frequency: number, length: number, type: OscillatorType = 'sine', delay = 0, strength = 0.3, end?: number) {
    if (!this.context || !this.master || this.context.state !== 'running' || this.settings.muted) return;
    const start = this.context.currentTime + delay, oscillator = this.context.createOscillator(), gain = this.context.createGain();
    oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, start);
    if (end) oscillator.frequency.exponentialRampToValueAtTime(end, start + length);
    gain.gain.setValueAtTime(0.001, start); gain.gain.exponentialRampToValueAtTime(strength, start + 0.015); gain.gain.exponentialRampToValueAtTime(0.001, start + length);
    oscillator.connect(gain); gain.connect(this.master); oscillator.start(start); oscillator.stop(start + length + 0.03);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }
  private voice(pitch: number, delay: number, duration: number) {
    if (!this.context || !this.master || this.settings.muted || this.context.state !== 'running') return;
    const ctx = this.context, now = ctx.currentTime + delay, osc = ctx.createOscillator(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
    osc.type = 'sawtooth'; osc.frequency.setValueAtTime(pitch, now); osc.frequency.exponentialRampToValueAtTime(pitch * .78, now + duration);
    filter.type = 'lowpass'; filter.Q.value = 3; filter.frequency.setValueAtTime(1100, now); filter.frequency.exponentialRampToValueAtTime(370, now + duration);
    gain.gain.setValueAtTime(.001, now); gain.gain.exponentialRampToValueAtTime(.25, now + .015); gain.gain.exponentialRampToValueAtTime(.001, now + duration);
    osc.connect(filter); filter.connect(gain); gain.connect(this.master); osc.start(now); osc.stop(now + duration + .03); osc.onended = () => { osc.disconnect(); filter.disconnect(); gain.disconnect(); };
  }
  cue(combo: number) {
    const notes = combo >= 20 ? [523, 659, 784, 1047] : combo >= 10 ? [392, 523, 659] : combo >= 5 ? [392, 523] : [330 + combo * 12];
    const syllables = combo >= 20 ? 4 : combo >= 5 ? 3 : combo > 1 ? 2 : 1;
    for (let i = 0; i < syllables; i++) this.voice(185 + combo * 2 + i * 18, i * .065, .1);
    notes.forEach((note, i) => this.tone(note, 0.13, 'triangle', i * 0.065, 0.45, note * 0.8));
  }
  miss() { this.tone(180, 0.2, 'sine', 0, 0.4, 65); }
  finish() { [523, 659, 784, 1047].forEach((note, i) => this.tone(note, 0.4, 'triangle', i * 0.1)); }
  reset() { this.beat = -1; }
  tick(time: number, combo: number) {
    const beat = Math.floor(time * (time >= 24 ? 4 : 3));
    if (beat === this.beat) return; this.beat = beat;
    const scale = [196, 247, 294, 247, 220, 262, 330, 294];
    this.tone(scale[beat % 8], 0.12, 'triangle', 0, 0.18);
    if (beat % 2 === 0) this.tone(90, 0.12, 'sine', 0, 0.4, 35);
    if (combo >= 5 || time >= 17) this.tone(scale[beat % 8] * 2, 0.07, 'sine', 0.1, 0.14);
    if (combo >= 10 || time >= 24) this.tone(1100, 0.025, 'triangle', 0.16, 0.1);
  }
}
