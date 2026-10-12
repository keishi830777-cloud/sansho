import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
try {
  const page = await browser.newPage(); await page.goto(process.env.TEST_URL || 'http://127.0.0.1:5173'); await page.evaluate(() => document.fonts.ready);
  const png = await page.evaluate(async () => {
    const { ouo } = await import('/src/art.ts');
    const canvas = document.createElement('canvas'); canvas.width = 1200; canvas.height = 630; const c = canvas.getContext('2d');
    c.fillStyle = '#18291e'; c.fillRect(0, 0, 1200, 630);
    const text = (value, x, y, size, color = '#f4f1e5') => { c.fillStyle = color; c.font = `900 ${size}px sans-serif`; c.fillText(value, x, y); };
    text('サンショウオウオカーニバル / VOL. 02', 60, 80, 23);
    text('指を離すと、', 52, 219, 78); text('宇宙が始まる。', 49, 338, 94, '#dfff74');
    c.fillStyle = '#ff9acb'; c.beginPath(); c.roundRect(57, 419, 540, 85, 14); c.fill(); text('一発オウオ砲', 85, 478, 45, '#18291e');
    text('押してためろ。ピンクになったら、離せ。', 61, 566, 23);
    for (let i = 0; i < 7; i++) ouo(c, 850 + i%2*220, 100+i*74, 1.4, ['#dfff74','#ff9acb','#8fe4c2'][i%3], -.3+i*.07, 0, true);
    return canvas.toDataURL('image/png').split(',')[1];
  });
  await fs.writeFile('public/ogp.png', Buffer.from(png, 'base64')); console.log('Generated new OGP 1200×630');
} finally { await browser.close(); }
