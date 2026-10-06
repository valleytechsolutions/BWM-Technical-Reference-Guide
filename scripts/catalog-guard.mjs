import fs from 'node:fs/promises';
import path from 'node:path';
import {PIN_FILE, splitCatalog} from './catalog-split.mjs';

// data/library-source.json pins the imported library snapshot. These are the counts the
// app catalog must reproduce; a stale public/catalog.json silently drops whole desks.
const STAT_KEYS = {references: 'referenceEntries', pinouts: 'physicalPinouts', devicesWithFiles: 'devicesWithFiles', makerRecords: 'makerRecords', makerDocumented: 'makerDocumented', makerWithImages: 'makerWithImages', makerNewMedia: 'makerNewMedia', wiringGuides: 'wiringGuides', wiringDiagrams: 'wiringDiagrams'};
export function catalogMismatches(catalog, source) {
  const problems = [];
  if (catalog?.editionInfo?.snapshot !== source.snapshot) problems.push(`snapshot ${catalog?.editionInfo?.snapshot ?? 'missing'}, expected ${source.snapshot}`);
  for (const [key, stat] of Object.entries(STAT_KEYS)) if (source[key] != null && catalog?.stats?.[stat] !== source[key]) problems.push(`${stat} ${catalog?.stats?.[stat] ?? 'missing'}, expected ${source[key]}`);
  if (source.makerRecords != null && (catalog?.makerParts || []).length !== source.makerRecords) problems.push(`${(catalog?.makerParts || []).length} maker records loaded, expected ${source.makerRecords}`);
  if (source.wiringGuides != null && (catalog?.wiringGuides || []).length !== source.wiringGuides) problems.push(`${(catalog?.wiringGuides || []).length} wiring guides loaded, expected ${source.wiringGuides}`);
  return problems;
}
// Refreshes public/catalog.json from the imported library when one is present, then refuses
// to continue unless the app catalog matches the pinned snapshot.
export async function prepareCatalog({library = 'library/catalog.json', target = 'public/catalog.json', sourceFile = 'data/library-source.json'} = {}) {
  const source = JSON.parse(await fs.readFile(sourceFile, 'utf8'));
  const pinsTarget = path.join(path.dirname(target), PIN_FILE);
  let fresh = null;
  try { fresh = await fs.readFile(library, 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  // The imported library (or a full catalog copied into public/) is split: pin lists move to their own file.
  let input = fresh;
  if (!input) try { input = await fs.readFile(target, 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (input) {
    const full = JSON.parse(input), split = splitCatalog(full), carriesPins = Object.keys(split.pins).length > 0;
    const lean = JSON.stringify(split.catalog);
    let current = null;
    try { current = await fs.readFile(target, 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (current !== lean) { await fs.writeFile(target, lean); console.log(`Refreshed ${target}${fresh ? ' from ' + library : ''}.`); }
    // An already-split catalog has no pin lists left; keep the existing pin file rather than emptying it.
    if (carriesPins || !(await fs.stat(pinsTarget).catch(() => null))) await fs.writeFile(pinsTarget, JSON.stringify(split.pins));
  }
  let catalog;
  try { catalog = JSON.parse(await fs.readFile(target, 'utf8')); }
  catch { throw new Error(`${target} is missing or unreadable. Run pnpm library:import first.`); }
  const problems = catalogMismatches(catalog, source);
  if (problems.length) throw new Error(`${target} does not match the pinned library snapshot in ${sourceFile}:\n- ${problems.join('\n- ')}\nRun pnpm library:import (or update ${sourceFile} with the new snapshot) before building.`);
  console.log(`Catalog matches library snapshot ${source.snapshot}.`);
}
