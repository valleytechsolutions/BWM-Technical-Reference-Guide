import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {validatePowerProfiles} from '../src/power-profiles.mjs';
import {safeSourceURL,safeLibraryPath,documentationSummary} from '../src/hardware-links.mjs';
const root=path.resolve(process.argv[2]||'library');
const catalog=JSON.parse(await fs.readFile(path.join(root,'catalog.json'),'utf8'));
const manifest=new Set(JSON.parse(await fs.readFile(path.join(root,'manifest.json'),'utf8')));
const errors=[],media=new Map(),ids=new Set(),boards=new Set(catalog.boards.map(b=>b.id));
errors.push(...validatePowerProfiles(catalog.power,boards));
const curatedPower=JSON.parse(await fs.readFile(new URL('../data/power-profiles.json',import.meta.url),'utf8'));
if(JSON.stringify(curatedPower)!==JSON.stringify(catalog.power))errors.push('Imported power profiles differ from the reviewed application data.');
for(const b of catalog.boards)for(const a of b.assets){
 if(ids.has(a.id))errors.push('Repeated asset ID: '+a.id);ids.add(a.id);media.set(a.file,a.hash);
 for(const field of ['file','thumb','display','vector'])if(a[field]&&!manifest.has(a[field]))errors.push('Missing manifest entry: '+a[field]);
}
for(const rel of manifest){const resolved=path.resolve(root,rel);if(!resolved.startsWith(root+path.sep)){errors.push('Path outside library: '+rel);continue;}try{if(!(await fs.stat(resolved)).size)errors.push('Empty file: '+rel);}catch{errors.push('Missing file: '+rel);}}
for(const p of catalog.makerParts||[])for(const a of p.assets||[]){
 media.set(a.file,a.hash);
 for(const field of ['file','thumb','display'])if(a[field]&&!manifest.has(a[field]))errors.push('Missing maker manifest entry: '+a[field]);
 if(!a.rights||!a.review||!a.sources?.length)errors.push('Missing maker image provenance: '+a.id);
}
for(const [rel,hash] of media){const actual=crypto.createHash('sha256').update(await fs.readFile(path.join(root,rel))).digest('hex');if(actual!==hash)errors.push('Media hash mismatch: '+rel);}
for(const p of catalog.power){for(const id of p.boardIds)if(!boards.has(id))errors.push('Unknown power board: '+id);for(const o of p.observations)if(!p.sources[o.source])errors.push('Missing observation source: '+p.id);}
if(catalog.power.find(p=>p.id==='espc5')?.boardIds.join()!=='espressif-esp32-esp32-c5-devkitc-1-v1-2')errors.push('ESP32-C5 power profile must match revision 1.2 exactly.');
const makerIds=new Set();
for(const p of catalog.makerParts||[]){
 if(makerIds.has(p.id))errors.push('Repeated maker ID: '+p.id);makerIds.add(p.id);
 for(const id of p.boardIds)if(!boards.has(id))errors.push('Unknown linked maker reference: '+id);
 if(p.completePhysicalPinout)errors.push('Maker intake cannot approve complete physical pinouts: '+p.id);
 if(p.documentationStatus==='Manufacturer documentation recorded'&&(!p.sources.length||p.sources.some(s=>!/^https:\/\//.test(s.url)||!/^[a-f0-9]{64}$/.test(s.sha256||''))))errors.push('Missing maker evidence: '+p.id);
}
if(makerIds.size!==catalog.stats.makerRecords)errors.push('Maker record count differs from catalog statistics.');
const makerFile=JSON.parse(await fs.readFile(path.join(root,'maker-parts.json'),'utf8'));
for(const r of [...catalog.boards,...catalog.makerParts||[]]){
 if(!r.documentationCoverage)errors.push('Missing documentation coverage: '+r.id);
 const d=r.documentation||{};
 if(d.website&&!safeSourceURL(d.website.url))errors.push('Unsafe manufacturer URL: '+r.id);
 for(const s of d.resources||[]){
  if(!safeSourceURL(s.url))errors.push('Unsafe document URL: '+r.id);
  if(s.file&&(!safeLibraryPath(s.file)||!manifest.has(s.file)||media.get(s.file)!==s.sha256))errors.push('Saved document missing or hash differs: '+r.id);
  if(s.kind==='datasheet'&&!['board','component'].includes(s.scope))errors.push('Datasheet scope missing: '+r.id);
 }
 if(Boolean(r.documentationCoverage?.boardDatasheets)!==documentationSummary(r).boardDatasheet)errors.push('Datasheet coverage mismatch: '+r.id);
}
if(JSON.stringify(makerFile.parts)!==JSON.stringify(catalog.makerParts))errors.push('Maker data differs from catalog.');
const report={checkedAt:new Date().toISOString(),root,manifestFiles:manifest.size,hashedMedia:media.size,referenceEntries:ids.size,pinouts:catalog.boards.flatMap(b=>b.assets).filter(a=>a.type==='pinout image').length,errors};
await fs.mkdir('data/qa',{recursive:true});await fs.writeFile('data/qa/library-validation.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(errors.length)process.exitCode=1;
