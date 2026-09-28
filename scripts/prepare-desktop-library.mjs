// The installer carries browsing assets. Large originals live in a persistent,
// hash-verified cache so software updates never replace the whole collection.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
const source=JSON.parse(await fs.readFile('data/library-source.json','utf8'));
if(!/^[a-f0-9]{40}$/.test(source.commit))throw Error('A pinned collection commit is required');
const names=JSON.parse(await fs.readFile('library/manifest.json','utf8'));
const output=path.resolve('build/desktop-library');
const expected=path.join(process.cwd(),'build','desktop-library');
if(output!==expected)throw Error('Unexpected generated-library directory');
await fs.rm(output,{recursive:true,force:true});
await fs.mkdir(output,{recursive:true});
const files=[];
for(const name of names){
 if(!/^[a-zA-Z0-9_.\-/]+$/.test(name)||name.split('/').some(s=>!s||s==='.'||s==='..'))throw Error('Invalid library path');
 const bytes=await fs.readFile(path.join('library',name));
 const sha256=createHash('sha256').update(bytes).digest('hex');
 const bundled=!/^(media|maker-media|maker-models)\//.test(name);
 files.push({path:name,size:bytes.length,sha256,bundled});
 if(bundled){const dest=path.join(output,'seed',name);await fs.mkdir(path.dirname(dest),{recursive:true});await fs.writeFile(dest,bytes);}
}
await fs.writeFile(path.join(output,'index.json'),JSON.stringify({schema:1,snapshot:source.snapshot,commit:source.commit,files}));
console.log(`Desktop library: ${files.filter(f=>f.bundled).length} bundled browsing files; ${files.filter(f=>!f.bundled).length} downloadable originals, each SHA-256 verified.`);
