export const SHOT = { width: 420, height: 680, launchY: 530, gravity: 260, radius: 25, maxFlight: 8, maxActors: 150 } as const;
export type Mode = 'idle' | 'charging' | 'flight' | 'rupture' | 'result';
export interface Ring { id: number; x: number; y: number; phase: number; hit: boolean }
export interface ShotResult { score: number; height: number; rings: number; pressure: number; perfect: boolean; busted: boolean; title: string; comment: string }
export type ShotEvent = { kind: 'launch' | 'rupture' | 'ring' | 'end'; x: number; y: number };
const clamp = (x: number, low: number, high: number) => Math.max(low, Math.min(high, x));
/** Pure simulation. One press, one release, one immutable result. */
export class Shot {
  mode: Mode = 'idle'; time = 0; held = 0; flightTime = 0; ruptureTime = 0;
  pressure = 0; launchPressure = 0; aim = 0; x = 210; y: number = SHOT.launchY; vx = 0; vy = 0;
  altitude = 0; ringsHit = 0; perfect = false; rings: Ring[] = []; result?: ShotResult;
  readonly limit: number;
  private events: ShotEvent[] = [];
  constructor(random: () => number = Math.random) {
    this.limit = 3.2 + random() * 1.2;
    this.rings = Array.from({ length: 12 }, (_, id) => ({ id, x: 210, y: 390 - id * 145, phase: random() * Math.PI * 2, hit: false }));
    this.moveRings();
  }
  press() { if (this.mode !== 'idle') return false; this.mode = 'charging'; return true; }
  aimAt(offset: number) { if (this.mode === 'charging') this.aim = clamp(offset / 135, -1, 1); }
  release() {
    if (this.mode !== 'charging') return false;
    this.launchPressure = this.pressure; this.perfect = this.pressure >= 0.92;
    this.mode = 'flight'; this.x = 210; this.y = SHOT.launchY;
    const power = 110 + 950 * Math.pow(this.pressure, 1.4);
    this.vx = this.aim * power * 0.43; this.vy = -power * (this.perfect ? 1.08 : 1);
    this.events.push({ kind: 'launch', x: this.x, y: this.y }); return true;
  }
  cancel() { if (this.mode !== 'charging') return; this.mode = 'idle'; this.held = 0; this.pressure = 0; this.aim = 0; }
  get finished() { return this.mode === 'result'; }
  drain() { const events = this.events; this.events = []; return events; }
  advance(dt: number) {
    if (!Number.isFinite(dt) || dt <= 0 || this.mode === 'result') return;
    let remaining = Math.min(dt, 20);
    while (remaining > 0.000001 && !this.finished) {
      const step = Math.min(remaining, 1 / 120); this.step(step); remaining -= step;
    }
  }
  private moveRings() { for (const ring of this.rings) ring.x = 210 + Math.sin(this.time * (0.6 + ring.id * 0.015) + ring.phase) * (ring.id % 3 === 0 ? 55 : 115); }
  private step(dt: number) {
    this.time += dt; this.moveRings();
    if (this.mode === 'charging') {
      this.held += dt; this.pressure = clamp(Math.pow(this.held / this.limit, 1.3), 0, 1);
      if (this.held >= this.limit) { this.mode = 'rupture'; this.launchPressure = 1; this.events.push({ kind: 'rupture', x: 210, y: SHOT.launchY }); }
    } else if (this.mode === 'rupture') {
      this.ruptureTime += dt; if (this.ruptureTime >= 1.6) this.end(true);
    } else if (this.mode === 'flight') {
      this.flightTime += dt; this.vy += SHOT.gravity * dt; this.x += this.vx * dt; this.y += this.vy * dt;
      if (this.x < 30) { this.x = 30; this.vx = Math.abs(this.vx) * 0.93; }
      if (this.x > 390) { this.x = 390; this.vx = -Math.abs(this.vx) * 0.93; }
      this.altitude = Math.max(this.altitude, SHOT.launchY - this.y);
      for (const ring of this.rings) {
        if (!ring.hit && Math.hypot(this.x - ring.x, this.y - ring.y) < 54) {
          ring.hit = true; this.ringsHit++; this.vy -= 72;
          this.events.push({ kind: 'ring', x: ring.x, y: ring.y });
        }
      }
      if ((this.y >= SHOT.launchY && this.flightTime > 0.2) || this.flightTime >= SHOT.maxFlight) this.end(false);
    }
  }
  private end(busted: boolean) {
    this.mode = 'result';
    const height = Math.round(this.altitude * 0.8), score = busted ? 0 : Math.round(height * (1 + this.ringsHit * 0.32) * (this.perfect ? 1.5 : 1));
    let title: string, comment: string;
    if (busted) { title = 'オウオ、決壊。'; comment = 'ためすぎた。川が先にカーニバルした。'; }
    else if (this.launchPressure < 0.2) { title = 'ぴょ。'; comment = 'オウオ「いまの、準備運動ですよね？」'; }
    else if (this.perfect && this.ringsHit >= 5) { title = '宇宙がオウオ。'; comment = '地球を出たら、そこもカーニバルだった。'; }
    else if (this.perfect) { title = '限界突破オウオ。'; comment = 'その指、カーニバルの才能がある。'; }
    else if (this.launchPressure >= 0.7) { title = '成層圏カーニバル。'; comment = 'オウオが空の交通ルールを変えた。'; }
    else { title = '空飛ぶぬめり。'; comment = 'あと少し粘れば、宇宙だった。'; }
    this.result = Object.freeze({ score, height, rings: this.ringsHit, pressure: this.launchPressure, perfect: this.perfect, busted, title, comment });
    this.events.push({ kind: 'end', x: this.x, y: this.y });
  }
}
