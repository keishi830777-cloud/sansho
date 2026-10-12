import { INK, ouo } from './art';
import type { Result } from './game';
export function gameUrl() {
  if (location.protocol === 'file:') return '';
  const url = new URL(location.href); url.hash = ''; url.search = ''; return url.href;
}
export function shareText(result: Result, title: string) {
  return `【${title}】${result.score.toLocaleString()}点 / ${result.bestCombo}コンボ！ オウオパニック指数 ${result.panic}。バケツを止めろ！！！ #サンショウオウオカーニバル\n${gameUrl()}`;
}
export function resultCanvas(result: Result, title: string, comment: string) {
  const canvas = document.createElement('canvas'); canvas.width = 1080; canvas.height = 1920;
  const c = canvas.getContext('2d')!;
  c.fillStyle = '#f8f4df'; c.fillRect(0, 0, 1080, 1920);
  c.fillStyle = '#a7d9c3'; c.fillRect(0, 1330, 1080, 590);
  c.strokeStyle = INK; c.lineWidth = 5; c.strokeRect(36, 36, 1008, 1848);
  const text = (value: string, y: number, size: number, color = INK) => { c.fillStyle = color; c.font = `900 ${size}px sans-serif`; c.textAlign = 'center'; c.fillText(value, 540, y, 950); };
  text('30 SECONDS / BIG OUO ENERGY', 146, 25);
  text('サンショウオウオ', 258, 67); text('カーニバル', 363, 94); text('オウオ大増殖パニック', 433, 33);
  c.fillStyle = '#f8d767'; c.beginPath(); c.roundRect(135, 503, 810, 97, 48); c.fill(); text(title, 565, 40);
  text('放流阻止スコア', 699, 31); text(result.score.toLocaleString(), 876, 166); text('POINTS', 930, 28);
  text(`${result.bestCombo} COMBO     ${result.caught} 阻止     ${result.missed} 見逃し`, 1040, 35);
  text(`オウオパニック指数  ${result.panic}`, 1166, 48, '#c65b35');
  text(comment, 1280, 33);
  for (let i = 0; i < 8; i++) ouo(c, 90 + i % 4 * 290, 1430 + Math.floor(i / 4) * 150, 2.15, ['#889575', '#a6ac7e', '#758a71'][i % 3], (i % 3 - 1) * 0.1, 0, true);
  text('きみの川は、どうなる？', 1730, 48);
  text(gameUrl() || 'ダウンロード版 / OUO! RIVER ARCADE', 1810, 25);
  return canvas;
}
export async function imageBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('画像を生成できませんでした')), 'image/png'));
}
export function downloadImage(blob: Blob) {
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = 'ouo-carnival-result.png'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
export async function copyText(text: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(text); return true; }
  catch {
    const input = document.createElement('textarea'); input.value = text; input.style.position = 'fixed'; input.style.opacity = '0'; document.body.append(input); input.select();
    let copied = false; try { copied = document.execCommand('copy'); } catch { /* manual fallback in UI */ } input.remove(); return copied;
  }
}
