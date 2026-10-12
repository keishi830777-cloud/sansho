import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 375, height: 667 }, isMobile: true, hasTouch: true });
  page.on('pageerror', e => errors.push(e.message)); await page.clock.install(); await page.goto(process.env.TEST_URL || 'http://127.0.0.1:4173');
  assert.equal(await page.evaluate(() => '__ouo' in window), false);
  const image = await page.request.get(new URL('/ogp.png', page.url()).href); assert.equal(image.status(), 200); const png = await image.body(); assert.equal(png.readUInt32BE(16), 1200); assert.equal(png.readUInt32BE(20), 630);
  await page.locator('#start').tap(); await page.clock.runFor(1600);
  assert.equal(await page.evaluate(() => document.querySelector('#game').getBoundingClientRect().bottom <= innerHeight), true);
  await page.locator('#game').focus(); await page.keyboard.press('Space'); assert.equal(await page.locator('#score').innerText(), '100');
  await page.clock.runFor(31000); await page.locator('#result-screen').waitFor({ state: 'visible' });
  assert.ok(Number(await page.locator('#result-missed').innerText()) > 35);
  await page.locator('#result-screen .learn-open').tap(); assert.equal(await page.locator('#learn-dialog .sources a').count(), 3);
  await page.locator('#learn-dialog .primary').tap();
  const downloadPromise = page.waitForEvent('download'); await page.locator('#save-image').tap(); const download = await downloadPromise; assert.equal(download.suggestedFilename(), 'ouo-carnival-result.png');
  await page.screenshot({ path: 'test-results/production-mobile-result.png', fullPage: true });
  // Native sharing success and cancellation branches, with a stubbed OS share sheet.
  await page.evaluate(() => { window.shared = []; Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true }); Object.defineProperty(navigator, 'share', { configurable: true, value: async data => { window.shared.push({ files: data.files.map(f => ({ size: f.size, type: f.type })), text: data.text }); } }); });
  await page.locator('#native-share').tap();
  const shared = await page.evaluate(() => window.shared[0]); assert.ok(shared.files[0].size > 10000); assert.equal(shared.files[0].type, 'image/png'); assert.match(shared.text, /サンショウオウオ/);
  await page.evaluate(() => { Object.defineProperty(navigator, 'share', { configurable: true, value: async () => { throw new DOMException('Cancelled', 'AbortError'); } }); });
  await page.locator('#native-share').tap();
  assert.deepEqual(errors, []);
  console.log('PASS production: 375×667 viewport fits, keyboard scoring, 30s finish, learning sources, PNG/OGP, native file-share payload and cancel (stubbed), no dev hook/errors');
  // Canvas workload measurement in this container, not a real-phone FPS guarantee.
  const perf = await browser.newPage(); await perf.goto('http://127.0.0.1:5173');
  const sample = await perf.evaluate(async () => {
    const { Renderer } = await import('/src/renderer.ts'); const { Game } = await import('/src/game.ts');
    const canvas = document.createElement('canvas'); const renderer = new Renderer(canvas), game = new Game(() => .2); game.advance(26);
    for (const signal of game.drain()) renderer.signal(signal, false);
    for (let i = 0; i < 20; i++) renderer.draw(1/60, game, false);
    const times = []; for (let i = 0; i < 120; i++) { const start = performance.now(); renderer.draw(1/60, game, false); times.push(performance.now()-start); }
    times.sort((a,b)=>a-b); return { creatures: renderer.creatures.length, frames: 120, meanMs: times.reduce((a,b)=>a+b,0)/times.length, p95Ms: times[114] };
  });
  assert.equal(sample.creatures, 78); await fs.writeFile('test-results/performance.json', JSON.stringify(sample, null, 2)); console.log('Canvas workload:', sample);
} finally { await browser.close(); }
