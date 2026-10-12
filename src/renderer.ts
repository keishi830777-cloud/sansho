import { CONFIG } from './config';
import type { EventKind } from './config';
import { Game, type Signal } from './game';
import { INK, ellipse, ouo, bucket } from './art';
interface Creature { x: number; y: number; vx: number; vy: number; size: number; phase: number; color: string }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; color: string; text?: string }
const colors = ['#77876b', '#9aa47a', '#ada47c', '#627c66', '#a5ad85'];
export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private creatures: Creature[] = []; private particles: Particle[] = [];
  private event?: EventKind; private eventUntil = 0; private clock = 0; private shake = 0;
  constructor(readonly canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!; this.resize(); this.reset();
  }
  resize() { const dpr = Math.min(devicePixelRatio || 1, 2); this.canvas.width = CONFIG.width * dpr; this.canvas.height = CONFIG.height * dpr; }
  reset() { this.creatures = []; this.particles = []; this.event = undefined; this.shake = 0; for (let i = 0; i < 7; i++) this.addCreature(); }
  private addCreature() {
    if (this.creatures.length >= CONFIG.maxCreatures) return;
    this.creatures.push({ x: 25 + Math.random() * 350, y: 478 + Math.random() * 120, vx: (Math.random() - 0.5) * 15, vy: (Math.random() - 0.5) * 8, size: 0.62 + Math.random() * 0.42, phase: Math.random() * 6.28, color: colors[Math.floor(Math.random() * colors.length)] });
  }
  signal(signal: Signal, reduced: boolean) {
    if (signal.kind === 'event') { this.event = signal.event; this.eventUntil = this.clock + CONFIG.events.duration; }
    if (signal.kind === 'generation') for (let i = 0; i < 10; i++) this.addCreature();
    if (signal.kind === 'miss') { for (let i = 0; i < 3; i++) this.addCreature(); this.burst(signal.x, signal.y, '#93e2c9', 12); if (!reduced) this.shake = 0.2; }
    if (signal.kind === 'hit') {
      this.burst(signal.x, signal.y, signal.combo >= 5 ? '#ffcc53' : '#fcf4d9', signal.combo >= 5 ? 17 : 9);
      this.particles.push({ x: signal.x, y: signal.y, vx: 0, vy: -35, life: 0.75, color: INK, text: `+${signal.points}` });
    }
    if (signal.kind === 'finish') { this.burst(210, 160, '#ffcc53', 50); this.burst(210, 360, '#f28d83', 40); }
    if (this.particles.length > CONFIG.maxParticles) this.particles.splice(0, this.particles.length - CONFIG.maxParticles);
  }
  private burst(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) this.particles.push({ x, y, vx: (Math.random() - 0.5) * 200, vy: -60 - Math.random() * 160, life: 0.5 + Math.random() * 0.6, color });
  }
  draw(dt: number, game: Game | undefined, reduced: boolean, title = false) {
    this.clock += dt; this.shake = Math.max(0, this.shake - dt);
    const ctx = this.ctx, dpr = this.canvas.width / CONFIG.width;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, 420, 640); ctx.save();
    if (this.shake && !reduced) ctx.translate(Math.sin(this.clock * 80) * 2, 0);
    this.background(game, reduced);
    const party = (game?.combo ?? 0) >= 5 || (game?.stage ?? 0) >= 2 || (game?.elapsed ?? 0) >= 24;
    this.updateCreatures(reduced ? dt * 0.2 : dt, party);
    const sorted = [...this.creatures].sort((a, b) => a.y - b.y);
    for (const animal of sorted) ouo(ctx, animal.x, animal.y, animal.size, animal.color, Math.sin(this.clock * (party ? 4 : 1) + animal.phase) * (reduced ? 0.02 : party ? 0.17 : 0.045), party && !reduced ? Math.sin(this.clock * 6 + animal.phase) : 0, party);
    if (title) { ouo(ctx, 138, 552, 1.9, '#8a9671', -0.1); ouo(ctx, 282, 590, 1.4, '#b2ae7c', 0.18); }
    this.drawEvent(reduced);
    // Buckets are always above events and creatures, preserving target visibility.
    if (game) for (const b of game.buckets) {
      ctx.strokeStyle = '#ffffff70'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(b.x - 10, b.y - 50); ctx.lineTo(b.x - 10, b.y - 39); ctx.moveTo(b.x + 12, b.y - 64); ctx.lineTo(b.x + 12, b.y - 43); ctx.stroke();
      bucket(ctx, b.x, b.y, b.rotation + (reduced ? 0 : Math.sin(this.clock * 4 + b.id) * 0.08));
    }
    for (const p of this.particles) {
      p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; if (!p.text) p.vy += 240 * dt;
      ctx.globalAlpha = Math.min(1, Math.max(0, p.life * 2)); ctx.fillStyle = p.color;
      if (p.text) { ctx.textAlign = 'center'; ctx.font = '900 23px sans-serif'; ctx.strokeStyle = '#fff9e7'; ctx.lineWidth = 4; ctx.strokeText(p.text, p.x, p.y); ctx.fillText(p.text, p.x, p.y); }
      else { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.life * 4); ctx.fillRect(-3, -3, 6, 8); ctx.restore(); }
    }
    ctx.globalAlpha = 1; this.particles = this.particles.filter(p => p.life > 0); ctx.restore();
  }
  private background(game: Game | undefined, reduced: boolean) {
    const c = this.ctx, t = reduced ? 0 : this.clock;
    c.fillStyle = '#d7ebcf'; c.fillRect(0, 0, 420, 640);
    c.fillStyle = '#c1dfbf';
    for (let i = 0; i < 6; i++) ellipse(c, i * 91 - 25, -10, 66, 49, '#bbd9b4');
    c.fillStyle = '#a7d9c3'; c.beginPath(); c.moveTo(75, 0); c.bezierCurveTo(15, 130, 109, 170, 55, 300); c.bezierCurveTo(5, 420, 10, 550, 0, 640); c.lineTo(420, 640); c.lineTo(420, 0); c.closePath(); c.fill();
    c.fillStyle = '#8fcfb8'; c.beginPath(); c.moveTo(308, 0); c.bezierCurveTo(401, 133, 331, 262, 385, 365); c.bezierCurveTo(420, 462, 352, 595, 380, 640); c.lineTo(420, 640); c.lineTo(420, 0); c.fill();
    for (let i = 0; i < 22; i++) {
      const x = 70 + (i * 73) % 326, y = ((i * 83 + t * 9) % 690) - 30;
      c.strokeStyle = '#e6f6db70'; c.lineWidth = i % 2 ? 2 : 3; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 12, y + 4, x + 25, y); c.stroke();
    }
    for (const [x, y, s] of [[22, 155, 1], [407, 250, 1.2], [25, 346, 0.8], [391, 430, 0.8]]) {
      ellipse(c, x, y + 6, 26 * s, 12 * s, '#62998540'); ellipse(c, x, y, 23 * s, 13 * s, '#b8bf9c');
      c.strokeStyle = '#678957'; c.lineWidth = 3;
      for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + (i - 1) * 7, y - 15, x + (i - 1) * 14, y - 22); c.stroke(); }
    }
    c.setLineDash([5, 7]); c.strokeStyle = '#f7ffde66'; c.lineWidth = 2; c.beginPath(); c.moveTo(20, CONFIG.riverY + 10); c.lineTo(400, CONFIG.riverY + 10); c.stroke(); c.setLineDash([]);
    if (game && (game.combo >= 10 || game.elapsed >= 24 || game.stage >= 3)) {
      c.strokeStyle = INK; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, 18); c.quadraticCurveTo(210, 68, 420, 18); c.stroke();
      for (let i = 0; i < 11; i++) { const x = i * 42, y = 18 + Math.sin(i / 10 * Math.PI) * 25; c.fillStyle = ['#ff986e', '#f7d365', '#fff3d4'][i % 3]; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 27, y + 4); c.lineTo(x + 12, y + 25); c.closePath(); c.fill(); }
    }
  }
  private updateCreatures(dt: number, party: boolean) {
    // Local grid collision checks avoid quadratic work at maximum crowd size.
    const cells = new Map<string, Creature[]>();
    for (const a of this.creatures) {
      const gx = Math.floor(a.x / 55), gy = Math.floor(a.y / 42);
      for (let x = gx - 1; x <= gx + 1; x++) for (let y = gy - 1; y <= gy + 1; y++) for (const b of cells.get(`${x},${y}`) ?? []) {
        const dx = a.x - b.x, dy = (a.y - b.y) * 1.5, dist = Math.hypot(dx, dy), min = 33 * (a.size + b.size);
        if (dist > 0.01 && dist < min) { const push = (min - dist) * dt * 1.4; a.vx += dx / dist * push; b.vx -= dx / dist * push; a.vy += dy / dist * push; b.vy -= dy / dist * push; }
      }
      const key = `${gx},${gy}`; if (!cells.has(key)) cells.set(key, []); cells.get(key)!.push(a);
      a.vx += Math.sin(this.clock * 1.3 + a.phase) * dt * 4; a.vy += Math.cos(this.clock + a.phase) * dt * 3;
      a.vx *= Math.exp(-dt * 0.5); a.vy *= Math.exp(-dt * 0.5);
      a.x += a.vx * dt; a.y += a.vy * dt;
      const top = party && this.creatures.length > 35 ? 470 - Math.min(120, this.creatures.length) : 490;
      if (a.x < 23) { a.x = 23; a.vx = Math.abs(a.vx); } if (a.x > 385) { a.x = 385; a.vx = -Math.abs(a.vx); }
      if (a.y < top) { a.y = top; a.vy = Math.abs(a.vy); } if (a.y > 615) { a.y = 615; a.vy = -Math.abs(a.vy); }
    }
  }
  private drawEvent(reduced: boolean) {
    if (this.clock > this.eventUntil || !this.event) return;
    const c = this.ctx, progress = 1 - (this.eventUntil - this.clock) / CONFIG.events.duration;
    if (this.event === 'giant') { c.save(); c.globalAlpha = 0.8; ouo(c, 220, 603, 3.5, '#9da779', 0, reduced ? 0 : Math.sin(this.clock * 5), true); c.restore(); }
    if (this.event === 'tour') for (let i = 0; i < 5; i++) ouo(c, reduced ? 50 + i * 80 : -180 + progress * 760 - i * 60, 490 + i % 2 * 38, 0.7, colors[i]);
    if (this.event === 'uncle') {
      c.save(); c.translate(377, 78); ellipse(c, 0, 0, 20, 22, '#eccaa0', true); ellipse(c, 0, -20, 29, 7, '#fbdb69', true); ellipse(c, -7, 0, 2, 2, INK); ellipse(c, 7, 0, 2, 2, INK); c.fillStyle = '#fcf4d9'; c.fillRect(-17, 23, 34, 26); c.restore();
    }
  }
}
