import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
const html = await readFile('.pages/index.html');
const server = createServer((req, res) => {
  if (req.url === '/sansho/') { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(html); }
  else { res.writeHead(404); res.end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const errors = [], requests = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', r => { if (r.url().startsWith('http') && !r.url().startsWith(origin)) requests.push(r.url()); });
  await page.clock.install();
  await page.goto(`${origin}/sansho/`);
  await page.locator('#start').tap(); await page.clock.runFor(1600);
  await page.locator('#game').focus(); await page.keyboard.press('Space');
  assert.equal(await page.locator('#score').innerText(), '100');
  await page.clock.runFor(31000);
  assert.equal(await page.locator('#result-screen').isVisible(), true);
  await page.locator('#copy-url').tap();
  await page.waitForFunction(() => document.querySelector('#toast').textContent.includes('コピー'));
  const downloadPromise = page.waitForEvent('download'); await page.locator('#save-image').tap();
  const download = await downloadPromise; assert.equal(download.suggestedFilename(), 'ouo-carnival-result.png');
  await page.locator('#retry').tap(); assert.equal(await page.locator('#score').innerText(), '0');
  assert.deepEqual(errors, []); assert.deepEqual(requests, []);
  console.log('PASS standalone: subpath hosting startup, scoring, 30-second finish, result PNG, retry, no external requests or JS errors');
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
