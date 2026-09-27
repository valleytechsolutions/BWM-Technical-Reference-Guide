// Recaptures the README and documentation screenshots from the browser edition.
// Requires a current `pnpm build:web`. Writes to docs/screenshots.
import {chromium} from '@playwright/test';
import {spawn} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
process.chdir(root);
const url='http://127.0.0.1:5187/';
const out=name=>path.join('docs/screenshots',name);

// Waits until every image currently in the viewport (including open dialogs) has decoded.
async function settle(page){
 await page.waitForFunction(()=>[...document.images].filter(i=>{const r=i.getBoundingClientRect();return r.width&&r.bottom>0&&r.top<innerHeight;}).every(i=>i.complete&&i.naturalWidth>0),null,{timeout:30000});
 // A dialog focuses its first control on open; drop that ring so it doesn't read as a hover state.
 await page.evaluate(()=>document.activeElement?.blur());
 await page.waitForTimeout(400);
}
async function open(page,query=''){
 await page.goto(url+query);
 await page.locator('.page-header,.makers-hero,.devices-hero').first().waitFor();
 await settle(page);
}
async function navigate(page,label){
 await page.locator('.sidebar nav button,.about-nav').filter({hasText:label}).first().click();
 await page.evaluate(()=>scrollTo(0,0));await settle(page);
}

const server=spawn(process.execPath,['scripts/preview-web.mjs'],{stdio:'pipe'});
await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('exit',()=>reject(new Error('Preview server exited; run pnpm build:web first.')));});
const browser=await chromium.launch();
try{
 const context=await browser.newContext({viewport:{width:1440,height:1000}});
 const page=await context.newPage();

 await open(page);await page.screenshot({path:out('library.png')});
 await page.getByRole('combobox',{name:'Search boards and references'}).fill('ESP32-C5');
 await page.locator('.global-search-panel').waitFor();await settle(page);await page.screenshot({path:out('browser-guide.png')});
 await page.keyboard.press('Escape');

 await open(page);await navigate(page,'Devices');await page.screenshot({path:out('devices-iot.png')});
 await navigate(page,'Displays');await page.screenshot({path:out('makers.png')});
 await navigate(page,'Power desk');await page.screenshot({path:out('power-desk.png')});
 await navigate(page,'About the guide');await page.screenshot({path:out('about.png')});

 await open(page,'?board=pjrc-teensy-teensy-4-1');await page.getByRole('dialog').waitFor();await settle(page);
 await page.screenshot({path:out('pinout-viewer.png')});

 await open(page,'?tab=makers&part=maker-dfrobot-8e4275476361');await page.getByRole('dialog').waitFor();
 await page.locator('.maker-image-stage').scrollIntoViewIfNeeded();await page.locator('.maker-image-stage').evaluate(e=>e.scrollIntoView({block:'center'}));
 await settle(page);await page.screenshot({path:out('maker-gallery.png')});

 const light=await browser.newContext({viewport:{width:1440,height:1000}});
 await light.addInitScript(()=>localStorage.setItem('blackwire-theme','light'));
 const lightPage=await light.newPage();await open(lightPage);await lightPage.screenshot({path:out('light-mode.png')});await light.close();

 const compact=await browser.newContext({viewport:{width:1265,height:712}});
 const compactPage=await compact.newPage();await open(compactPage,'?board=lattepanda-iota');await compactPage.getByRole('dialog').waitFor();
 await compactPage.locator('.asset-item').filter({hasText:'GPIO header'}).click();await settle(compactPage);
 await compactPage.screenshot({path:out('lattepanda-reference.png')});await compact.close();

 // Release-highlight dialogs used in the README, at the same compact size.
 for(const [name,board,theme] of [['nanopi-reference.png','friendlyelec-nanopi-neo','dark'],['inland-reference.png','inland-support-652','dark'],['mosaico-reference.png','espressif-esp-mosaico','light']]){
  const highlight=await browser.newContext({viewport:{width:1265,height:712}});
  await highlight.addInitScript(value=>localStorage.setItem('blackwire-theme',value),theme);
  const highlightPage=await highlight.newPage();await open(highlightPage,'?board='+board);await highlightPage.getByRole('dialog').waitFor();await settle(highlightPage);
  await highlightPage.screenshot({path:out(name)});await highlight.close();
 }

 console.log('Screenshots written to docs/screenshots.');
}finally{await browser.close();server.kill();}
