import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base=process.env.TEST_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
const errors=[];
try{
 const page=await browser.newPage({viewport:{width:375,height:667},isMobile:true,hasTouch:true,acceptDownloads:true});page.on('pageerror',e=>errors.push(e.message));await page.clock.install();await page.goto(base);
 assert.equal(await page.evaluate(()=>'__ouo' in window),false);
 await page.locator('#start').tap();await page.clock.runFor(1400);await page.locator('#game').focus();await page.keyboard.press('Space');assert.equal(await page.locator('#score').innerText(),'100');
 assert.ok(await page.evaluate(()=>document.querySelector('#game').getBoundingClientRect().bottom<=innerHeight));
 await page.clock.runFor(25000);assert.equal(await page.evaluate(()=>document.body.classList.contains('fever')),true);await page.screenshot({path:'test-results/carnival-production-fever.png',fullPage:true});
 await page.clock.runFor(6000);assert.equal(await page.locator('#result-screen').isVisible(),true);assert.ok(Number(await page.locator('#result-missed').innerText())>45);assert.ok(Number(await page.locator('#result-panic').innerText())>500);
 const downloadPromise=page.waitForEvent('download');await page.locator('#save-image').tap();const download=await downloadPromise;await download.saveAs('test-results/carnival-production-result.png');const image=await fs.readFile('test-results/carnival-production-result.png');assert.equal(image.readUInt32BE(16),1080);assert.equal(image.readUInt32BE(20),1920);
 await page.locator('#result-screen .learn-open').tap();assert.equal(await page.locator('#learn-dialog article').count(),4);assert.equal(await page.locator('#learn-dialog .sources a').count(),3);await page.locator('#learn-dialog .primary').tap();
 const popups=[];await page.evaluate(()=>{window.capturedPopup='';window.open=url=>{window.capturedPopup=url;return null;};});await page.locator('#share-x').tap();const intent=await page.evaluate(()=>window.capturedPopup);assert.match(new URL(intent).searchParams.get('text'),/サンショウオウオカーニバル/);
 await page.locator('#retry').tap();assert.equal(await page.locator('#score').innerText(),'0');
 await page.locator('#pause').tap();await page.locator('#pause-settings').tap();assert.equal(await page.locator('#settings-dialog').isVisible(),true);await page.locator('#settings-dialog .dialog-close').tap();await page.locator('#resume').tap();
 const archive=await browser.newPage();await archive.goto(new URL('./one-shot/index.html',base.endsWith('/')?base:`${base}/`).href);await archive.locator('#hold').waitFor();
 assert.deepEqual(errors,[]);console.log('PASS production: mobile scoring, late fever, 30-second finish, stats, 1080×1920 PNG, science, X text, retry, pause settings, preserved one-shot, no dev hook/errors');
}finally{await browser.close();}
