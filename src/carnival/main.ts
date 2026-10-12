import './style.css';
import { Game, resultText, type Result, type Signal } from './game';
import { CONFIG, EVENT_LABELS, STAGES } from './config';
import { Renderer } from './renderer';
import { Sound } from './audio';
import { preferences, bestScore, saveValue } from '../storage';
import { copyText, downloadImage, gameUrl, imageBlob, resultCanvas, shareText } from './share';

const $ = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const icon = '<img src="/favicon.svg" alt="" width="38" height="38">';
$('#app').innerHTML = `
<header class="site-header"><a href="#" class="brand" aria-label="タイトルへ">${icon}<span>OUO! <small>RIVER ARCADE</small></span></a><button id="settings-open" class="icon-button" aria-label="音量・演出の設定">☷ <span>設定</span></button></header>
<main class="layout">
  <aside class="side intro-side"><p class="eyebrow">TAP FAST. GO OUO.</p><h2>オウオが、増える。<br>増える。<br><em>指、追いつく！？</em></h2><p class="side-copy">一発タップで、ぬめぬめ大歓声。<br>最後の5秒は、手加減しない。</p><div class="how-card"><span class="number">01</span><div><strong>バケツをタップ！</strong><p>落ちる前に止めて、川を守ろう。</p></div></div><div class="how-card"><span class="number">02</span><div><strong>つなげ、オウオコンボ。</strong><p>連続成功で、スコア最大3倍！</p></div></div><div class="how-card"><span class="number">03</span><div><strong>30秒で、お祭り騒ぎ。</strong><p>ミスしても最後まで遊べるよ。</p></div></div><div class="side-note">指1本でOK <span>↗</span> 登録・インストール不要</div></aside>
  <section class="arcade" aria-label="サンショウオウオカーニバル">
    <div class="cabinet-top"><span><i></i> OUO! RIVER NO. 01</span><span>30 SEC CHALLENGE</span></div>
    <div class="hud" id="hud"><div><span class="hud-label">SCORE</span><strong id="score">0</strong></div><div class="combo-block"><span class="hud-label">COMBO</span><strong id="combo">—</strong></div><div class="timer-block"><span class="hud-label">TIME</span><strong id="timer">30<span> s</span></strong></div></div>
    <div class="game-stage" id="stage">
      <canvas id="game" tabindex="0" role="application" aria-label="落ちてくるバケツをタップ。キーボードではスペースで一番下のバケツを阻止。30秒で終了。"></canvas>
      <section id="title-screen" class="title-screen screen">
        <span class="edition">30秒だけ、全力カーニバル！</span>
        <h1><span>サンショウオウオ</span><b>カーニバル<span class="title-star">✷</span></b></h1>
        <p class="subtitle">オウオ大増殖パニック</p>
        <p class="title-story">平和な川に、今日も<br>オウオが暮らしている。</p>
        <div class="start-wrap"><span class="start-note">バケツを止めろ！！！</span><button id="start" class="primary">カーニバル、開幕！ <span>↗</span></button><p class="control-hint">バケツをタップ / クリックで阻止</p></div>
        <span class="speech-bubble">オウ？</span>
        <div class="best-pill">BEST <b id="title-best">0</b> <span>pts</span></div>
      </section>
      <div id="play-overlay" class="play-overlay" hidden><div class="play-top"><span id="stage-label">平和なオウオ川</span><span id="multiplier">×1.0</span></div><div id="callout" class="callout"></div><div id="combo-banner" class="combo-banner" aria-live="polite"></div><div id="event-banner" class="event-banner"></div><div id="generation" class="generation"></div><div class="river-caption"><span id="river-message">バケツが川に落ちる前にタップ！</span><small id="time-note">川の変化は長い年月を早送りした演出です</small></div><button id="pause" class="pause-button" aria-label="一時停止">Ⅱ</button></div>
      <div id="pause-screen" class="pause-screen screen" hidden><span class="eyebrow">TAKE A BREATH</span><h2>川もちょっと、ひと休み。</h2><p>残り時間は止まっています。</p><button id="resume" class="primary">つづける ↗</button><button id="pause-settings" class="settings-shortcut">音・演出の設定</button></div>
      <div id="finish-screen" class="finish-screen screen" hidden><span>30秒、おつかれオウ！</span><strong>オウオーー！</strong></div>
    </div>
    <div class="cabinet-bottom"><span>● <span id="status-text">平和な川で、待ってるオウ。</span></span><button id="mute" aria-label="音をミュート">♪ ON</button></div>
  </section>
  <aside class="side mood-side"><div class="sticker">OUO!<br><b>OUO! OUO!</b><span>✳</span></div><div class="river-report"><span class="eyebrow">TODAY'S RIVER</span><h3>かわいい。<br>でも、油断禁物。</h3><p>止めるのは、バケツ。<br>川のオウオたちは<br>ただ、暮らしているだけ。</p><span class="report-line"></span><p class="tiny">見逃した先に待つのは、<br>ぬめぬめのカーニバル。</p></div><button class="text-link learn-open">川のほんとの話 <span>↗</span></button><a class="old-game-link" href="./one-shot/index.html">一発オウオ砲はこちら ↗</a></aside>
</main>
<section id="result-screen" class="result-section" hidden aria-labelledby="result-heading"><div class="result-card"><p class="eyebrow">RIVER REPORT / 30 SECONDS LATER</p><h2 id="result-heading">おつかれオウ！</h2><span id="result-title" class="result-title"></span><p class="score-caption">放流阻止スコア <span id="new-best" hidden>NEW BEST!</span></p><strong id="result-score" class="result-score">0</strong><span class="points">POINTS</span><div class="result-stats"><div><b id="result-combo"></b><span>最高コンボ</span></div><div><b id="result-caught"></b><span>放流阻止</span></div><div><b id="result-missed"></b><span>見逃し</span></div></div><div class="panic-box"><div><span>オウオパニック指数</span><small>川のお祭り度。スコアとは別だよ！</small></div><strong id="result-panic"></strong></div><p id="result-comment" class="result-comment"></p><button id="retry" class="primary">もう一回、オウオ！ ↻</button><div class="share-grid"><button id="save-image">↓ 結果画像を保存</button><button id="native-share">↗ 結果をシェア</button><button id="share-x">𝕏 投稿文をつくる</button><button id="copy-url">⌁ URLをコピー</button></div><p id="share-hint" class="tiny">1080 × 1920px・ストーリーズサイズ</p><details id="manual-copy" hidden><summary>投稿文・URLを選択してコピー</summary><textarea id="share-copy" readonly aria-label="共有用テキスト"></textarea></details><button class="learn-open learning-teaser"><span>実は、笑えない話があります。</span><b>この川の「本当」を知る ↗</b></button><button id="back-title" class="text-link">タイトルへ戻る</button></div></section>
<footer><span>GAME IS SILLY. SCIENCE IS SERIOUS.</span><p>ゲームは全力でバカ。でも科学は本気。</p><small>「オウオ」は架空の掛け声です。実際の鳴き声ではありません。</small></footer>
<dialog id="settings-dialog" aria-labelledby="settings-heading"><div class="dialog-top"><span class="eyebrow">MAKE YOURSELF COMFORTABLE</span><button class="dialog-close" aria-label="設定を閉じる">×</button></div><h2 id="settings-heading">オウオの設定</h2><label class="setting-row">音をミュート <input id="mute-setting" type="checkbox"></label><label class="volume-row" for="volume">音量 <output id="volume-value"></output></label><input id="volume" type="range" min="0" max="100" step="5"><label class="setting-row">画面揺れ・動きを軽減 <input id="motion" type="checkbox"></label><p class="tiny">設定はこのブラウザに保存されます。<br>音はスタートを押したあとに再生します。</p></dialog>
<dialog id="learn-dialog" class="learn-dialog" aria-labelledby="learn-heading"><div class="dialog-top"><span class="eyebrow">THE REAL RIVER</span><button class="dialog-close" aria-label="川の話を閉じる">×</button></div><h2 id="learn-heading">オウオは悪くない。<br>川の未来は、私たちに。</h2><p class="learn-lead">実は、笑えない話があります。</p><article><span>01 / WHAT'S HAPPENING</span><h3>何が起きている？</h3><p>日本固有のオオサンショウウオと、人が持ち込んだ外来のオオサンショウウオとの交雑が問題になっています。生きものたちが悪いわけではありません。</p></article><article><span>02 / OVER GENERATIONS</span><h3>交雑するとどうなる？</h3><p>世代を重ねることで、本来の地域個体群が持っていた遺伝的特徴が失われる可能性があります。守りたいのは、生物多様性と地域固有の遺伝的特徴です。</p></article><article><span>03 / LOOKS AREN'T EVERYTHING</span><h3>見た目ではわからない。</h3><p>外見だけで交雑個体を確実に判別することは難しく、遺伝子解析などを含む適切な調査が必要です。遺伝子解析にも、調べる指標や比較資料による限界があります。専門家が複数の情報から判断します。</p></article><article><span>04 / OUR NEXT MOVE</span><h3>勝手に移動させない。放さない。</h3><p>野生動物を勝手に移動させたり、自然へ放したりしないこと。見つけても自分で捕獲・駆除せず、自治体などの専門窓口へ。保全には継続的な調査・管理と専門的な判断が必要です。</p></article><div class="science-note"><strong>このゲームの「増殖」について</strong><p>30秒は、長い年月と世代交代を早送りした誇張表現です。交雑によって必ず個体数が爆発的に増えるわけではありません。色や模様は演出で、在来・外来・交雑を示しません。侵入後の群れは、これらが混在する状況を表しています。</p></div><div class="sources"><h3>もっと知る・出典</h3><a href="https://www.env.go.jp/nature/intro/2outline/attention/chugokuoosanshouo.html" target="_blank" rel="noopener noreferrer">環境省：チュウゴクオオサンショウウオと交雑種 ↗</a><a href="https://www.env.go.jp/nature/intro/2outline/manual/4hp_ryoseirui.pdf" target="_blank" rel="noopener noreferrer">環境省：特定外来生物の同定マニュアル・両生類（PDF）↗</a><a href="https://www.env.go.jp/nature/intro/2outline/invasive.html#sec4" target="_blank" rel="noopener noreferrer">環境省：外来種被害予防三原則 ↗</a><p class="tiny">2026年10月12日に本文を確認。解説は資料をもとにやさしく要約しています。ゲームの数値や色分けは生物学的な測定・判定ではありません。</p></div><button class="primary dialog-close">川にもどる ↗</button></dialog>
<div id="toast" class="toast" role="status" aria-live="polite"></div>`;

