import {test,expect} from '@playwright/test';
test('Rotated and zoomed pinout corners remain reachable',async({page})=>{
 await page.goto('/?board=pjrc-teensy-teensy-4-1');
 const search=page.getByRole('combobox',{name:'Search boards and references'});await search.fill('Teensy 4.1');await search.press('Escape');
 if(!await page.getByRole('dialog').count())await page.getByRole('button',{name:'View Teensy 4.1 references',exact:true}).click();
 await expect.poll(()=>page.locator('.scaled-image img').evaluate(i=>i.complete&&i.naturalWidth>0)).toBe(true);
 await page.getByRole('button',{name:'Rotate image'}).click();
 for(let i=0;i<10;i++)await page.getByRole('button',{name:'Zoom in',exact:true}).click();
 const bounds=await page.locator('.image-stage').evaluate(stage=>{const s=stage.getBoundingClientRect(),i=stage.querySelector('img').getBoundingClientRect();return {left:i.left-s.left+stage.scrollLeft,top:i.top-s.top+stage.scrollTop,right:i.right-s.left+stage.scrollLeft,bottom:i.bottom-s.top+stage.scrollTop,w:stage.scrollWidth,h:stage.scrollHeight}});
 expect(bounds.left).toBeGreaterThanOrEqual(0);expect(bounds.top).toBeGreaterThanOrEqual(0);expect(bounds.right).toBeLessThanOrEqual(bounds.w+1);expect(bounds.bottom).toBeLessThanOrEqual(bounds.h+1);
});
test('Malformed stored measurements cannot crash or overwrite the workbench',async({page})=>{
 const broken=JSON.stringify({favorites:[],measurements:[null]});
 await page.addInitScript(value=>localStorage.setItem('blackwire-workbench',value),broken);
 await page.goto('/');await expect(page.getByRole('heading',{name:/Board library/})).toBeVisible();
 await page.getByRole('button',{name:'Power desk',exact:false}).first().click();await page.getByRole('tab',{name:'My measurements'}).click();
 expect(await page.evaluate(()=>localStorage.getItem('blackwire-workbench'))).toBe(broken);
 await expect(page.getByRole('heading',{name:'Something interrupted the workbench.'})).toHaveCount(0);
});
