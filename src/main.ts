import './style.css';
import { Shot, SHOT, type ShotResult } from './shot';
import { ShotRenderer } from './shot-renderer';
import { Sound } from './audio';
import { preferences, readValue, saveValue } from './storage';
import { ouo } from './art';

const $ = <T extends HTMLElement>(s: string) => document.querySelector<T>(s)!;
$('#app').innerHTML = `
<div class="shell">
<header><a class="brand" href="#" aria-label="サンショウオウオカーニバル"><img src="/favicon.svg" width="34" height="34" alt=""><span>サンショウオウオ<br><b>カーニバル</b></span></a><div class="header-tools"><button id="mute" aria-label="音を切り替える">♪ OFF</button><button id="settings" aria-label="設定">⚙</button><span class="edition-tag">VOL. 02 / ONE SHOT</span></div></header>
<main>
<aside class="manifesto"><span class="kicker"><i></i> ONE FINGER. ONE SHOT. ALL OUO.</span><h1>指を離すと、<br><em>宇宙が<br>始まる。</em><span class="asterisk">✳</span></h1><p class="intro">川の底に、カーニバルをためろ。<br>爆ぜる寸前。その指を、離せ。</p><div class="instructions"><div><span>01</span><p><b>押し続ける。</b>オウオがふくらむ。</p></div><div><span>02</span><p><b>横へずらす。</b>空の輪を狙う。</p></div><div><span>03</span><p><b>ピンクになったら、離せ。</b></p></div></div><p class="manifesto-note">一発勝負。ためすぎると、川が抜ける。</p><div class="best-sticker"><span>YOUR BEST CARNIVAL</span><b id="desktop-best">0</b><small>OUO POINTS</small></div></aside>
<section class="machine" aria-label="一発オウオ砲">
<div class="machine-top"><span><i></i> 一発オウオ砲</span><span id="phase">READY TO OUO</span></div>
<div id="stage" class="stage">
<canvas id="game" aria-label="オウオが宇宙へ飛ぶ様子"></canvas>
<div class="stage-grain"></div>
<div id="ready" class="ready"><span class="small-pill">ためて。狙って。離せ。</span><h2>一発で、<br><em>全部オウオ。</em></h2><p>気持ちよくなるまで、<br>あと指一本。</p></div>
<div id="live" class="live" hidden><div class="live-top"><div><small>OUO ALTITUDE</small><b id="altitude">0<span>m</span></b></div><span id="chain">0 連鎖</span></div><p id="callout"></p></div>
<div id="charge-copy" class="charge-copy" hidden><span id="charge-label">まだ、ためろ。</span><strong id="pressure" role="progressbar" aria-label="オウオ圧" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">0<small>%</small></strong><p id="charge-sub">横へずらして、輪を狙え。</p></div>
<button id="hold" class="hold-button" aria-label="押し続けてためる。左右へ動かして狙い、離して発射。スペースキーでも操作できます。"><span id="hold-label">押し続けろ</span><small id="hold-sub">HOLD TO OUO</small></button>
<div id="flight-label" class="flight-label" hidden><b id="flight-title">オウオ、出発。</b><span>空の輪で、カーニバル連鎖。</span></div>
<section id="result" class="result" hidden aria-labelledby="result-title"><span class="result-eyebrow">YOUR ONE SHOT CARNIVAL</span><h2 id="result-title"></h2><p id="result-comment"></p><div class="score-display"><b id="result-score">0</b><span>OUO POINTS <i id="new-best" hidden>NEW BEST</i></span></div><div class="result-stats"><div><b id="result-height"></b><small>最高到達点</small></div><div><b id="result-rings"></b><small>カーニバル連鎖</small></div><div><b id="result-pressure"></b><small>発射オウオ圧</small></div></div><div class="result-rank" id="result-rank"></div><button id="retry" class="retry">もう一発、オウオ。<span>↗</span></button><div class="share-actions"><button id="share">↗ 結果をシェア</button><button id="save">↓ 画像にする</button></div><textarea id="copy-fallback" aria-label="共有文章を選択してコピー" readonly hidden></textarea><button id="reset" class="reset">タイトルにもどる</button></section>
</div>
<div class="machine-bottom"><span id="bottom-tip">ピンクの瞬間が、いちばん飛ぶ。</span><span>BEST <b id="best">0</b></span></div>
</section>
</main>
<footer><span>NO SECOND SHOT. JUST ANOTHER CARNIVAL.</span><small>これは架空のオウオ宇宙です。実際の生態とは関係ありません。</small></footer>
</div>
<dialog id="settings-dialog"><div class="dialog-head"><h2>オウオの設定</h2><button id="close-settings" aria-label="設定を閉じる">×</button></div><label>音を出す<input id="audio-setting" type="checkbox"></label><label>音量<input id="volume" type="range" min="0" max="100" step="5"></label><label>画面の動きを軽減<input id="motion" type="checkbox"></label><p>音は押し始めてから再生します。<br>設定はこのブラウザに保存されます。</p></dialog>
<div id="toast" class="toast" role="status" aria-live="polite"></div>`;

