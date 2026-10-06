import {test, expect} from '@playwright/test';

const saved = page => page.evaluate(() => { const w = JSON.parse(localStorage.getItem('blackwire-circuit-projects-v1')); return {workspace: w, project: w.entries.find(e => e.id === w.activeId).project}; });

test('rotate, duplicate and route wires without losing their electrical endpoints', async ({page}) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/?tab=breadboard'); await page.getByRole('button', {name: 'Load LED example'}).click();
  await page.getByRole('button', {name: 'Move Resistor', exact: true}).click();
  await page.getByRole('button', {name: 'Rotate', exact: true}).click();
  expect((await saved(page)).project.parts.find(p => p.id === 'resistor').rotation).toBe(90);
  await page.getByRole('button', {name: 'Duplicate', exact: true}).click();
  await expect(page.locator('.bb-component')).toHaveCount(5);
  expect((await saved(page)).project.wires).toHaveLength(9);
  await page.getByRole('button', {name: 'Undo circuit change'}).click(); await expect(page.locator('.bb-component')).toHaveCount(4);
  await page.getByRole('tab', {name: 'Connections', exact: true}).click();
  await page.locator('.bb-connections>button').first().click();
  await page.getByLabel('Wire label', {exact: true}).fill('5V supply');
  await page.getByRole('button', {name: 'Add wire bend', exact: true}).click();
  const bend = page.getByRole('button', {name: 'Move wire bend 1', exact: true});
  await bend.focus(); await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowDown');
  expect((await saved(page)).project.wires[0].points).toHaveLength(1);
  await page.getByRole('button', {name: 'Reconnect to', exact: true}).click();
  await page.getByRole('button', {name: 'Breadboard TP3', exact: true}).click();
  expect((await saved(page)).project.wires[0].to).toBe('hole:tp3');
  await page.getByRole('button', {name: 'Run DC test', exact: true}).click();
  await page.getByRole('tab', {name: 'DC test bench', exact: true}).click();
  await expect(page.locator('.bb-result-state')).toHaveText('Model solved');
  await page.reload();
  const project = (await saved(page)).project;
  expect(project.wires[0].label).toBe('5V supply'); expect(project.wires[0].points).toHaveLength(1); expect(project.parts.find(p => p.id === 'resistor').rotation).toBe(90);
  expect(errors).toEqual([]);
});

test('catalog artwork, manual pin placement, labels and terminal cleanup remain editable', async ({page}) => {
  await page.goto('/?tab=breadboard'); await page.getByRole('button', {name: 'Your catalog', exact: true}).click();
  await page.getByLabel('Find catalog components').fill('MAX98357');
  await page.getByRole('button', {name: /Add Adafruit MAX98357.* to circuit/}).first().click();
  await expect(page.locator('.bb-component image')).toHaveCount(1);
  await page.getByRole('button', {name: 'Edit terminal GND', exact: true}).click();
  await page.getByLabel('Terminal label', {exact: true}).fill('GROUND');
  await page.getByRole('button', {name: 'Place terminal on device', exact: true}).click();
  await page.locator('.bb-map-surface').click({position: {x: 50, y: 50}});
  let project = (await saved(page)).project;
  let pin = project.parts[0].pins.find(p => p.label === 'GROUND'); expect(pin.position.x).toBeGreaterThan(0); expect(pin.position.y).toBeGreaterThan(0);
  await page.getByLabel('Pin X (%)', {exact: true}).fill('25'); await page.getByLabel('Pin X (%)', {exact: true}).press('Enter');
  project = (await saved(page)).project; pin = project.parts[0].pins.find(p => p.label === 'GROUND'); expect(pin.position.x).toBe(.25);
  const artwork = await page.locator('.bb-component image').getAttribute('href');
  expect((await page.request.get(artwork)).status()).toBe(200);
  await page.screenshot({path: 'test-results/builder-reference.png', fullPage: true});
  await page.locator('.bb-terminal-list').getByRole('button', {name: 'GROUND', exact: true}).click();
  await page.getByRole('button', {name: 'Breadboard A1', exact: true}).click();
  await expect(page.locator('.bb-wire')).toHaveCount(1);
  await page.getByRole('button', {name: /Move Adafruit MAX98357/}).click();
  await page.getByRole('button', {name: 'Edit terminal GROUND', exact: true}).click();
  await page.getByRole('button', {name: 'Remove terminal & 1 wire', exact: true}).click();
  await expect(page.locator('.bb-wire')).toHaveCount(0);
  await page.getByRole('button', {name: 'Undo circuit change'}).click();
  await expect(page.locator('.bb-wire')).toHaveCount(1);
  await page.reload(); project = (await saved(page)).project;
  expect(project.parts[0].pins.find(p => p.label === 'GROUND').position.x).toBe(.25);
});

