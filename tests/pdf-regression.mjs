import {chromium,_electron as electron,expect} from '@playwright/test';
import fs from 'node:fs/promises';import path from 'node:path';
import {spawn} from 'node:child_process';
const native=process.argv.includes('--desktop');const base=process.env.BLACKWIRE_TEST_URL||'http://127.0.0.1:5187/';
let browser,app,server;
const qa='data/qa/pdf-regression';await fs.mkdir(qa,{recursive:true});
try{
 if(!native&&!process.env.BLACKWIRE_TEST_URL){server=spawn(process.execPath,['scripts/preview-web.mjs'],{stdio:'pipe',windowsHide:true});await new Promise((r,j)=>{server.stdout.once('data',r);server.once('error',j);server.once('exit',()=>j(new Error('Preview exited before startup')));});}
 let page;
 if(native){app=await electron.launch({executablePath:process.env.BLACKWIRE_PACKAGED_DIR?path.join(process.env.BLACKWIRE_PACKAGED_DIR,'Black Wire Technical Reference Guide.exe'):path.resolve('node_modules/electron/dist/electron.exe'),args:process.env.BLACKWIRE_PACKAGED_DIR?[]:[process.cwd()],env:{...process.env,BLACKWIRE_TEST_DATA:path.resolve(qa,'native-'+Date.now())}});page=await app.firstWindow();}
 else{browser=await chromium.launch();page=await browser.newPage({viewport:{width:1440,height:1000},hasTouch:true});await page.goto(base);}
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await expect(page.getByRole('heading',{name:/Board library/})).toBeVisible();
 const catalog=await page.evaluate(()=>fetch('catalog.json').then(r=>r.json()));
 async function openPDF(file){
  if(await page.getByRole('dialog').count())await page.keyboard.press('Escape');
  const b=catalog.boards.find(b=>b.assets.some(a=>a.file===file));const a=b.assets.find(a=>a.file===file);
  const search=page.getByRole('combobox',{name:'Search boards and references'});await search.fill(b.name);
  await page.getByLabel('Global search scope').selectOption('boards');
  await page.getByRole('option').filter({has:page.locator('b').filter({hasText:b.name})}).first().click();
  await page.locator('.asset-item').filter({has:page.locator('b',{hasText:a.label})}).first().click();
  await expect(page.locator('canvas[data-rendered=true]')).toBeVisible({timeout:30000});
 }
 const rotated='media/a78ee2f448e2394780b52278bf0d08482105556a662e4b74f26f067fd24b671e.pdf';
 await openPDF(rotated);
 expect(await page.locator('canvas').evaluate(c=>c.width>c.height)).toBe(true);
 await page.getByRole('button',{name:'Rotate image'}).click();
 await expect.poll(()=>page.locator('canvas').evaluate(c=>c.width<c.height)).toBe(true);
 await page.getByRole('button',{name:'Fit image'}).click();await expect.poll(()=>page.locator('canvas').evaluate(c=>c.width>c.height)).toBe(true);
 const pdf='media/8fbfbf3ba4d08edc93ad5da3b4e18e0edc8690d92f690b1cc7895d9f085ef28f.pdf';
 await openPDF(pdf);
 await page.getByRole('spinbutton',{name:'PDF page number'}).fill('4');await page.getByRole('button',{name:'Go',exact:true}).click();
 await expect(page.getByRole('status')).toHaveText('Page 4 of 8');await expect.poll(()=>page.locator('canvas').evaluate(c=>c.width>c.height)).toBe(true);
 for(let i=0;i<6;i++){await page.getByRole('button',{name:'Zoom in',exact:true}).click();await page.getByRole('button',{name:i%2?'Previous page':'Next page'}).click();await page.getByRole('button',{name:'Rotate image'}).click();}
 await expect(page.locator('canvas[data-rendered=true]')).toBeVisible({timeout:30000});await expect(page.getByRole('alert')).toHaveCount(0);
 await page.getByRole('button',{name:'Zoom in',exact:true}).evaluate(el=>{for(let i=0;i<20;i++)el.click()});
 await expect(page.locator('canvas[data-rendered=true]')).toBeVisible({timeout:30000});
 const dimensions=await page.locator('canvas').evaluate(c=>({w:c.width,h:c.height}));expect(dimensions.w*dimensions.h).toBeLessThanOrEqual(16000000);expect(Math.max(dimensions.w,dimensions.h)).toBeLessThanOrEqual(8192);
 await page.getByRole('button',{name:'Fit image'}).click();
 if(!native){
  await page.setViewportSize({width:390,height:844});
  await page.getByRole('spinbutton',{name:'PDF page number'}).fill('1');await page.getByRole('button',{name:'Go',exact:true}).click();
  await expect(page.locator('canvas[data-rendered=true]')).toBeVisible();
  const scroller=page.locator('.pdf-scroll');await scroller.scrollIntoViewIfNeeded();
  const box=await scroller.boundingBox();const cdp=await page.context().newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+100,y:box.y+box.height-20}]});
  for(let i=1;i<=5;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:box.x+100,y:box.y+box.height-20-i*30}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await expect.poll(()=>scroller.evaluate(el=>el.scrollTop)).toBeGreaterThan(0);
  await expect(page.getByRole('button',{name:'Next page'})).toBeInViewport();
  await page.screenshot({path:qa+'/mobile.png'});
  await page.keyboard.press('Escape');
  let fail=true;await page.route('**/'+pdf,route=>fail?route.fulfill({status:503,body:'test failure'}):route.continue());
  const b=catalog.boards.find(b=>b.assets.some(a=>a.file===pdf));await page.goto(base+'?board='+b.id);
  await page.locator('.asset-item').filter({has:page.locator('small',{hasText:'PDF'})}).first().click();
  await expect(page.getByRole('alert')).toContainText('could not load');fail=false;
  await page.getByRole('button',{name:'Retry PDF'}).click();await expect(page.locator('canvas[data-rendered=true]')).toBeVisible({timeout:30000});await expect(page.getByRole('alert')).toHaveCount(0);
 }
 expect(errors).toEqual([]);console.log(JSON.stringify({passed:true,native,dimensions,checks:['intrinsic page rotation','page jump','rapid zoom/rotate/page changes','bounded canvas memory',...native?[]:['mobile touch scroll','visible page controls','failed request and retry']]}));
}finally{await browser?.close();await app?.close();server?.kill();}
