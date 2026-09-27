export async function checkWiring(page,url,catalog,expect){
 await page.goto(url+'?tab=wiring');
 await expect(page.getByRole('heading',{name:'Wiring & protocols',exact:true})).toBeVisible();
 await expect(page.locator('.wiring-card')).toHaveCount(catalog.wiringGuides.length);
 await page.getByRole('combobox',{name:'Search boards and references'}).fill('RJ-45');
 await page.getByRole('combobox',{name:'Search boards and references'}).press('Enter');
 await expect(page.getByRole('heading',{name:'RJ45 / 8P8C Ethernet: T568A and T568B',exact:true})).toBeVisible();
 await expect.poll(()=>page.locator('.wiring-stage img').evaluate(img=>img.complete&&img.naturalWidth===1200)).toBe(true);
 const before=await page.locator('.wiring-stage img').evaluate(img=>img.getBoundingClientRect().width);
 await page.getByRole('button',{name:'Zoom wiring diagram in',exact:true}).click();
 expect(await page.locator('.wiring-stage img').evaluate(img=>img.getBoundingClientRect().width)).toBeGreaterThan(before*1.4);
 await page.getByRole('button',{name:'Fit wiring diagram',exact:true}).click();
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Save diagram',exact:true}).click();
 expect((await download).suggestedFilename()).toBe('ethernet-t568.svg');
 await page.goto(url+'?tab=wiring&guide=pn7160-mini-i2c');
 await expect(page.getByRole('heading',{name:'ELECHOUSE PN7160 MINI V1: I2C wiring',exact:true})).toBeVisible();
 await expect(page.locator('.wiring-table tbody tr')).toHaveCount(6);
 await page.getByRole('button',{name:'PN7160 MINI V1 — I2C',exact:true}).click();
 await expect(page.getByRole('dialog',{name:'PN7160 MINI V1 — I2C',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Close maker record',exact:true}).click();
 await page.goto(url+'?tab=wiring');await page.getByRole('combobox',{name:'Wiring category',exact:true}).selectOption('RFID & NFC');
 await expect(page.locator('.wiring-card')).toHaveCount(5);
 await page.getByRole('combobox',{name:'Search boards and references'}).fill('ST25R');
 await page.getByRole('combobox',{name:'Global search scope',exact:true}).selectOption('wiring');
 await expect(page.locator('.global-search-result')).toHaveCount(3);
 await page.getByRole('checkbox',{name:'Pinout sources only',exact:true}).check();await expect(page.locator('.global-search-result')).toHaveCount(0);
 await page.goto(url+'wiki/wiring/can-bus/');
 await expect(page.getByRole('heading',{name:'CAN bus: controller, transceiver and termination',exact:true})).toBeVisible();
 await expect.poll(()=>page.locator('.wiring-figure img').evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
 const oldViewport=page.viewportSize();await page.setViewportSize({width:390,height:844});
 try{
  await page.goto(url+'?tab=wiring&guide=st25r3916b-spi');
  await expect(page.getByRole('heading',{name:'ELECHOUSE ST25R3916B: SPI wiring',exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await page.getByRole('button',{name:'Zoom wiring diagram in',exact:true}).click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await page.getByRole('button',{name:'Fit wiring diagram',exact:true}).click();
 }finally{await page.setViewportSize(oldViewport);}
}
