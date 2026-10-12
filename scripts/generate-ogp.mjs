import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
try {
  const page = await browser.newPage(); await page.goto(process.env.TEST_URL || 'http://127.0.0.1:5173'); await page.evaluate(() => document.fonts.ready);
  const png = await page.evaluate(async () => {
    const { ouo } = await import('/src/art.ts');
    const canvas = document.createElement('canvas'); canvas.width = 1200; canvas.height = 630; const c = canvas.getContext('2d');
    c.fillStyle = '#f8f4df'; c.fillRect(0, 0, 1200, 630);
    c.fillStyle = '#a7d9c3'; c.fillRect(820, 0, 380, 630);
    c.strokeStyle = '#203e35'; c.lineWidth = 3; c.strokeRect(22, 22, 1156, 586);
    const text = (value, x, y, size) => { c.fillStyle = '#203e35'; c.font = `900 ${size}px sans-serif`; c.fillText(value, x, y); };
    text('OUO! RIVER ARCADE / 30 SEC CHALLENGE', 68, 94, 18);
    text('サンショウオウオ', 60, 203, 65); text('カーニバル', 57, 316, 100); text('オウオ大増殖パニック', 69, 379, 32);
    c.fillStyle = '#f78858'; c.beginPath(); c.roundRect(64, 448, 558, 86, 18); c.fill(); c.stroke(); text('バケツを止めろ！！！', 95, 505, 38);
    ouo(c, 973, 177, 2.8, '#839575', -0.15, 0, true); ouo(c, 918, 371, 3.2, '#a5ac7f', 0.15, 0, true); ouo(c, 1070, 555, 2.4, '#8c9673', -0.15, 0, true);
    return canvas.toDataURL('image/png').split(',')[1];
  });
  await fs.writeFile('public/ogp.png', Buffer.from(png, 'base64')); console.log('Generated public/ogp.png (1200×630)');
} finally { await browser.close(); }
