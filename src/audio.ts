import type { Preferences } from './storage';
export class Sound {
  private ctx?: AudioContext; private master?: GainNode; private drone?: OscillatorNode; private droneGain?: GainNode; private beat = -1;
  constructor(private settings: Preferences) {}
  async unlock() {
    try { this.ctx ??= new AudioContext(); if (!this.master) { this.master = this.ctx.createGain(); this.master.connect(this.ctx.destination); } this.update(this.settings); await this.ctx.resume(); } catch { /* All game feedback also has a visual cue. */ }
  }
  update(settings: Preferences) { this.settings = settings; if (this.ctx && this.master) this.master.gain.setTargetAtTime(settings.muted ? 0 : settings.volume * .28, this.ctx.currentTime, .03); }
  private tone(f: number, seconds: number, delay = 0, end = f, type: OscillatorType = 'triangle', strength = .3) {
    if (!this.ctx || !this.master || this.settings.muted || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime + delay, osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(f, now); osc.frequency.exponentialRampToValueAtTime(Math.max(20, end), now + seconds);
    gain.gain.setValueAtTime(.001, now); gain.gain.exponentialRampToValueAtTime(strength, now + .01); gain.gain.exponentialRampToValueAtTime(.001, now + seconds);
    osc.connect(gain); gain.connect(this.master); osc.start(now); osc.stop(now + seconds + .03); osc.onended = () => { osc.disconnect(); gain.disconnect(); };
  }
  charge(p: number, time: number) {
    if (!this.ctx || !this.master || this.ctx.state !== 'running') return;
    if (!this.drone) { this.drone = this.ctx.createOscillator(); this.droneGain = this.ctx.createGain(); this.drone.type = 'sine'; this.drone.connect(this.droneGain); this.droneGain.connect(this.master); this.droneGain.gain.value = .12; this.drone.start(); }
    this.drone.frequency.setTargetAtTime(65 + Math.pow(p, 3) * 500, this.ctx.currentTime, .03);
    const beat = Math.floor(time * (2 + p * 7)); if (beat !== this.beat) { this.beat = beat; this.tone(140 + p * 240, .08, 0, 70, 'sine', .5); }
  }
  stopCharge() { this.beat = -1; if (this.drone && this.ctx && this.droneGain) { const drone = this.drone, gain = this.droneGain; gain.gain.setTargetAtTime(.001, this.ctx.currentTime, .01); drone.stop(this.ctx.currentTime + .05); drone.onended = () => { drone.disconnect(); gain.disconnect(); }; this.drone = undefined; this.droneGain = undefined; } }
  launch(perfect: boolean) { this.stopCharge(); this.tone(100, .6, 0, perfect ? 1700 : 950, 'sawtooth', .28); if (perfect) [523, 659, 784, 1047].forEach((f, i) => this.tone(f, .25, i * .07)); }
  ring(count: number) { const notes = [523, 659, 784, 1047, 1318, 1568]; this.tone(notes[(count - 1) % 6], .25, 0, notes[(count - 1) % 6], 'triangle', .45); }
  rupture() { this.stopCharge(); this.tone(220, .65, 0, 35, 'sawtooth', .35); this.tone(60, .3, .3, 42, 'sine'); }
}
