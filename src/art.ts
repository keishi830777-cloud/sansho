export const INK = '#142019';
const TAU = Math.PI * 2;
export function ellipse(c: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, color: string, stroke = false) {
  c.beginPath(); c.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), 0, 0, TAU); c.fillStyle = color; c.fill();
  if (stroke) { c.strokeStyle = INK; c.lineWidth = 2; c.stroke(); }
}
/** The OUO mascot: four little feet, a broad head and an absurdly happy face. */
export function ouo(c: CanvasRenderingContext2D, x: number, y: number, scale: number, color = '#dfff74', angle = 0, mood = 0, excited = false) {
  c.save(); c.translate(x, y); c.rotate(angle); c.scale(scale, scale); c.lineWidth = 2; c.lineJoin = 'round'; c.lineCap = 'round';
  c.fillStyle = color; c.strokeStyle = INK;
  c.beginPath(); c.moveTo(15, 9); c.bezierCurveTo(43, 0, 64, 25, 75, -9); c.bezierCurveTo(73, 34, 43, 31, 16, 24); c.fill(); c.stroke();
  for (const [fx, fy] of [[-25, 10], [22, 10], [-20, 27], [22, 27]]) {
    c.beginPath(); c.moveTo(fx, fy); c.lineTo(fx + (fx < 0 ? -7 : 7), fy + 8 + mood * 2); c.lineWidth = 8; c.strokeStyle = INK; c.stroke(); c.lineWidth = 5; c.strokeStyle = color; c.stroke();
  }
  ellipse(c, 6, 15, 32, 22, color, true); ellipse(c, -7, -3, 40, 26, color, true);
  for (const [sx, sy] of [[-30, -18], [4, -21], [24, -8], [10, 18], [-5, 28]]) ellipse(c, sx, sy, 3, 2, '#27432b28');
  ellipse(c, -25, -5, excited ? 3.2 : 2.5, excited ? 4.5 : 3, INK); ellipse(c, 10, -5, excited ? 3.2 : 2.5, excited ? 4.5 : 3, INK);
  ellipse(c, -31, 5, 6, 3.3, '#f998b1'); ellipse(c, 17, 5, 6, 3.3, '#f998b1');
  if (excited) { ellipse(c, -7, 10, 10, 8 + mood * 2, INK); ellipse(c, -7, 15, 6, 3, '#fa9ac4'); }
  else { c.beginPath(); c.moveTo(-20, 6); c.quadraticCurveTo(-7, 18, 5, 6); c.lineWidth = 2; c.strokeStyle = INK; c.stroke(); }
  c.restore();
}
