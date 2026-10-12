import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
try {
 const page=await browser.newPage();await page.goto(process.env.TEST_URL||'http://127.0.0.1:5173');await page.evaluate(()=>document.fonts.ready);
 const png=await page.evaluate(async()=>{
  const {ouo,bucket}=await import('/src/carnival/art.ts');const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=630;const c=canvas.getContext('2d');
  c.fillStyle='#fff0bc';c.fillRect(0,0,1200,630);c.fillStyle='#86deca';c.fillRect(760,0,440,630);
  const text=(s,x,y,size,color='#215653')=>{c.fillStyle=color;c.font=`1000 ${size}px sans-serif`;c.fillText(s,x,y);};
  text('30秒で、オウオ大増殖パニック。',55,87,25);text('サンショウオウオ',47,222,68);text('カーニバル',43,338,103,'#ed633e');
  c.fillStyle='#ffdb59';c.beginPath();c.roundRect(55,415,620,100,18);c.fill();text('バケツを止めろ！！！',81,483,43);
  text('オウ！オウオ！カーニバァァル！！',55,572,24);
  for(let i=0;i<10;i++)ouo(c,790+i%3*170,220+Math.floor(i/3)*120,1.5,['#8b986c','#a7a474','#7e987b'][i%3],(i%3-1)*.13,0,true);
  bucket(c,880,95,-.15);bucket(c,1100,95,.2);
  return canvas.toDataURL('image/png').split(',')[1];
 });await fs.writeFile('public/ogp.png',Buffer.from(png,'base64'));process.stdout.write('Generated carnival OGP 1200×630\n');
}finally{await browser.close();}
