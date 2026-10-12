import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base = process.env.TEST_URL || 'http://127.0.0.1:5173';
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
await fs.mkdir('test-results', { recursive: true }); const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  page.on('pageerror', e => errors.push(e.message)); await page.goto(base); await page.locator('#hold').waitFor();
  await page.screenshot({ path: 'test-results/v2-desktop-ready.png', fullPage: true });
  const hold = await page.locator('#hold').boundingBox();
  await page.mouse.move(hold.x + hold.width / 2, hold.y + hold.height / 2); await page.mouse.down();
  const start = Date.now(); let chargeScreenshot = false;
  while (Date.now() - start < 5000) {
    const p = Number(await page.locator('#pressure').getAttribute('aria-valuenow'));
    if (p >= 95) break;
    if (p >= 60 && !chargeScreenshot) { chargeScreenshot = true; await page.screenshot({ path: 'test-results/v2-charging.png' }); }
    await page.waitForTimeout(20);
  }
  await page.mouse.up(); assert.equal(await page.locator('#flight-label').isVisible(), true);
  await page.waitForTimeout(700); await page.screenshot({ path: 'test-results/v2-flight.png' });
  await page.locator('#result').waitFor({ state: 'visible', timeout: 12000 });
  assert.ok(Number((await page.locator('#result-score').innerText()).replaceAll(',', '')) > 1500);
  assert.match(await page.locator('#result-rank').innerText(), /限界寸前/);
  await page.screenshot({ path: 'test-results/v2-desktop-result.png', fullPage: true });
  const downloadPromise = page.waitForEvent('download'); await page.locator('#save').click(); const download = await downloadPromise; await download.saveAs('test-results/v2-result.png');
  const png = await fs.readFile('test-results/v2-result.png'); assert.equal(png.readUInt32BE(16), 1080); assert.equal(png.readUInt32BE(20), 1920);
  await page.locator('#settings').click(); await page.locator('#audio-setting').uncheck(); await page.locator('#motion').check(); await page.locator('#close-settings').click(); await page.reload();
  assert.equal(await page.locator('#mute').innerText(), '♪ OFF'); assert.ok(Number((await page.locator('#best').innerText()).replaceAll(',', '')) > 1500);
  console.log('PASS desktop real pointer: near-limit launch, altitude/score, PNG 1080×1920, saved mute/motion/best');
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const phone = await context.newPage(); phone.on('pageerror', e => errors.push(e.message)); await phone.clock.install(); await phone.goto(base);
  await phone.screenshot({ path: 'test-results/v2-mobile-ready.png', fullPage: true });
  assert.equal(await phone.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  const cdp = await context.newCDPSession(phone);
  const h = await phone.locator('#hold').boundingBox(); const x = h.x + h.width / 2, y = h.y + h.height / 2;
  assert.ok(y < 844);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  await phone.clock.runFor(230); await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + 55, y }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await phone.clock.runFor(1500);
  assert.equal(await phone.locator('#result-title').innerText(), 'ぴょ。');
  await phone.locator('#retry').tap();
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await phone.clock.runFor(7000);
  assert.equal(await phone.locator('#result-title').innerText(), 'オウオ、決壊。'); assert.equal(await phone.locator('#result-score').innerText(), '0');
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await phone.screenshot({ path: 'test-results/v2-mobile-bust.png', fullPage: true });
  await phone.locator('#retry').tap();
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await phone.clock.runFor(1700);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] }); assert.equal(await phone.locator('#ready').isVisible(), true); assert.equal(await phone.locator('#result').isVisible(), false);
  // Perfect keyboard shot on the same engine, using only visible feedback.
  await phone.locator('#hold').focus(); await phone.keyboard.down('Space');
  for (let i = 0; i < 250; i++) { await phone.clock.runFor(20); if (Number(await phone.locator('#pressure').getAttribute('aria-valuenow')) >= 95) break; }
  await phone.keyboard.up('Space'); await phone.clock.runFor(9000); assert.equal(await phone.locator('#result').isVisible(), true);
  assert.match(await phone.locator('#result-rank').innerText(), /限界寸前/);
  await phone.screenshot({ path: 'test-results/v2-mobile-result.png', fullPage: true });
  await phone.evaluate(() => { window.shared = null; Object.defineProperty(navigator, 'canShare', { value: () => true, configurable: true }); Object.defineProperty(navigator, 'share', { value: async data => { window.shared = { text: data.text, type: data.files[0].type, size: data.files[0].size }; }, configurable: true }); });
  await phone.locator('#share').tap(); await phone.waitForFunction(() => window.shared !== null, null, { polling: 50 }); const shared = await phone.evaluate(() => window.shared); assert.equal(shared.type, 'image/png'); assert.ok(shared.size > 10000); assert.match(shared.text, /サンショウオウオ/);
  console.log('PASS mobile touch: early release, steering, overcharge, cancel, retry, perfect keyboard shot, native PNG payload (stubbed)');
  for (const viewport of [{width:320,height:568},{width:375,height:667},{width:1024,height:768}]) {
    const small = await browser.newPage({viewport,isMobile:true,hasTouch:true}); small.on('pageerror',e=>errors.push(e.message)); await small.goto(base);
    assert.equal(await small.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    const button = await small.locator('#hold').boundingBox(); assert.ok(button.y + button.height <= viewport.height, JSON.stringify({viewport,button})); await small.close();
  }
  console.log('PASS viewport 320×568 / 375×667 / iPad landscape 1024×768');
  assert.deepEqual(errors, []); console.log('PASS no JavaScript errors');
} finally { await browser.close(); }
