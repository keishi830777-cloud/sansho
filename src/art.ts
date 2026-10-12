export const INK = '#203e35';
const TAU = Math.PI * 2;
export function ellipse(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, color: string, stroke = false) {
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fillStyle = color; ctx.fill(); if (stroke) { ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke(); }
}
/** Broad head, tiny eyes, four short limbs, long flattened tail. Palette is decorative, never ancestry. */
export function ouo(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color = '#7f8961', angle = 0, dance = 0, look = false) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.scale(size, size);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.fillStyle = color; ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.moveTo(12, 3); ctx.bezierCurveTo(40, -2, 63, 5, 73, -11 + dance * 7); ctx.bezierCurveTo(62, 16, 44, 27, 17, 21); ctx.closePath(); ctx.fill(); ctx.stroke();
  for (const [lx, ly, dir] of [[-18, 6, -1], [13, 12, 1], [-13, 23, -1], [18, 26, 1]]) {
    ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + dir * 9, ly + 7 + dance * dir * 3); ctx.lineWidth = 8; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 5; ctx.strokeStyle = color; ctx.stroke();
    for (let toe = -1; toe <= 1; toe++) { ctx.beginPath(); ctx.moveTo(lx + dir * 9, ly + 7); ctx.lineTo(lx + dir * (11 + toe), ly + 11 + toe * 2); ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.stroke(); }
  }
  ellipse(ctx, 5, 13, 28, 22, color, true);
  ellipse(ctx, -9, -2, 35, 22, color, true);
  for (const [sx, sy, r] of [[-30, -9, 3], [-12, -17, 2.5], [12, -11, 3], [19, 5, 2], [-4, 12, 3], [18, 23, 2], [4, -6, 2]]) ellipse(ctx, sx, sy, r, r * 0.65, '#344c3540');
  ellipse(ctx, -29, -4, 2.3, look ? 3.4 : 2.3, INK); ellipse(ctx, 7, -4, 2.3, look ? 3.4 : 2.3, INK);
  ellipse(ctx, -30, 4, 5, 2.5, '#efa38999'); ellipse(ctx, 10, 4, 5, 2.5, '#efa38999');
  ctx.beginPath(); ctx.moveTo(-23, 5); ctx.quadraticCurveTo(-10, 15 + dance * 3, 2, 5); ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.stroke();
  ctx.restore();
}
export function bucket(ctx: CanvasRenderingContext2D, x: number, y: number, rotation = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rotation);
  ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.ellipse(0, -12, 17, 22, 0, Math.PI, TAU); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-25, -13); ctx.lineTo(-19, 24); ctx.quadraticCurveTo(0, 32, 19, 24); ctx.lineTo(25, -13); ctx.closePath(); ctx.fillStyle = '#ff8d55'; ctx.fill(); ctx.stroke();
  ellipse(ctx, 0, -13, 25, 7, '#ffc798', true);
  ellipse(ctx, -2, -16, 13, 8, '#899773', true);
  ellipse(ctx, -9, -18, 1.5, 1.5, INK); ellipse(ctx, 5, -18, 1.5, 1.5, INK);
  ctx.beginPath(); ctx.moveTo(-15, -3); ctx.lineTo(-12, 19); ctx.strokeStyle = '#ffd5a3'; ctx.lineWidth = 4; ctx.stroke();
  ctx.fillStyle = INK; ctx.font = '900 15px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('!', 2, 17);
  ctx.restore();
}
