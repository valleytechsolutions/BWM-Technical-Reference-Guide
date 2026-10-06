import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {catalogMismatches, prepareCatalog} from '../scripts/catalog-guard.mjs';

const source = {snapshot: '2026.09.13', references: 3, makerRecords: 1, wiringGuides: 2, wiringDiagrams: 2};
const catalog = (extra = {}) => ({editionInfo: {snapshot: '2026.09.13'}, stats: {referenceEntries: 3, makerRecords: 1, wiringGuides: 2, wiringDiagrams: 2}, makerParts: [{}], wiringGuides: [{}, {}], ...extra});

test('a catalog without the pinned wiring guides or snapshot is reported, not shipped', () => {
  assert.deepEqual(catalogMismatches(catalog(), source), []);
  const stale = catalog({wiringGuides: undefined, stats: {referenceEntries: 3, makerRecords: 1}});
  assert.match(catalogMismatches(stale, source).join(' '), /wiringGuides missing, expected 2.*0 wiring guides loaded/);
  assert.match(catalogMismatches(catalog({editionInfo: {snapshot: '2026.09.10'}}), source)[0], /snapshot 2026.09.10/);
});
test('the build refreshes a stale public catalog from the imported library and stops when neither matches', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'bw-catalog-')), file = name => path.join(dir, name);
  await fs.writeFile(file('source.json'), JSON.stringify(source));
  await fs.writeFile(file('public.json'), JSON.stringify(catalog({wiringGuides: []})));
  const options = {library: file('library.json'), target: file('public.json'), sourceFile: file('source.json')};
  await assert.rejects(prepareCatalog(options), /0 wiring guides loaded, expected 2[\s\S]*pnpm library:import/);
  await fs.writeFile(file('library.json'), JSON.stringify(catalog()));
  await prepareCatalog(options);
  assert.deepEqual(JSON.parse(await fs.readFile(file('public.json'), 'utf8')), catalog());
  await fs.rm(dir, {recursive: true});
});
test('pin lists are split out of the first-load catalog and leave a pin count behind', async () => {
  const {splitCatalog} = await import('../scripts/catalog-split.mjs');
  const pins = {review: 'ocr-checked', connectors: [{id: 'J1', pins: [{position: 1, label: 'GND'}, {position: 2, label: '3V3'}]}]};
  const {catalog: lean, pins: file} = splitCatalog({boards: [{id: 'a', pinConnectors: pins}, {id: 'b'}], makerParts: [{id: 'm', pinReferences: []}]});
  assert.deepEqual(lean.boards, [{id: 'a', pinCount: 2}, {id: 'b'}]); assert.deepEqual(file, {a: pins}); assert.deepEqual(lean.makerParts, [{id: 'm', pinReferences: []}]);
  assert.deepEqual(splitCatalog(lean).pins, {});
});