test('expanded workspace and pan move the viewport without editing the circuit', async ({page}) => {
  await page.goto('/?tab=breadboard'); await page.getByRole('button', {name: 'Load dimmer example'}).click();
  const before = (await saved(page)).project;
  await page.getByRole('button', {name: 'Expand workspace', exact: true}).click();
  await expect(page.locator('.bb-page')).toHaveClass(/bb-expanded/);
  await page.getByRole('button', {name: 'Zoom in circuit', exact: true}).click();
  await page.getByRole('button', {name: 'Pan', exact: true}).click();
  const canvas = page.locator('.bb-canvas'), box = await canvas.boundingBox();
  await page.mouse.move(box.x + 200, box.y + 25); await page.mouse.down(); await page.mouse.move(box.x + 80, box.y + 25, {steps: 5}); await page.mouse.up();
  expect(await canvas.evaluate(el => el.scrollLeft)).toBeGreaterThan(50);
  expect((await saved(page)).project).toEqual(before);
  await page.getByRole('button', {name: 'Exit expanded workspace', exact: true}).click();
  await expect(page.locator('.bb-page')).not.toHaveClass(/bb-expanded/);
});

test('separate projects, copies, deletion confirmation, and live dimmer survive reloads', async ({page}) => {
  await page.goto('/?tab=breadboard'); await page.getByRole('button', {name: 'Load LED example'}).click();
  await page.getByRole('button', {name: 'Load dimmer example'}).click();
  await page.getByRole('button', {name: 'Move 10 kΩ dimmer', exact: true}).click();
  await page.getByRole('button', {name: 'Run DC test'}).click();
  await page.getByLabel('Wiper position', {exact: true}).fill('0');
  await expect(page.locator('.bb-component.led')).not.toHaveClass(/lit/);
  await page.getByLabel('Wiper position', {exact: true}).fill('100');
  await expect(page.locator('.bb-component.led')).toHaveClass(/lit/);
  await expect(page.locator('.bb-result-state')).toHaveText('Model solved');
  await page.getByRole('button', {name: /Projects/}).click();
  await expect(page.locator('.bb-project-list article')).toHaveCount(3);
  await page.locator('.bb-project-open').filter({hasText: 'First light'}).click();
  await expect(page.locator('.bb-component.switch')).toHaveCount(1);
  await page.getByRole('button', {name: 'Copy project First light · LED circuit', exact: true}).click();
  await expect(page.getByLabel('Circuit name', {exact: true})).toHaveValue('First light · LED circuit copy');
  await page.getByRole('button', {name: 'Delete project First light · LED circuit copy', exact: true}).click();
  await expect(page.getByRole('button', {name: 'Delete permanently', exact: true})).toBeVisible();
  await page.getByRole('button', {name: 'Delete permanently', exact: true}).click();
  await expect(page.locator('.bb-project-list article')).toHaveCount(3);
  await page.locator('.bb-project-open').filter({hasText: 'Turn to glow'}).click();
  await page.getByRole('button', {name: 'Close saved projects'}).click();
  await page.reload();
  expect((await saved(page)).project.parts.find(p => p.type === 'potentiometer').position).toBe(100);
  await page.getByRole('button', {name: 'Run DC test'}).click();
  await page.getByRole('button', {name: 'Move 10 kΩ dimmer', exact: true}).click();
  await page.screenshot({path: 'test-results/builder-dimmer.png', fullPage: true});
});

test('old saved circuits migrate; competing tabs cannot overwrite each other', async ({page, context}) => {
  await page.goto('/?tab=breadboard'); await page.getByRole('button', {name: 'Load LED example'}).click();
  const old = (await saved(page)).project;
  await page.evaluate(project => { localStorage.removeItem('blackwire-circuit-projects-v1'); localStorage.setItem('blackwire-breadboard-v1', JSON.stringify({...project, version: 1})); }, old);
  await page.reload(); await expect(page.locator('.bb-component')).toHaveCount(4);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('blackwire-breadboard-v1')).version)).toBe(1);
  const other = await context.newPage(); await other.goto('/?tab=breadboard'); await other.getByLabel('Circuit name').fill('From other tab');
  await expect(page.locator('.bb-notice')).toContainText('Another tab changed');
  await page.getByRole('button', {name: 'Add LED', exact: true}).click();
  expect((await saved(page)).project.name).toBe('From other tab');
  await expect(page.locator('.bb-component')).toHaveCount(5);
  await other.close();
});
