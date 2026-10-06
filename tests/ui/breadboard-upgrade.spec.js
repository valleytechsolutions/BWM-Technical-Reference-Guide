import {test, expect} from '@playwright/test';

const saved = page => page.evaluate(() => { const w = JSON.parse(localStorage.getItem('blackwire-circuit-projects-v1')); return w.entries.find(e => e.id === w.activeId).project; });
const hold = (locator, down) => locator.dispatchEvent(down ? 'pointerdown' : 'pointerup', {pointerId: 1, button: 0});

test('transistor switch lights only while the inserted button is held', async ({page}) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/?tab=breadboard'); await page.getByRole('button', {name: 'Load transistor switch', exact: true}).click();
  await expect(page.locator('.bb-mounted')).toHaveCount(5);
  await page.getByRole('button', {name: 'Run DC test'}).click();
  await expect(page.locator('.bb-component.led')).not.toHaveClass(/lit/);
  const cap = page.getByRole('button', {name: 'Press Push button', exact: true});
  await hold(cap, true);
  await expect(page.locator('.bb-component.led')).toHaveClass(/lit/); await expect(page.locator('.bb-result-state')).toHaveText('Model solved');
  await expect(page.locator('.bb-results-grid')).toContainText('saturated');
  await hold(cap, false);
  await expect(page.locator('.bb-component.led')).not.toHaveClass(/lit/);
  await expect(page.getByRole('button', {name: 'Undo circuit change'})).toBeDisabled();
  expect((await saved(page)).parts.find(p => p.type === 'button').closed).toBe(false);
  expect(errors).toEqual([]);
});

test('device maker defines, inserts, powers and reuses a dual-row device', async ({page}) => {
  await page.goto('/?tab=breadboard'); await page.getByRole('button', {name: 'Load LED example', exact: true}).click();
  await page.getByRole('button', {name: 'Custom device', exact: true}).click();
  await expect(page.getByRole('tab', {name: 'Device maker'})).toHaveAttribute('aria-selected', 'true');
  await page.getByLabel('Device name', {exact: true}).fill('Level sensor');
  await page.getByLabel('Add terminals', {exact: true}).fill('VCC, GND, SDA, SCL\nGPIO4\nA0\nNC\nOUT');
  await page.getByRole('button', {name: 'Add 8 terminals'}).click();
  await page.getByRole('button', {name: 'Suggest roles from labels'}).click();
  await expect(page.getByLabel('Terminal 1 role')).toHaveValue('power'); await expect(page.getByLabel('Terminal 3 role')).toHaveValue('bus'); await expect(page.getByLabel('Terminal 8 role')).toHaveValue('');
  await page.getByLabel('Move terminal 8 up').click(); await expect(page.getByLabel('Terminal 7 label')).toHaveValue('OUT');
  await page.getByLabel('Package', {exact: true}).selectOption('dual');
  await expect(page.getByRole('img', {name: 'Package lead layout'}).locator('rect')).toHaveCount(8);
  await page.getByLabel('Model its supply current and voltage limits').check();
  await page.getByLabel('Current draw (mA)').fill('20'); await page.getByLabel('Current draw (mA)').press('Enter');
  let device = (await saved(page)).parts.at(-1);
  expect(device.footprint).toEqual({kind: 'dual', spread: 1, numbering: 'ccw'}); expect(device.power).toMatchObject({vcc: device.pins[0].id, gnd: device.pins[1].id, current: 20, max: 3.6});
  await page.getByRole('button', {name: 'Insert into breadboard', exact: true}).click();
  await expect(page.locator('.bb-insert-banner')).toContainText('pin 1 (VCC)');
  await page.getByRole('button', {name: 'Breadboard F22', exact: true}).hover();
  await expect(page.locator('.bb-footprint-ghost circle')).toHaveCount(8); await expect(page.locator('.bb-footprint-ghost')).not.toHaveClass(/blocked/);
  await page.getByRole('button', {name: 'Breadboard F22', exact: true}).click();
  device = (await saved(page)).parts.at(-1);
  expect(Object.values(device.mount.holes).sort()).toEqual(['e22', 'e23', 'e24', 'e25', 'f22', 'f23', 'f24', 'f25']);
  await expect(page.getByLabel('Move terminal 2 up')).toBeDisabled();
  // Power the 3.6 V device from the 5 V rail: the DC test flags the supply and the bus pin.
  for (const [a, b] of [['J22', 'TP21'], ['J23', 'TN23'], ['J24', 'TP26']]) { await page.getByRole('button', {name: 'Breadboard ' + a, exact: true}).click(); await page.getByRole('button', {name: 'Breadboard ' + b, exact: true}).click(); }
  await page.getByRole('tab', {name: 'DC test bench'}).click(); await page.getByRole('button', {name: 'Run DC test'}).click();
  await expect(page.locator('.bb-diagnostics')).toContainText('5.00 V at VCC exceeds the 3.6 V maximum you entered');
  await expect(page.locator('.bb-diagnostics')).toContainText('SDA sees 5.00 V');
  await page.locator('[data-part-id="' + device.id + '"]').getByRole('button', {name: 'Move Level sensor'}).click();
  await page.getByRole('tab', {name: 'Device maker'}).click(); await page.getByRole('button', {name: 'Save to My devices'}).click();
  await expect(page.getByRole('button', {name: 'Update in My devices'})).toBeVisible();
  await page.getByRole('button', {name: 'New', exact: true}).click(); await page.reload();
  await page.getByRole('button', {name: 'Your catalog', exact: true}).click();
  await page.getByRole('button', {name: 'Add saved device Level sensor'}).click();
  const reused = (await saved(page)).parts[0];
  expect(reused.pins.map(p => p.label)).toEqual(['VCC', 'GND', 'SDA', 'SCL', 'GPIO4', 'A0', 'OUT', 'NC']); expect(reused.mount).toBeUndefined(); expect(reused.power.current).toBe(20);
});