const settings = preferences();
// Keep the user's sound preference. First-time players start with sound enabled on touch.
const sound = new Sound(settings), renderer = new ShotRenderer($('#game'));
let shot = new Shot();
const storedBest = readValue<unknown>('ouo-shot-best', 0);
let best = typeof storedBest === 'number' && Number.isFinite(storedBest) ? Math.max(0, storedBest) : 0;
let pointer: number | undefined, startX = 0, lastTime = performance.now(), resultShown = false;
let toastTimeout: ReturnType<typeof setTimeout>;
const show = (s: string, value: boolean) => { $(s).hidden = !value; };
const fmt = (n: number) => n.toLocaleString('ja-JP');
function toast(text: string) { $('#toast').textContent = text; $('#toast').classList.add('visible'); clearTimeout(toastTimeout); toastTimeout = setTimeout(() => $('#toast').classList.remove('visible'), 3500); }
function syncSettings() {
  sound.update(settings); saveValue('ouo-settings', settings);
  $('#mute').textContent = settings.muted ? '♪ OFF' : '♪ ON'; $('#mute').setAttribute('aria-label', settings.muted ? '音をオンにする' : '音をミュートする');
  $<HTMLInputElement>('#audio-setting').checked = !settings.muted; $<HTMLInputElement>('#volume').value = String(settings.volume * 100); $<HTMLInputElement>('#motion').checked = settings.reducedMotion;
  document.body.classList.toggle('reduced-motion', settings.reducedMotion);
}
function syncBest() { $('#best').textContent = fmt(best); $('#desktop-best').textContent = fmt(best); }
function begin() {
  if (!shot.press()) return; void sound.unlock(); show('#ready', false); show('#charge-copy', true); $('#phase').textContent = 'OUO UNDER PRESSURE';
  $('#hold-label').textContent = 'まだ、離すな。'; $('#hold-sub').textContent = '← 横にずらして狙う →'; document.body.classList.add('charging'); lastTime = performance.now();
}
function release() { if (shot.release()) { sound.launch(shot.perfect); processEvents(); show('#charge-copy', false); show('#live', true); show('#hold', false); show('#flight-label', true); $('#flight-title').textContent = shot.perfect ? 'カーニバァァル！！' : shot.launchPressure < .2 ? 'ぴょ。' : 'オウオ、出発。'; $('#callout').textContent = shot.perfect ? '限界突破オウオ！' : ''; $('#phase').textContent = 'OUO IS IN THE AIR'; document.body.classList.remove('charging'); document.body.classList.toggle('perfect', shot.perfect); } }
function reset() {
  pointer = undefined; sound.stopCharge(); shot = new Shot(); renderer.reset(); resultShown = false; lastTime = performance.now();
  show('#ready', true); show('#hold', true); show('#result', false); show('#live', false); show('#charge-copy', false); show('#flight-label', false); show('#copy-fallback', false);
  $('#phase').textContent = 'READY TO OUO'; $('#hold-label').textContent = '押し続けろ'; $('#hold-sub').textContent = 'HOLD TO OUO'; $('#bottom-tip').textContent = 'ピンクの瞬間が、いちばん飛ぶ。';
  document.body.classList.remove('charging', 'perfect', 'busted'); $('#hold').focus({ preventScroll: true });
}
function cancel() { if (shot.mode === 'charging') { shot.cancel(); sound.stopCharge(); show('#ready', true); show('#charge-copy', false); $('#hold-label').textContent = '押し続けろ'; $('#hold-sub').textContent = 'HOLD TO OUO'; $('#phase').textContent = 'READY TO OUO'; document.body.classList.remove('charging', 'perfect'); } pointer = undefined; }
function processEvents() {
  for (const event of shot.drain()) {
    renderer.event(event, shot);
    if (event.kind === 'ring') sound.ring(shot.ringsHit);
    if (event.kind === 'rupture') { sound.rupture(); document.body.classList.remove('charging'); document.body.classList.add('busted'); show('#charge-copy', false); show('#hold', false); $('#phase').textContent = 'TOO MUCH OUO'; }
    if (event.kind === 'end') showResult();
  }
}
function showResult() {
  if (resultShown || !shot.result) return; resultShown = true; const r = shot.result, newBest = r.score > best; best = Math.max(best, r.score); saveValue('ouo-shot-best', best); syncBest();
  $('#result-title').textContent = r.title; $('#result-comment').textContent = r.comment; $('#result-score').textContent = fmt(r.score);
  $('#result-height').textContent = `${fmt(r.height)}m`; $('#result-rings').textContent = `${r.rings}連鎖`; $('#result-pressure').textContent = `${Math.round(r.pressure * 100)}%`;
  $('#result-rank').textContent = r.busted ? 'ためすぎ。ピンクのうちに、離せ。' : r.perfect ? '限界寸前の一発。これが、カーニバル。' : 'まだ飛べる。ピンクになるまで、粘れ。';
  show('#new-best', newBest); show('#live', false); show('#flight-label', false); show('#result', true); $('#phase').textContent = 'ONE SHOT. ONE LEGEND.';
  $('#bottom-tip').textContent = 'もう一発。次こそ、宇宙。'; $('#retry').focus({ preventScroll: true });
}
function frame(now: number) {
  const dt = Math.max(0, (now - lastTime) / 1000); lastTime = now;
  if (!document.hidden && !$<HTMLDialogElement>('#settings-dialog').open) {
    shot.advance(dt); processEvents(); renderer.draw(Math.min(dt, .05), shot, settings.reducedMotion);
    if (shot.mode === 'charging') {
      const p = shot.pressure; sound.charge(p, shot.held);
      $('#pressure').innerHTML = `${Math.floor(p * 100)}<small>%</small>`; $('#pressure').setAttribute('aria-valuenow', String(Math.floor(p * 100)));
      $('#charge-label').textContent = p >= .92 ? 'いまだ。離せ！！！' : p >= .75 ? 'もう少し……！' : p >= .4 ? 'まだ、粘れ。' : '川を、ためろ。';
      $('#hold-label').textContent = p >= .92 ? '離せ！！！' : p >= .75 ? 'ギリギリを狙え。' : 'まだ、離すな。';
      $('#charge-sub').textContent = p >= .92 ? 'ためすぎると、決壊する。' : '横へずらして、輪を狙え。'; document.body.classList.toggle('perfect', p >= .92);
    }
    if (shot.mode === 'flight') { $('#altitude').innerHTML = `${fmt(Math.round(Math.max(0, SHOT.launchY - shot.y) * .8))}<span>m</span>`; $('#chain').textContent = `${shot.ringsHit} 連鎖`; }
  }
  requestAnimationFrame(frame);
}
const hold = $('#hold');
hold.addEventListener('pointerdown', event => { if (event.button !== 0 || pointer !== undefined || shot.mode !== 'idle') return; event.preventDefault(); pointer = event.pointerId; startX = event.clientX; hold.setPointerCapture(event.pointerId); begin(); });
hold.addEventListener('pointermove', event => { if (event.pointerId === pointer) shot.aimAt((event.clientX - startX) / $('#game').getBoundingClientRect().width * SHOT.width); });
hold.addEventListener('pointerup', event => { if (event.pointerId !== pointer) return; event.preventDefault(); pointer = undefined; release(); });
hold.addEventListener('pointercancel', cancel); hold.addEventListener('lostpointercapture', () => { if (pointer !== undefined) cancel(); });
hold.addEventListener('keydown', event => { if (event.code === 'Space' || event.code === 'Enter') { event.preventDefault(); if (!event.repeat) begin(); } else if (event.code === 'ArrowLeft') { event.preventDefault(); shot.aimAt(shot.aim * 135 - 20); } else if (event.code === 'ArrowRight') { event.preventDefault(); shot.aimAt(shot.aim * 135 + 20); } });
hold.addEventListener('keyup', event => { if (event.code === 'Space' || event.code === 'Enter') { event.preventDefault(); release(); } });
hold.addEventListener('click', event => { if (event.detail === 0) { if (shot.mode === 'idle') begin(); else if (shot.mode === 'charging') release(); } });
$('#retry').addEventListener('click', reset); $('#reset').addEventListener('click', reset); $('.brand').addEventListener('click', event => { event.preventDefault(); reset(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) cancel(); lastTime = performance.now(); }); window.addEventListener('blur', cancel); window.addEventListener('resize', () => renderer.resize());
$('#mute').addEventListener('click', () => { settings.muted = !settings.muted; void sound.unlock(); syncSettings(); });
$('#settings').addEventListener('click', () => { cancel(); $<HTMLDialogElement>('#settings-dialog').showModal(); });
$('#close-settings').addEventListener('click', () => { $<HTMLDialogElement>('#settings-dialog').close(); lastTime = performance.now(); });
$('#audio-setting').addEventListener('change', e => { settings.muted = !(e.target as HTMLInputElement).checked; void sound.unlock(); syncSettings(); });
$('#volume').addEventListener('input', e => { settings.volume = Number((e.target as HTMLInputElement).value) / 100; syncSettings(); });
$('#motion').addEventListener('change', e => { settings.reducedMotion = (e.target as HTMLInputElement).checked; syncSettings(); });
function publicUrl() { const url = new URL(location.href); if (url.protocol === 'file:') return ''; url.hash = ''; url.search = ''; return url.href; }
function resultText(r: ShotResult) { return `一発で${fmt(r.height)}m、${r.rings}連鎖。${r.title} ${fmt(r.score)}オウオ点！ #サンショウオウオカーニバル\n${publicUrl()}`; }
function resultCanvas(r: ShotResult) {
  const canvas = document.createElement('canvas'); canvas.width = 1080; canvas.height = 1920; const c = canvas.getContext('2d')!;
  c.fillStyle = '#17291e'; c.fillRect(0, 0, 1080, 1920); const text = (s: string, y: number, size: number, color = '#f6f3e8') => { c.fillStyle = color; c.font = `900 ${size}px sans-serif`; c.textAlign = 'center'; c.fillText(s, 540, y, 960); };
  text('サンショウオウオカーニバル', 150, 48); text('一発オウオ砲 / ONE SHOT', 220, 25, '#dfff74');
  text(r.title, 445, 77, r.busted ? '#ff9acb' : '#dfff74'); text(fmt(r.score), 710, 170); text('OUO POINTS', 775, 32);
  text(`${fmt(r.height)}m     ${r.rings}連鎖     圧 ${Math.round(r.pressure * 100)}%`, 920, 40); text(r.comment, 1040, 28);
  for (let i = 0; i < 16; i++) ouo(c, 60 + i % 4 * 290, 1180 + Math.floor(i / 4) * 140, 1.7, ['#dfff74', '#ff9acb', '#8fe4c2'][i % 3], (i % 3 - 1) * .2, 0, true);
  text('指を離すと、宇宙が始まる。', 1770, 43, '#dfff74'); text(publicUrl() || 'ONE FINGER. ONE SHOT. ALL OUO.', 1850, 24); return canvas;
}
async function blob(): Promise<Blob> { if (!shot.result) throw new Error('No result'); const canvas = resultCanvas(shot.result); return new Promise((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error('PNG unavailable')), 'image/png')); }
$('#save').addEventListener('click', async () => { try { const image = await blob(), url = URL.createObjectURL(image), a = document.createElement('a'); a.href = url; a.download = 'one-shot-ouo.png'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 60000); toast('この一発、画像にしたオウ。'); } catch { toast('画像を作れませんでした。もう一度試してね。'); } });
$('#share').addEventListener('click', async () => {
  if (!shot.result) return; const text = resultText(shot.result);
  try {
    const file = new File([await blob()], 'one-shot-ouo.png', { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) await navigator.share({ text, files: [file] });
    else if (navigator.share) await navigator.share({ text });
    else { try { await navigator.clipboard.writeText(text); toast('結果をコピーしたオウ。画像も保存できるよ。'); } catch { $<HTMLTextAreaElement>('#copy-fallback').value = text; show('#copy-fallback', true); toast('文章を選択してコピーしてね。'); } }
  } catch (e) { if (!(e instanceof DOMException && e.name === 'AbortError')) toast('共有できませんでした。「画像にする」を使ってね。'); }
});
syncSettings(); syncBest(); requestAnimationFrame(frame);
if (import.meta.env.DEV) Object.defineProperty(window, '__ouo', { value: { get shot() { return shot; } } });
