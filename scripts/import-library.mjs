import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const source=path.resolve(process.env.BLACKWIRE_LIBRARY_ROOT||path.join(root,'..','black-wire-pinouts','library'));
const output=path.join(root,'library');
if(source===output)throw new Error('Source and destination libraries must differ.');
const paths=JSON.parse(await fs.readFile(path.join(source,'manifest.json'),'utf8'));
let previousPaths=[];
try{previousPaths=JSON.parse(await fs.readFile(path.join(output,'manifest.json'),'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
function safePath(rel){return typeof rel==='string'&&!rel.includes('\\')&&!path.isAbsolute(rel)&&!rel.split('/').some(p=>!p||p==='..'||p==='.')&&!rel.includes(':');}
if(!Array.isArray(previousPaths)||!previousPaths.every(safePath))throw new Error('Unsafe previous manifest');
const catalog=JSON.parse(await fs.readFile(path.join(source,'catalog.json'),'utf8'));
const hashes=new Map(catalog.boards.flatMap(b=>b.assets.map(a=>[a.file,a.hash])));
for(const p of [...catalog.boards,...catalog.makerParts||[]])for(const a of p.assets||[]){hashes.set(a.file,a.hash);if(a.modelOriginal)hashes.set(a.modelOriginal,a.modelOriginalHash);}
for(const g of catalog.wiringGuides||[])hashes.set(g.image.file,g.image.hash);
for(const rel of [...new Set([...paths,'manifest.json'])]){
 if(!safePath(rel))throw new Error('Unsafe manifest path');
 const from=path.join(source,rel),to=path.join(output,rel);
 const content=await fs.readFile(from);
 if(hashes.has(rel)&&crypto.createHash('sha256').update(content).digest('hex')!==hashes.get(rel))throw new Error('Reference hash mismatch: '+rel);
 await fs.mkdir(path.dirname(to),{recursive:true});await fs.writeFile(to,content);
}
// Retired managed files must not leak into native packages that copy library/**.
// Only delete exact files owned by the previous manifest, never arbitrary files.
const retained=new Set(paths);
for(const rel of previousPaths)if(!retained.has(rel))await fs.rm(path.join(output,rel),{force:true});
await fs.mkdir(path.join(root,'public'),{recursive:true});
await fs.copyFile(path.join(output,'catalog.json'),path.join(root,'public','catalog.json'));
console.log(`Imported ${paths.length} library paths and ${catalog.stats.referenceEntries} references. Originals verified against catalog hashes.`);
