import {test, expect} from '@playwright/test';
import fs from 'node:fs/promises';

test('single-read provenance and all large-board terminals survive save and reload', async ({page}) => {
  const catalog = JSON.parse(await fs.readFile('public/catalog.json', 'utf8'));
  const fixture = {...catalog.boards[0], id: 'pin-import-fixture', name: 'Pin import fixture', pinReferences: [], pinConnectors: {method: 'image-transcription', review: 'single-entry', images: [{file: 'media/' + 'a'.repeat(64) + '.png'}], connectors: [{id: 'J1', rows: 1, pins: Array.from({length: 273}, (_, i) => ({position: i + 1, label: 'GPIO' + i, functions: []}))}]}};
  catalog.boards.push(fixture);
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.route('**/catalog.json', route => route.fulfill({json: catalog}));
  await page.goto('/?tab=breadboard');
  await page.getByRole('button', {name: 'Your catalog', exact: true}).click();
  await page.getByLabel('Find catalog components').fill('Pin import fixture');
  await page.getByRole('button', {name: 'Add Pin import fixture to circuit', exact: true}).click();
  await page.getByRole('tab', {name: 'Device maker', exact: true}).click();
  await expect(page.getByLabel('Terminal 273 label', {exact: true})).toHaveValue('GPIO272');
  await expect(page.locator('.bb-pin-source').first()).toContainText('transcribed once');
  await page.getByRole('button', {name: 'Save to My devices', exact: true}).click();
  await page.reload();
  const saved = await page.evaluate(() => ({projects: JSON.parse(localStorage.getItem('blackwire-circuit-projects-v1')), devices: JSON.parse(localStorage.getItem('blackwire-device-library-v1'))}));
  const part = saved.projects.entries.find(e => e.id === saved.projects.activeId).project.parts.find(p => p.recordId === 'pin-import-fixture');
  expect(part.pins).toHaveLength(273); expect(part.pinSource.review).toBe('single-entry');
  expect(saved.devices.devices[0].pins).toHaveLength(273); expect(errors).toEqual([]);
});
