import { CONFIG } from './config';
import type { EventKind } from './config';
export interface Bucket { id: number; x: number; y: number; speed: number; rotation: number }
export type Signal =
  | { kind: 'hit'; x: number; y: number; points: number; combo: number }
  | { kind: 'miss'; x: number; y: number }
  | { kind: 'generation'; years: number }
  | { kind: 'event'; event: EventKind }
  | { kind: 'finish' };
export interface Result { score: number; bestCombo: number; caught: number; missed: number; panic: number }
export class Game {
  elapsed = 0; score = 0; combo = 0; bestCombo = 0; caught = 0; missed = 0;
  years = 0; buckets: Bucket[] = []; done = false;
  private nextSpawn = 0.25; private nextEvent: number = CONFIG.events.first;
  private id = 0; private lane = -1; private generation = 0;
  private uncle = false; private fever = false;
  private signals: Signal[] = [];
  constructor(private random: () => number = Math.random) {}
  get multiplier() { return Math.min(CONFIG.maxMultiplier, 1 + Math.floor(this.combo / 5) * 0.5); }
  get panic() { return Math.min(999, this.missed * 17 + (this.missed ? this.years * 2 : 0)); }
  get stage() { return this.missed === 0 ? 0 : Math.min(4, 1 + Math.floor(this.panic / 100)); }
  get remaining() { return Math.max(0, CONFIG.duration - this.elapsed); }
  get result(): Result { return { score: this.score, bestCombo: this.bestCombo, caught: this.caught, missed: this.missed, panic: this.panic }; }
  drain(): Signal[] { const signals = this.signals; this.signals = []; return signals; }
  /** Substeps preserve collision and spawning order even after a slow frame. */
  advance(dt: number) {
    if (!Number.isFinite(dt) || dt <= 0 || this.done) return;
    let left = Math.min(dt, CONFIG.duration - this.elapsed);
    while (left > 0.000001) { const step = Math.min(left, 1 / 60); this.step(step); left -= step; }
  }
  private step(dt: number) {
    this.elapsed = Math.min(CONFIG.duration, this.elapsed + dt);
    const phase = [...CONFIG.phases].reverse().find(p => this.elapsed >= p.from)!;
    if (this.elapsed >= this.nextSpawn && this.elapsed < CONFIG.lastSpawn) {
      this.spawn(Math.min(phase.travel, CONFIG.duration - this.elapsed - .04));
      const barrage = this.elapsed >= CONFIG.events.uncleAt && this.elapsed < CONFIG.events.uncleAt + 1.15;
      this.nextSpawn = this.elapsed + (barrage ? .21 : phase.interval);
    }
    const survivors: Bucket[] = [];
    for (const bucket of this.buckets) {
      bucket.y += bucket.speed * dt;
      if (bucket.y >= CONFIG.riverY) {
        this.missed++; this.combo = 0;
        this.signals.push({ kind: 'miss', x: bucket.x, y: CONFIG.riverY });
      } else survivors.push(bucket);
    }
    this.buckets = survivors;
    if (this.generation < CONFIG.generationTimes.length && this.elapsed >= CONFIG.generationTimes[this.generation]) {
      this.generation++;
      if (this.missed > 0) { this.years += 20; this.signals.push({ kind: 'generation', years: this.years }); }
    }
    if (!this.uncle && this.elapsed >= CONFIG.events.uncleAt) {
      this.uncle = true; this.signals.push({ kind: 'event', event: 'uncle' });
      // Increased phase cadence supplies a fair, sequential barrage.
    }
    if (!this.fever && this.elapsed >= CONFIG.events.feverAt) {
      this.fever = true; this.signals.push({ kind: 'event', event: 'fever' });
    }
    if (this.elapsed >= this.nextEvent) {
      this.nextEvent += CONFIG.events.interval;
      if (Math.abs(this.elapsed - CONFIG.events.uncleAt) > 2 && this.elapsed < 23 && this.random() < CONFIG.events.chance) {
        const events: EventKind[] = ['tour', 'giant', 'researcher'];
        this.signals.push({ kind: 'event', event: events[Math.floor(this.random() * events.length)] });
      }
    }
    if (this.elapsed >= CONFIG.duration - 0.000001) {
      this.elapsed = CONFIG.duration; this.done = true; this.signals.push({ kind: 'finish' });
    }
  }
  private spawn(travel: number) {
    let lane = Math.floor(this.random() * 5);
    if (lane === this.lane) lane = (lane + 2) % 5;
    this.lane = lane;
    this.buckets.push({ id: this.id++, x: 45 + lane * 82, y: -30, speed: (CONFIG.riverY + 30) / travel, rotation: (this.random() - 0.5) * 0.3 });
  }
  hit(x: number, y: number): boolean {
    if (this.done) return false;
    const radius = CONFIG.bucketRadius + CONFIG.hitPadding;
    const index = this.buckets.findIndex(b => b.y >= 0 && Math.hypot(b.x - x, b.y - y) <= radius);
    if (index < 0) return false;
    const [bucket] = this.buckets.splice(index, 1);
    this.combo++; this.caught++; this.bestCombo = Math.max(this.combo, this.bestCombo);
    const points = Math.round(CONFIG.baseScore * this.multiplier);
    this.score += points;
    this.signals.push({ kind: 'hit', x: bucket.x, y: bucket.y, points, combo: this.combo });
    return true;
  }
}
export function resultText(result: Result, random = Math.random) {
  const pick = (items: string[]) => items[Math.floor(random() * items.length)];
  if (result.caught === 0) return { title: pick(['川底のカーニバル長官', 'ぬめり見習い']), comment: 'バケツを見ろ。オウオを見るな。' };
  if (result.missed === 0) return { title: pick(['伝説のオウオ使い', 'バケツの天敵']), comment: '川の平和、お前が守った。オウ！' };
  if (result.panic >= 300) return { title: pick(['川底のカーニバル長官', 'オウオ界の支配者']), comment: pick(['お前の川、オウオで見えねえよ。', '研究員が全員帰りました。']) };
  return { title: pick(result.bestCombo >= 10 ? ['バケツの天敵', '伝説のオウオ使い'] : ['ぬめり見習い', '川底のカーニバル長官']), comment: pick(['川より先にお前がパニックだ。', 'オウオだけは楽しそう。']) };
}
