import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const baseURL = process.env.TEST_URL || 'http://127.0.0.1:5173';
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
await fs.mkdir('test-results', { recursive: true });
const errors = [];
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, acceptDownloads: true });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(baseURL); await page.locator('#start').waitFor();
  await page.screenshot({ path: 'test-results/carnival-desktop-title.png', fullPage: true });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  // Real-time session: actual pointer input; no model/time manipulation.
  await page.locator('#start').click();
  const start = Date.now(); let taps = 0;
  while (Date.now() - start < 32_500 && await page.locator('#result-screen').isHidden()) {
    const target = await page.evaluate(() => {
      const game = window.__ouo?.game;
      const b = game?.buckets.find(b => b.y > 40 && b.y < 400);
      const rect = document.querySelector('#game').getBoundingClientRect();
      return b ? { x: rect.left + b.x / 420 * rect.width, y: rect.top + b.y / 640 * rect.height, time: game.elapsed } : undefined;
    });
    if (target) { await page.mouse.click(target.x, target.y); taps++; }
    if (Date.now() - start > 24_000 && Date.now() - start < 24_400) await page.screenshot({ path: 'test-results/carnival-desktop-playing.png' });
    await page.waitForTimeout(60);
  }
  await page.locator('#result-screen').waitFor({ state: 'visible' });
  const duration = Date.now() - start;
  assert.ok(duration >= 30_000 && duration < 34_000, `Unexpected duration ${duration}`);
  assert.ok(taps >= 35, `Only ${taps} taps`);
  assert.equal(await page.locator('#result-missed').innerText(), '0');
  assert.equal(await page.locator('#result-panic').innerText(), '0');
  assert.equal(await page.evaluate(() => document.body.classList.contains('fever')), true);
  assert.ok(Number((await page.locator('#result-score').innerText()).replaceAll(',', '')) > 8000);
  await page.screenshot({ path: 'test-results/carnival-desktop-result.png', fullPage: true });
  const downloadPromise = page.waitForEvent('download'); await page.locator('#save-image').click();
  const download = await downloadPromise; await download.saveAs('test-results/carnival-shared-result.png');
  const bytes = await fs.readFile('test-results/carnival-shared-result.png'); assert.equal(bytes.readUInt32BE(16), 1080); assert.equal(bytes.readUInt32BE(20), 1920);
  await page.locator('#copy-url').click(); await page.locator('#toast.visible').waitFor();
  await page.locator('#result-screen .learn-open').click(); assert.equal(await page.locator('#learn-dialog').isVisible(), true);
  assert.equal(await page.locator('#learn-dialog article').count(), 4); assert.equal(await page.locator('#learn-dialog .sources a').count(), 3); await page.locator('#learn-dialog .primary').click();
  await page.locator('#retry').click(); assert.equal(await page.locator('#score').innerText(), '0');
  await page.locator('#pause').click(); const before = await page.locator('#timer').innerText(); await page.waitForTimeout(1100); assert.equal(await page.locator('#timer').innerText(), before);
  await page.locator('#resume').click();
  // Settings pause and persistence.
  await page.locator('#settings-open').click(); await page.locator('#mute-setting').check(); await page.locator('#motion').check();
  await page.locator('#settings-dialog .dialog-close').click(); await page.reload();
  assert.match(await page.locator('#mute').innerText(), /OFF/); assert.ok(Number((await page.locator('#title-best').innerText()).replaceAll(',', '')) > 8000);
  console.log(`PASS desktop: ${duration}ms round, ${taps} pointer catches, retry, pause, learning, download 1080×1920, saved settings/best`);
  // Mobile touch and deliberate misses with the browser's virtual clock.
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const phone = await mobile.newPage(); phone.on('pageerror', error => errors.push(error.message));
  await phone.clock.install(); await phone.goto(baseURL); await phone.screenshot({ path: 'test-results/carnival-mobile-title.png', fullPage: true });
  assert.equal(await phone.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await phone.locator('#start').tap(); await phone.clock.runFor(1500);
  const target = await phone.evaluate(() => { const b = window.__ouo.game.buckets.find(b => b.y > 20); const r = document.querySelector('#game').getBoundingClientRect(); return { x: r.left + b.x / 420 * r.width, y: r.top + b.y / 640 * r.height }; });
  await phone.touchscreen.tap(target.x, target.y); await phone.touchscreen.tap(target.x, target.y);
  assert.equal(await phone.locator('#score').innerText(), '100');
  await phone.clock.runFor(24500); await phone.screenshot({ path: 'test-results/carnival-mobile-fever.png', fullPage: true });
  assert.ok(await phone.evaluate(() => window.__ouo.game.years > 0));
  await phone.clock.runFor(6000); assert.equal(await phone.locator('#result-screen').isVisible(), true);
  assert.ok(Number(await phone.locator('#result-panic').innerText()) > 300);
  await phone.screenshot({ path: 'test-results/carnival-mobile-result.png', fullPage: true });
  await phone.evaluate(() => { window.ouoShare = null; Object.defineProperty(navigator, 'canShare', { value: () => true, configurable: true }); Object.defineProperty(navigator, 'share', { value: async data => { window.ouoShare = {text:data.text, type:data.files[0].type, size:data.files[0].size}; }, configurable: true }); });
  await phone.locator('#native-share').tap(); await phone.waitForFunction(() => window.ouoShare !== null, null, {polling:50}); const shared = await phone.evaluate(() => window.ouoShare); assert.equal(shared.type,'image/png'); assert.ok(shared.size > 10000);
  await phone.locator('#retry').tap(); assert.equal(await phone.locator('#score').innerText(), '0');
  assert.equal(await phone.evaluate(() => document.querySelector('#game').getBoundingClientRect().bottom <= innerHeight), true);
  console.log('PASS mobile: 390px layout, touch, duplicate prevention, carnival misses, result, share fallback, retry');
  // Narrow 320px layout and local storage failure remain playable.
  const narrow = await browser.newPage({ viewport: { width: 320, height: 740 }, isMobile: true, hasTouch: true });
  await narrow.addInitScript(() => { Storage.prototype.setItem = () => { throw new DOMException('Blocked', 'SecurityError'); }; Storage.prototype.getItem = () => { throw new DOMException('Blocked', 'SecurityError'); }; });
  await narrow.goto(baseURL); await narrow.locator('#start').tap();
  assert.equal(await narrow.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await narrow.screenshot({ path: 'test-results/carnival-mobile-320.png', fullPage: true });
  console.log('PASS narrow 320px + unavailable localStorage');
  const tablet = await browser.newPage({viewport:{width:1024,height:768},isMobile:true,hasTouch:true}); await tablet.goto(baseURL); await tablet.locator('#start').tap(); assert.equal(await tablet.evaluate(() => document.documentElement.scrollWidth > innerWidth),false); await tablet.close();
  const archive = await browser.newPage(); await archive.goto(new URL('./one-shot/index.html',baseURL.endsWith('/')?baseURL:`${baseURL}/`).href); await archive.locator('#hold').waitFor(); console.log('PASS iPad landscape and preserved one-shot game');
  assert.deepEqual(errors, [], 'Browser JavaScript errors');
  await fs.writeFile('test-results/carnival-browser-summary.json', JSON.stringify({ realRoundMs: duration, pointerCatches: taps, errors, mobile: 'passed', resultImage: '1080x1920' }, null, 2));
} finally { await browser.close(); }
