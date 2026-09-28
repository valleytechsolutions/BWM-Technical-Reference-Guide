// Run in Chromium CI; multi-touch events exercise the same pointer path as touch screens.
export async function checkZoom(page,url,catalog,expect){
 const cdp=await page.context().newCDPSession(page);
 await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:2});
 const imageBoard=catalog.boards.find(b=>b.name==='Teensy 4.1');
 await page.goto(url+'?board='+imageBoard.id);
 const image=page.locator('.image-stage'),percent=page.locator('.zoom-value');
 await expect.poll(()=>image.locator('img').evaluate(i=>i.complete&&i.naturalWidth>0)).toBe(true);
 async function pinch(stage,scale){
  await stage.scrollIntoViewIfNeeded();const r=await stage.boundingBox(),x=r.x+r.width/2,y=r.y+r.height/2;
  const points=d=>[{x:x-d,y,id:1,radiusX:2,radiusY:2},{x:x+d,y,id:2,radiusX:2,radiusY:2}];
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points(45)});
  for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:points(45*(1+(scale-1)*i/8))});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 }
 await pinch(image,2);await expect.poll(async()=>parseInt(await percent.innerText())).toBeGreaterThan(180);
 await pinch(image,.6);await expect.poll(async()=>parseInt(await percent.innerText())).toBeLessThan(140);
 await page.getByRole('button',{name:'Fit image',exact:true}).click();await expect(percent).toHaveText('100%');
 await image.press('+');await expect(percent).toHaveText('125%');
 await image.dblclick();await expect(percent).toHaveText('100%');
 const r=await image.boundingBox();await page.mouse.move(r.x+r.width*.5,r.y+r.height*.5);
 await page.keyboard.down('Control');await page.mouse.wheel(0,-120);await page.keyboard.up('Control');
 await expect.poll(async()=>parseInt(await percent.innerText())).toBeGreaterThan(200);
 const before=await image.evaluate(n=>({x:n.scrollLeft,y:n.scrollTop}));
 await page.mouse.down();await page.mouse.move(r.x+r.width*.5-60,r.y+r.height*.5-60,{steps:5});await page.mouse.up();
 await expect.poll(()=>image.evaluate(n=>n.scrollLeft+n.scrollTop)).toBeGreaterThan(before.x+before.y+30);
 expect(await page.evaluate(()=>visualViewport.scale)).toBe(1);
 await page.locator('.asset-item').filter({hasText:'Original PDF'}).first().click();
 const pdf=page.locator('.pdf-scroll');await expect(pdf).toHaveAttribute('aria-busy','false');
 await pinch(pdf,1.8);await expect.poll(async()=>parseInt(await percent.innerText())).toBeGreaterThan(160);
 await expect(pdf).toHaveAttribute('aria-busy','false');
 const pixels=await pdf.locator('canvas').evaluate(c=>c.width*c.height);expect(pixels).toBeLessThanOrEqual(16_000_000);
 await pdf.press('0');await expect(percent).toHaveText('100%');await expect(pdf).toHaveAttribute('aria-busy','false');
 // Switching an asset resets zoom and must clear captured pointers.
 await page.locator('.asset-item').filter({hasText:'Pinout · PNG'}).first().click();await expect(percent).toHaveText('100%');
 await pinch(image,1.5);await expect.poll(async()=>parseInt(await percent.innerText())).toBeGreaterThan(140);
 await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:false});await cdp.detach();
 await page.goto(url);
}