const settings = preferences();
const sound = new Sound(settings), renderer = new Renderer($('#game'));
let game: Game | undefined, mode: 'title' | 'playing' | 'finishing' | 'result' = 'title';
let paused = false, finishTime = 0, last = performance.now(), best = bestScore();
let currentResult: Result | undefined, resultLabel = { title: '', comment: '' }, resultImage: Promise<Blob> | undefined;
let comboUntil = 0, calloutUntil = 0, eventUntil = 0, generationUntil = 0, toastTimer: ReturnType<typeof setTimeout>;
const show = (selector: string, visible: boolean) => { $(selector).hidden = !visible; };
const number = (n: number) => n.toLocaleString('ja-JP');
function toast(message: string) { $('#toast').textContent = message; $('#toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 3500); }
function updateSettings() {
  sound.update(settings); saveValue('ouo-settings', settings);
  $('#mute').textContent = settings.muted ? '♪ OFF' : '♪ ON'; $('#mute').setAttribute('aria-label', settings.muted ? '音をオン' : '音をミュート');
  $<HTMLInputElement>('#mute-setting').checked = settings.muted; $<HTMLInputElement>('#motion').checked = settings.reducedMotion;
  $<HTMLInputElement>('#volume').value = String(settings.volume * 100); $('#volume-value').textContent = `${Math.round(settings.volume * 100)}%`;
  document.body.classList.toggle('reduced-motion', settings.reducedMotion);
}
function syncHUD() {
  $('#score').textContent = number(game?.score ?? 0); $('#combo').textContent = game?.combo ? `${game.combo}` : '—';
  $('#timer').innerHTML = `${Math.ceil(game?.remaining ?? 30)}<span> s</span>`;
  $('.timer-block').classList.toggle('urgent', !!game && game.remaining <= 5);
  $('#multiplier').textContent = `×${(game?.multiplier ?? 1).toFixed(1)}`;
  $('#stage-label').textContent = STAGES[game?.stage ?? 0];
}
function start() {
  void sound.unlock(); sound.reset(); game = new Game(); renderer.reset(); paused = false; mode = 'playing'; last = performance.now();
  comboUntil = calloutUntil = eventUntil = generationUntil = 0; document.body.classList.remove('fever');
  $('#callout').textContent = 'バケツを止めろ！！！'; calloutUntil = 2.5; $('#event-banner').textContent = ''; $('#generation').textContent = '';
  show('#title-screen', false); show('#result-screen', false); show('#finish-screen', false); show('#pause-screen', false); show('#play-overlay', true); show('.layout', true);
  $('#river-message').textContent = 'バケツが川に落ちる前にタップ！'; $('#status-text').textContent = '狙うのは、バケツだけ！';
  document.body.classList.add('is-playing'); syncHUD(); $('#game').focus({ preventScroll: true });
  if (matchMedia('(max-width: 760px)').matches) $('.arcade').scrollIntoView({ block: 'start', behavior: 'instant' });
}
function setPaused(value: boolean) {
  if (mode !== 'playing') return; paused = value; last = performance.now(); show('#pause-screen', value); $('#status-text').textContent = value ? 'ひと休み中。' : '狙うのは、バケツだけ！';
  if (value) $('#resume').focus({ preventScroll: true });
}
function handleSignal(signal: Signal) {
  renderer.signal(signal, settings.reducedMotion);
  if (signal.kind === 'hit') {
    sound.cue(signal.combo);
    $('#callout').textContent = signal.combo >= 20 ? 'カーニバァァル！！' : signal.combo >= 10 ? 'サンショウオウオ！' : signal.combo >= 5 ? 'オウオウオ！' : signal.combo > 1 ? 'オウオ！' : 'オウ！';
    calloutUntil = game!.elapsed + .5;
    if (signal.combo % 5 === 0) { $('#combo-banner').textContent = `${signal.combo} COMBO!!`; comboUntil = game!.elapsed + 1.1; }
  }
  if (signal.kind === 'miss') { sound.miss(); $('#river-message').textContent = game!.missed >= 10 ? '川より先に、こっちがパニック。' : 'あっ。オウオがやってきた。'; }
  if (signal.kind === 'generation') { $('#generation').innerHTML = `<strong>${signal.years}年後！</strong><span>世代交代を早送り中</span>`; generationUntil = game!.elapsed + 2.5; }
  if (signal.kind === 'event') { if (signal.event === 'fever') document.body.classList.add('fever'); $('#event-banner').textContent = EVENT_LABELS[signal.event]; eventUntil = game!.elapsed + CONFIG.events.duration; }
  if (signal.kind === 'finish') { mode = 'finishing'; finishTime = 0; show('#play-overlay', false); show('#finish-screen', true); sound.finish(); }
}
function processSignals() { for (const signal of game?.drain() ?? []) handleSignal(signal); }
function finish() {
  mode = 'result'; currentResult = game!.result; resultLabel = resultText(currentResult);
  const newBest = currentResult.score > best; best = Math.max(best, currentResult.score); saveValue('ouo-best', best);
  $('#title-best').textContent = number(best); $('#result-score').textContent = number(currentResult.score); $('#result-title').textContent = resultLabel.title; $('#result-comment').textContent = `「${resultLabel.comment}」`;
  for (const key of ['combo', 'caught', 'missed', 'panic'] as const) $(`#result-${key}`).textContent = number(key === 'combo' ? currentResult.bestCombo : currentResult[key]);
  show('#new-best', newBest); show('.layout', false); show('#result-screen', true); show('#finish-screen', false);
  document.body.classList.remove('is-playing');
  resultImage = imageBlob(resultCanvas(currentResult, resultLabel.title, resultLabel.comment)); resultImage.catch(() => {});
  const canFileShare = typeof navigator.canShare === 'function' && navigator.canShare({ files: [new File([''], 'result.png', { type: 'image/png' })] });
  $('#native-share').textContent = canFileShare ? '↗ 結果をシェア' : '↗ 文章をシェア';
  $('#share-hint').textContent = canFileShare ? '1080 × 1920px・ストーリーズサイズ' : '画像共有に非対応の環境では「結果画像を保存」を使ってね。';
  show('#manual-copy', false); $('#retry').focus({ preventScroll: true }); $('#result-screen').scrollIntoView({ block: 'start', behavior: 'instant' });
}
function returnTitle() {
  mode = 'title'; game = undefined; paused = false; renderer.reset(); syncHUD();
  show('.layout', true); show('#result-screen', false); show('#title-screen', true); show('#play-overlay', false); show('#pause-screen', false); show('#finish-screen', false);
  $('#status-text').textContent = '平和な川で、待ってるオウ。'; document.body.classList.remove('is-playing', 'fever'); $('#start').focus({ preventScroll: true });
}
function frame(now: number) {
  const raw = Math.max(0, (now - last) / 1000); last = now;
  if (mode === 'playing' && !paused) { game!.advance(raw); processSignals(); syncHUD(); if (mode === 'playing') sound.tick(game!.elapsed, game!.combo); }
  if (mode === 'finishing') { finishTime += raw; if (finishTime >= CONFIG.finishDuration) finish(); }
  if (mode !== 'result') renderer.draw(paused ? 0 : Math.min(raw, 0.04), game, settings.reducedMotion, mode === 'title');
  if (game && mode === 'playing') { $('#callout').classList.toggle('visible', game.elapsed < calloutUntil); $('#event-banner').classList.toggle('visible', game.elapsed < eventUntil); $('#generation').classList.toggle('visible', game.elapsed < generationUntil); $('#combo-banner').classList.toggle('visible', game.elapsed < comboUntil); }
  requestAnimationFrame(frame);
}
$('#game').addEventListener('pointerdown', (event) => {
  if (mode !== 'playing' || paused) return; event.preventDefault();
  const rect = $('#game').getBoundingClientRect(); game!.hit((event.clientX - rect.left) / rect.width * CONFIG.width, (event.clientY - rect.top) / rect.height * CONFIG.height); processSignals(); syncHUD();
});
$('#game').addEventListener('keydown', (event) => {
  if (event.code !== 'Space' || event.repeat || mode !== 'playing' || paused) return; event.preventDefault();
  const bucket = [...game!.buckets].filter(b => b.y >= 0).sort((a, b) => b.y - a.y)[0]; if (bucket) { game!.hit(bucket.x, bucket.y); processSignals(); syncHUD(); }
});
$('#start').addEventListener('click', start); $('#retry').addEventListener('click', start);
$('#back-title').addEventListener('click', returnTitle);
$('.brand').addEventListener('click', event => { event.preventDefault(); if (mode === 'playing' || mode === 'finishing') return; returnTitle(); });
$('#pause').addEventListener('click', () => setPaused(true)); $('#resume').addEventListener('click', () => { void sound.unlock(); setPaused(false); $('#game').focus({ preventScroll: true }); });
document.addEventListener('visibilitychange', () => { if (document.hidden) setPaused(true); last = performance.now(); });
$('#mute').addEventListener('click', () => { settings.muted = !settings.muted; void sound.unlock(); updateSettings(); });
$('#mute-setting').addEventListener('change', event => { settings.muted = (event.target as HTMLInputElement).checked; updateSettings(); });
$('#volume').addEventListener('input', event => { settings.volume = Number((event.target as HTMLInputElement).value) / 100; updateSettings(); });
$('#motion').addEventListener('change', event => { settings.reducedMotion = (event.target as HTMLInputElement).checked; updateSettings(); });
$('#pause-settings').addEventListener('click', () => $<HTMLDialogElement>('#settings-dialog').showModal());
$('#settings-open').addEventListener('click', () => { setPaused(true); $<HTMLDialogElement>('#settings-dialog').showModal(); });
for (const button of document.querySelectorAll<HTMLButtonElement>('.learn-open')) button.addEventListener('click', () => { setPaused(true); $<HTMLDialogElement>('#learn-dialog').showModal(); });
for (const button of document.querySelectorAll<HTMLButtonElement>('.dialog-close')) button.addEventListener('click', () => button.closest('dialog')!.close());
async function copyOrShow(text: string) {
  if (await copyText(text)) toast('コピーしたオウ！'); else { $<HTMLTextAreaElement>('#share-copy').value = text; show('#manual-copy', true); $<HTMLDetailsElement>('#manual-copy').open = true; toast('表示された文章を選択してコピーしてね。'); }
}
$('#copy-url').addEventListener('click', () => {
  const url = gameUrl();
  if (url) void copyOrShow(url);
  else toast('ダウンロード版です。このHTMLファイルを渡すと一緒に遊べます。');
});
$('#save-image').addEventListener('click', async () => { try { if (resultImage) { downloadImage(await resultImage); toast('結果画像を保存。スマホでは画像メニューから保存できるよ。'); } } catch { toast('画像を作れませんでした。もう一度試してね。'); } });
$('#native-share').addEventListener('click', async () => {
  if (!currentResult) return;
  const text = shareText(currentResult, resultLabel.title);
  try {
    const blob = resultImage ? await resultImage : undefined;
    const file = blob ? new File([blob], 'ouo-carnival.png', { type: 'image/png' }) : undefined;
    if (file && navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: 'サンショウオウオカーニバル', text });
    else if (navigator.share) await navigator.share({ title: 'サンショウオウオカーニバル', text });
    else await copyOrShow(text);
  } catch (error) { if (!(error instanceof DOMException && error.name === 'AbortError')) toast('共有できませんでした。「結果画像を保存」を使ってね。'); }
});
$('#share-x').addEventListener('click', () => {
  if (!currentResult) return;
  const text = shareText(currentResult, resultLabel.title);
  $<HTMLTextAreaElement>('#share-copy').value = text; show('#manual-copy', true); $<HTMLDetailsElement>('#manual-copy').open = true;
  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  toast('画像は自動添付されません。保存した画像を投稿に追加してね。');
});
window.addEventListener('resize', () => renderer.resize());
$('#title-best').textContent = number(best); updateSettings(); requestAnimationFrame(frame);
// Dev-only deterministic browser inspection. Never included as a public production API.
if (import.meta.env.DEV) Object.defineProperty(window, '__ouo', { value: { get game() { return game; }, get mode() { return mode; }, get paused() { return paused; } } });
