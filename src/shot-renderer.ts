import { Shot, SHOT, type ShotEvent } from './shot';
import { ouo, ellipse, INK } from './art';
interface Actor { x: number; y: number; vx: number; vy: number; color: string; size: number; angle: number; spin: number; life: number }
interface Spark { x: number; y: number; vx: number; vy: number; life: number; color: string }
const palette = ['#dfff74', '#ff9acb', '#8fe4c2', '#ffbe71', '#d5c4ff'];
export class ShotRenderer {
  private c: CanvasRenderingContext2D;
  private clock = 0; private camera = 0; private actors: Actor[] = []; private sparks: Spark[] = [];
  private flash = 0; private ringToast = 0; private lastRing = 0;
  constructor(readonly canvas: HTMLCanvasElement) { this.c = canvas.getContext('2d')!; this.resize(); }
  resize() { const dpr = Math.min(devicePixelRatio || 1, 2); this.canvas.width = SHOT.width * dpr; this.canvas.height = SHOT.height * dpr; }
  reset() { this.camera = 0; this.actors = []; this.sparks = []; this.flash = 0; this.ringToast = 0; }
  event(e: ShotEvent, shot: Shot) {
    if (e.kind === 'launch' || e.kind === 'rupture') {
      this.flash = .32;
      const count = e.kind === 'rupture' ? 55 : Math.round(18 + shot.launchPressure * 120);
      for (let i = 0; i < count; i++) {
        const velocity = -shot.vy;
        this.actors.push({ x: 210 + (Math.random() - .5) * 70, y: SHOT.launchY + Math.random() * 30, vx: e.kind === 'rupture' ? (Math.random() - .5) * 480 : shot.vx + (Math.random() - .5) * (80 + shot.launchPressure * 210), vy: e.kind === 'rupture' ? -80 - Math.random() * 280 : -velocity * (.65 + Math.random() * .38), color: palette[i % palette.length], size: .27 + Math.random() * .25, angle: Math.random() * 3, spin: (Math.random() - .5) * 5, life: 9 });
      }
      this.splash(e.x, e.y, 35);
    }
    if (e.kind === 'ring') { this.splash(e.x, e.y, 28); this.ringToast = .6; this.lastRing = shot.ringsHit; }
  }
  private splash(x: number, y: number, count: number) {
    for (let i = 0; i < count; i++) { const a = Math.random() * Math.PI * 2, v = 70 + Math.random() * 130; this.sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: .6 + Math.random() * .8, color: palette[i % palette.length] }); }
    if (this.sparks.length > 150) this.sparks.splice(0, this.sparks.length - 150);
  }
  draw(dt: number, shot: Shot, reduced: boolean) {
    this.clock += dt; this.flash = Math.max(0, this.flash - dt); this.ringToast = Math.max(0, this.ringToast - dt);
    const c = this.c, dpr = this.canvas.width / SHOT.width;
    c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, 420, 680);
    const targetCamera = shot.mode === 'flight' || shot.mode === 'result' ? Math.min(0, shot.y - 210) : 0;
    this.camera += (targetCamera - this.camera) * (1 - Math.exp(-dt * 7));
    if (shot.mode === 'idle' || shot.mode === 'charging' || shot.mode === 'rupture') this.camera = 0;
    const space = Math.min(1, -this.camera / 850);
    c.fillStyle = space > .6 ? '#291b45' : '#183f36'; c.fillRect(0, 0, 420, 680);
    this.stars(c, space);
    c.save(); c.translate(0, -this.camera);
    this.world(shot, reduced);
    if (shot.mode === 'charging') this.preview(shot);
    for (const actor of this.actors) {
      actor.life -= dt; actor.vy += SHOT.gravity * dt; actor.x += actor.vx * dt; actor.y += actor.vy * dt; actor.angle += actor.spin * dt;
      if (actor.x < 15 || actor.x > 405) { actor.vx *= -.8; actor.x = Math.max(15, Math.min(405, actor.x)); }
      if (actor.y - this.camera > -90 && actor.y - this.camera < 770) ouo(c, actor.x, actor.y, actor.size, actor.color, reduced ? 0 : actor.angle, 0, true);
    }
    this.actors = this.actors.filter(a => a.life > 0 && a.y < 800).slice(-SHOT.maxActors);
    const p = shot.mode === 'charging' ? shot.pressure : 0;
    if (shot.mode === 'idle' || shot.mode === 'charging') {
      const pulse = reduced ? 0 : Math.sin(this.clock * (2 + p * 25)) * p * 3;
      c.save(); c.translate(210 + pulse, 530); c.scale(1 + p * .5, 1 - p * .4); ouo(c, 0, 0, 1.95, p >= .92 ? '#ff9acb' : '#dfff74', shot.aim * .2, p, p > .72); c.restore();
      this.pressureArc(p);
    }
    if (shot.mode === 'flight' || shot.mode === 'result') {
      if (shot.mode === 'flight') {
        c.strokeStyle = '#dfff7460'; c.lineWidth = 16; c.lineCap = 'round'; c.beginPath(); c.moveTo(shot.x, shot.y); c.lineTo(shot.x - shot.vx * .08, shot.y - shot.vy * .08); c.stroke();
        ouo(c, shot.x, shot.y, .85 + shot.launchPressure * .55, shot.perfect ? '#ff9acb' : '#dfff74', Math.atan2(shot.vy, shot.vx) + Math.PI / 2, 0, true);
      }
    }
    for (const spark of this.sparks) {
      spark.life -= dt; spark.x += spark.vx * dt; spark.y += spark.vy * dt; spark.vy += 90 * dt;
      c.globalAlpha = Math.min(1, Math.max(0, spark.life)); c.fillStyle = spark.color; c.save(); c.translate(spark.x, spark.y); c.rotate(spark.life * 3); c.fillRect(-2, -5, 4, 10); c.restore();
    }
    c.globalAlpha = 1; this.sparks = this.sparks.filter(s => s.life > 0); c.restore();
    if (this.flash > 0) { c.fillStyle = `rgba(223,255,116,${this.flash * .4})`; c.fillRect(0, 0, 420, 680); }
    if (this.ringToast > 0) { c.font = '900 29px sans-serif'; c.fillStyle = '#dfff74'; c.textAlign = 'center'; c.fillText(`${this.lastRing} 連鎖オウオ！`, 210, 330 - (1 - this.ringToast / .6) * 25); }
    if (shot.mode === 'rupture') {
      c.fillStyle = '#ff9acb'; c.font = '1000 51px sans-serif'; c.textAlign = 'center'; c.save(); c.translate(210, 300); c.rotate(-.08); c.fillText('川、抜けた。', 0, 0); c.restore();
      ouo(c, 210, 495 + Math.min(1, shot.ruptureTime) * 40, 2.6, '#ff9acb', reduced ? 0 : Math.sin(shot.ruptureTime * 6) * .3, 0, true);
    }
  }
  private stars(c: CanvasRenderingContext2D, space: number) {
    for (let i = 0; i < 48; i++) {
      const x = ((i * 97 + 17) % 420), y = ((i * 139 - this.camera * .18) % 740 + 740) % 740;
      c.fillStyle = i % 5 === 0 ? '#dfff74' : `rgba(241,238,227,${.18 + space * .4})`;
      c.beginPath(); c.arc(x, y, i % 5 === 0 ? 2 : 1, 0, Math.PI * 2); c.fill();
    }
  }
  private world(shot: Shot, reduced: boolean) {
    const c = this.c;
    // Abstract scenery with negative world coordinates: height changes the whole stage.
    for (const [y, caption] of [[60, '雲の上まで、オウオ。'], [-490, '成層圏も、カーニバル。'], [-1190, '宇宙に川がありました。'] ] as const) {
      c.strokeStyle = '#f4f1e520'; c.setLineDash([3, 9]); c.beginPath(); c.moveTo(30, y); c.lineTo(390, y); c.stroke(); c.setLineDash([]);
      c.font = '700 10px sans-serif'; c.fillStyle = '#f4f1e55f'; c.textAlign = 'left'; c.fillText(caption, 28, y - 13);
    }
    ellipse(c, 335, -600, 45, 45, '#ff9acb20'); ouo(c, 330, -598, .73, '#d5c4ff', -.2);
    ellipse(c, 68, -1250, 65, 65, '#dfff7415'); ouo(c, 50, -1250, 1.1, '#dfff74', .12);
    for (const ring of shot.rings) {
      if (shot.mode === 'idle') continue;
      if (ring.y - this.camera < -60 || ring.y - this.camera > 740) continue;
      c.save(); c.translate(ring.x, ring.y); c.rotate(reduced ? 0 : Math.sin(this.clock + ring.phase) * .13);
      c.strokeStyle = ring.hit ? '#ffffff18' : '#ffe291'; c.lineWidth = ring.hit ? 2 : 5;
      c.beginPath(); c.ellipse(0, 0, 28, 23, 0, 0, Math.PI * 2); c.stroke();
      if (!ring.hit) { c.fillStyle = '#ffe291'; c.font = '700 19px sans-serif'; c.textAlign = 'center'; c.fillText('♪', 0, 7); }
      c.restore();
    }
    if (this.camera > -600) {
      c.fillStyle = '#b4e7cd'; c.beginPath(); c.moveTo(0, 558);
      for (let x = 0; x <= 420; x += 10) c.lineTo(x, 558 + Math.sin(x / 35 + (reduced ? 0 : this.clock * 1.5)) * 8);
      c.lineTo(420, 800); c.lineTo(0, 800); c.fill();
      for (let i = 0; i < 8; i++) ouo(c, i * 66 - 15, 619 + i % 2 * 32, .47, palette[i % palette.length], reduced ? 0 : Math.sin(this.clock + i) * .1);
      c.fillStyle = '#15352b'; c.beginPath(); c.ellipse(210, 566, 112, 18, 0, 0, Math.PI * 2); c.fill();
    }
  }
  private pressureArc(p: number) {
    const c = this.c;
    c.strokeStyle = '#dfff7420'; c.lineWidth = 5; c.beginPath(); c.arc(210, 530, 118, Math.PI * 1.08, Math.PI * 1.92); c.stroke();
    if (p > 0) { c.strokeStyle = p >= .92 ? '#ff9acb' : '#dfff74'; c.lineWidth = 7; c.beginPath(); c.arc(210, 530, 118, Math.PI * 1.08, Math.PI * (1.08 + .84 * p)); c.stroke(); }
  }
  private preview(shot: Shot) {
    const c = this.c, power = 110 + 950 * Math.pow(shot.pressure, 1.4), vx = shot.aim * power * .43, vy = -power * (shot.pressure >= .92 ? 1.08 : 1);
    for (let i = 1; i <= 7; i++) { const t = i * .055; ellipse(c, 210 + vx * t, 530 + vy * t + .5 * SHOT.gravity * t * t, 2, 2, '#fcf5d978'); }
  }
}
