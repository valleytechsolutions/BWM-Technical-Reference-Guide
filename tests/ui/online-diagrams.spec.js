import {test,expect} from '@playwright/test';

test('A source-only device opens its manufacturer diagram without a local download',async({page,context})=>{
 const url='https://manufacturer.example/exact-board/header.png';
 const record={id:'online-only',name:'Exact Board',brand:'Test Maker',processor:'Test MCU',family:'Displays',
  revision:'1.0',assets:[],pinouts:0,sources:[],device:{category:'Display'},
  pinoutCoverage:{status:'linked-pinout',physicalCount:0,linkedPhysicalCount:1,scope:'Expansion connector'},
  documentation:{resources:[{url,label:'Original header diagram',kind:'connector-reference',physicalPinout:true}]}};
 await page.route('**/catalog.json',route=>route.fulfill({json:{
  edition:'First Edition · 2026 · Collection test',stats:{referenceEntries:0,boardsWithFiles:0,physicalPinouts:0,brands:1},
  boards:[record],makerParts:[],power:[],wiringGuides:[]}}));
 await context.route(url,route=>route.fulfill({contentType:'text/plain',body:'Manufacturer diagram endpoint'}));
 await page.goto('/');
 await page.locator('.select-field').filter({hasText:'Reference type'}).locator('select').selectOption('pinout image');
 const card=page.locator('.board-card');
 await expect(card).toContainText('0 saved references · 1 online');
 await card.getByRole('button',{name:'View Exact Board references'}).click();
 const dialog=page.getByRole('dialog');
 await expect(dialog.getByRole('heading',{name:'Online diagrams'})).toBeVisible();
 await expect(dialog.getByRole('button',{name:'Save original'})).toHaveCount(0);
 const source=dialog.getByRole('link',{name:'Original header diagram'});
 await expect(source).toHaveAttribute('href',url);
 const popup=context.waitForEvent('page');await source.click();
 const original=await popup;await expect(original).toHaveURL(url);await original.close();
 const permalink=dialog.getByRole('link',{name:'Board link'});
 if(await permalink.count()){
  await page.goto(await permalink.getAttribute('href'));
  await expect(page.getByRole('dialog').getByRole('link',{name:'Original header diagram'})).toHaveAttribute('href',url);
 }
 await dialog.getByRole('button',{name:'Close board'}).click();
 await page.getByRole('button',{name:/Devices & IoT/}).click();
 await page.getByLabel('Pinout images only').check();
 await expect(page.locator('.board-card')).toContainText('Exact Board');
});
