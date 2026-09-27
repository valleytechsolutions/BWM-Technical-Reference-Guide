import {chromium,expect} from '@playwright/test';
import {spawn} from 'node:child_process';
import fs from 'node:fs/promises';
import {articles} from '../data/wiki.mjs';
const live=process.env.BLACKWIRE_TEST_URL;
const base=process.env.BLACKWIRE_BASE_PATH||'/';
const url=live||'http://127.0.0.1:5187'+base;
let browser,server;
const qa='data/qa/theme';
try{
 if(!live){server=spawn(process.execPath,['scripts/preview-web.mjs'],{stdio:'pipe',windowsHide:true,env:process.env});await new Promise((r,j)=>{server.stdout.once('data',r);server.once('error',j);server.once('exit',()=>j(new Error('Preview exited')));});}
 await fs.mkdir(qa,{recursive:true});
 browser=await chromium.launch();const context=await browser.newContext({viewport:{width:1440,height:1000}});const page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url);await expect(page.getByRole('heading',{name:/Board library/})).toBeVisible();
 await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 await expect(page.getByRole('button',{name:'Dark mode',exact:true})).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('.logo-tile .brand-dark')).toBeVisible();await expect(page.locator('.logo-tile .brand-light')).toBeHidden();
 await expect(page.locator('.guide-title')).toHaveText('Black Wire');
 await expect(page.locator('body')).not.toContainText('THE MAKER’S FIELD GUIDE');
 await page.screenshot({path:`${qa}/${live?'live-':''}dark-library.png`});
 await page.getByRole('button',{name:'Light mode',exact:true}).click();await page.reload();
 await expect(page.getByRole('heading',{name:/Board library/})).toBeVisible();await expect(page.locator('html')).toHaveAttribute('data-theme','light');
 await expect(page.locator('.logo-tile .brand-light')).toBeVisible();await expect(page.locator('.logo-tile .brand-dark')).toBeHidden();
 await page.screenshot({path:`${qa}/light-library.png`});
 const second=await context.newPage();await second.goto(url);await second.getByRole('button',{name:'Dark mode',exact:true}).click();
 await expect(page.locator('html')).toHaveAttribute('data-theme','dark');await second.close();
 await page.keyboard.press('Control+k');await expect(page.getByRole('combobox',{name:'Search boards and references'})).toBeFocused();
 await page.getByRole('combobox',{name:'Search boards and references'}).fill('BME280');await page.getByLabel('Global search scope').selectOption('makers');
 await page.screenshot({path:`${qa}/dark-search.png`});await page.keyboard.press('Enter');
 await expect(page.getByRole('dialog')).toBeVisible();await expect(page.locator('.maker-image-stage img')).toHaveCSS('filter','none');
 await expect(page.locator('.maker-image-stage img')).toHaveCSS('mix-blend-mode','normal');
 await page.locator('.pin-reference').scrollIntoViewIfNeeded();await page.screenshot({path:`${qa}/dark-pin-reference.png`});await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'Clear search',exact:true}).click();await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'Power desk',exact:false}).first().click();await page.screenshot({path:`${qa}/dark-power.png`});
 await page.getByRole('button',{name:'About the guide',exact:true}).click();await page.screenshot({path:`${qa}/dark-about.png`});
 for(const theme of ['dark','light']){
  await page.goto(url);await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:theme==='dark'?'Dark mode':'Light mode',exact:true}).click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`${qa}/${theme}-mobile.png`});
 }
 const restricted=await browser.newContext();await restricted.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Blocked','SecurityError');}});});
 const blocked=await restricted.newPage();await blocked.goto(url);await blocked.getByRole('button',{name:'Light mode',exact:true}).click();
 await expect(blocked.locator('html')).toHaveAttribute('data-theme','light');await expect(blocked.locator('.theme-storage-note')).toContainText('this visit');await restricted.close();
 const crawler=await browser.newContext({javaScriptEnabled:false});const staticPage=await crawler.newPage();await staticPage.goto(url);
 await expect(staticPage.getByRole('heading',{level:1})).toHaveText("The Black Wire Maker's Technical Reference Guide");
 await staticPage.goto(url+'wiki/');await expect(staticPage.getByRole('heading',{level:1})).toHaveText('The maker reference wiki');
 await staticPage.screenshot({path:`${qa}/wiki-no-js.png`});
 const xml=await(await page.request.get(url+'sitemap.xml')).text();const urls=[...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);
 // Root, wiki index, articles, two directory indexes, then one page per board family and maker category.
 const sitemapCatalog=await(await page.request.get(url+'catalog.json')).json();
 expect(urls.length).toBe(2+articles.length+2+new Set(sitemapCatalog.boards.map(b=>b.family)).size+new Set(sitemapCatalog.makerParts.map(p=>p.category)).size);expect(new Set(urls).size).toBe(urls.length);
 const titles=new Set();
 for(const canonical of urls){
  const local=url+new URL(canonical).pathname.slice(base.length);const response=await page.request.get(local);expect(response.ok(),local).toBe(true);
  const html=await response.text();expect(html).toContain(`rel="canonical" href="${canonical}"`);expect(html).toContain('<h1');expect(html).toContain('name="description"');
  const title=html.match(/<title>(.*?)<\/title>/)?.[1];expect(titles.has(title)).toBe(false);titles.add(title);
  for(const match of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g))expect(()=>JSON.parse(match[1])).not.toThrow();
 }
 expect((await page.request.get(url+'brand/social-card.png')).ok()).toBe(true);
 const cat=await(await page.request.get(url+'catalog.json')).json();const missing=cat.boards.find(b=>b.pinoutCoverage.status==='missing');
 await page.goto(url+'?board='+encodeURIComponent(missing.id));await expect(page.getByRole('dialog')).toContainText('Documentation needed');
 await page.goto(url+'wiki/modules/sensors/');await page.getByRole('searchbox',{name:'Filter this directory'}).fill('BME280');
 await expect(page.locator('tbody tr:visible').first()).toContainText('BME280');expect(await page.locator('tbody tr:visible').count()).toBeGreaterThan(0);
 expect(errors).toEqual([]);
 const report={passed:true,target:live?'production':'local',pages:urls.length,checks:['dark default','persisted light mode','cross-tab sync','red logo by theme','keyboard search','original image colors','dark tools','390px themes','blocked storage fallback','no-JavaScript wiki','unique titles and canonicals','sitemap destinations','structured data JSON','social image','undocumented board deep links','directory filtering']};
 await fs.writeFile(`${qa}/${live?'live-':''}report.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser?.close();server?.kill();}
