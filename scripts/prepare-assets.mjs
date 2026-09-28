import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const pdfRoot=path.dirname(require.resolve('pdfjs-dist/package.json'));
for(const name of ['cmaps','standard_fonts','wasm'])await fs.cp(path.join(pdfRoot,name),path.join('public','pdf',name),{recursive:true});
await fs.copyFile(path.join(pdfRoot,'LICENSE'),path.join('public','pdf','LICENSE'));
console.log('Local PDF rendering resources ready.');

let notices='Black Wire Technical Reference Guide — bundled interface libraries\n\n';
for(const name of ['react','react-dom','lucide-react','pdfjs-dist']){
 const dir=path.dirname(require.resolve(name+'/package.json'));
 const meta=JSON.parse(await fs.readFile(path.join(dir,'package.json'),'utf8'));
 let license;for(const file of ['LICENSE','LICENSE.txt','LICENSE.md']){try{license=await fs.readFile(path.join(dir,file),'utf8');break;}catch{}}
 if(!license)throw new Error('Missing license: '+name);
 notices+=`${name} ${meta.version}\n${'='.repeat(50)}\n${license}\n\n`;
}
const visited=new Set();
async function runtimeNotice(name,resolver){
 const file=resolver.resolve(name+'/package.json'),meta=JSON.parse(await fs.readFile(file,'utf8'));
 const id=meta.name+' '+meta.version;if(visited.has(id))return;visited.add(id);
 const dir=path.dirname(file),licenses=(await fs.readdir(dir,{withFileTypes:true})).filter(f=>f.isFile()&&/^(license|licence|copying)(\.|$)/i.test(f.name));
 notices+=`Desktop component: ${id}\n${'='.repeat(50)}\n`;
 if(licenses.length)for(const f of licenses)notices+=await fs.readFile(path.join(dir,f.name),'utf8');
 else notices+=`License declared by upstream: ${meta.license}. Author: ${typeof meta.author==='string'?meta.author:meta.author?.name||'See upstream'}. Upstream package does not include a separate license text. Source: ${meta.homepage||''}\n`;
 notices+='\n\n';for(const dep of Object.keys(meta.dependencies||{}))await runtimeNotice(dep,createRequire(file));
}
await runtimeNotice('electron-updater',require);
await fs.writeFile('public/THIRD_PARTY_NOTICES.txt',notices);
await fs.mkdir('public/licenses',{recursive:true});
for(const [source,destination] of [
 ['LICENSE','MIT.txt'],['LICENSES/Adafruit-CC-BY-SA-3.0.txt','Adafruit-CC-BY-SA-3.0.txt'],['LICENSES/CC-BY-4.0.txt','CC-BY-4.0.txt'],
 ['NOTICE.md','NOTICE.md'],['LICENSING.md','LICENSING.md'],
 ['public/THIRD_PARTY_NOTICES.txt','THIRD_PARTY_NOTICES.txt']
])await fs.copyFile(source,path.join('public/licenses',destination));
console.log('Original-work licenses and attribution notices ready.');