test('boards resize, split, multiply and stay protected from stranded connections', async ({page}) => {
  await page.goto('/?tab=breadboard'); await page.getByRole('button', {name: 'Load inserted LED', exact: true}).click();
  await page.getByRole('button', {name: 'Boards', exact: true}).click();
  await page.getByLabel('Board size').selectOption('mini');
  await expect(page.locator('.bb-notice')).toContainText('too small'); expect((await saved(page)).boards[0].size).toBe('half');
  await page.getByLabel('Board size').selectOption('full'); await expect(page.getByRole('button', {name: 'Breadboard J63', exact: true})).toHaveCount(1);
  await page.getByLabel('Power rails split at the middle').check();
  await page.getByRole('button', {name: 'Add breadboard'}).click();
  await expect(page.getByRole('tab', {name: 'Breadboard 2'})).toHaveAttribute('aria-selected', 'true');
  await page.getByLabel('Board size').selectOption('mini');
  expect((await saved(page)).boards).toMatchObject([{id: 'main', size: 'full', splitRails: true}, {id: 'b2', size: 'mini'}]);
  await page.getByRole('button', {name: 'Breadboard 2 A3', exact: true}).click(); await page.getByRole('button', {name: 'Breadboard A3', exact: true}).click();
  expect((await saved(page)).wires.at(-1)).toMatchObject({from: 'hole:b2.a3', to: 'hole:a3'});
  await page.getByRole('button', {name: 'Boards', exact: true}).click(); await page.getByRole('tab', {name: 'Breadboard 2'}).click();
  await page.getByRole('button', {name: /Remove board/}).click();
  expect((await saved(page)).boards).toHaveLength(1); expect((await saved(page)).wires).toHaveLength(4);
  await page.getByRole('button', {name: 'Undo circuit change'}).click(); expect((await saved(page)).boards).toHaveLength(2);
  await page.getByRole('tab', {name: 'Build guide'}).click();
  await expect(page.locator('.bb-materials')).toContainText('Full breadboard · split rails'); await expect(page.locator('.bb-materials')).toContainText('Mini breadboard');
});
