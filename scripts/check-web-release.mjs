import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const allowed=new Set(['assets','brand','library','licenses','pdf','wiki','_headers','404.html','catalog.json','pin-connectors.json','index.html','robots.txt','sitemap.xml','theme-init.js','THIRD_PARTY_NOTICES.txt','wiki.css','wiki.js','build-info.json']);
export async function checkWebRelease(root,{maxFiles=20000,maxFileBytes=25*1024*1024}={}){
  root=path.resolve(root);let count=0,total=0;
  async function walk(dir){
    for(const e of await fs.readdir(dir,{withFileTypes:true})){
      const file=path.join(dir,e.name),rel=path.relative(root,file).replaceAll('\\','/');
      if(e.isSymbolicLink())throw Error('Symlinks are not publishable: '+rel);
      if(!allowed.has(rel.split('/')[0])||/(^|\/)(?:\.git|\.env(?:\.[^/]*)?|_Research|node_modules|data|workbench\.json)(?:\/|$)/i.test(rel)||/Black-Wire-workbench/i.test(rel))throw Error('Unexpected or private output: '+rel);
      if(e.isDirectory()){await walk(file);continue;}
      if(!e.isFile())throw Error('Non-file output: '+rel);
      const size=(await fs.stat(file)).size;
      if(size>maxFileBytes)throw Error('File exceeds Pages limit: '+rel);
      if(++count>maxFiles)throw Error('Build exceeds Pages file-count limit.');
      total+=size;
      if(/\.(?:json|md|txt|html|[cm]?js|css|xml|svg)$/i.test(rel)){
        const text=await fs.readFile(file,'utf8');
        if(/[a-z]:[\\/]+users[\\/]/i.test(text)||/device_challenge=/i.test(text)||/\b(?:ghp|github_pat)_[a-zA-Z0-9_]{20,}\b/.test(text))throw Error('Private data pattern in browser output: '+rel);
      }
    }
  }
  await walk(root);
  for(const name of ['index.html','catalog.json','pin-connectors.json','library/manifest.json','wiki/index.html','_headers','build-info.json'])if(!(await fs.stat(path.join(root,name))).isFile())throw Error('Required output missing: '+name);
  const info=JSON.parse(await fs.readFile(path.join(root,'build-info.json'),'utf8'));
  const catalog=JSON.parse(await fs.readFile(path.join(root,'catalog.json'),'utf8'));
  if(!/^[a-f0-9]{40}$/.test(info.appCommit)||!/^[a-f0-9]{40}$/.test(info.collectionCommit)||info.collectionSnapshot!==catalog.editionInfo.snapshot)throw Error('Build and collection identity mismatch.');
  return {files:count,bytes:total,checked:true};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)console.log(JSON.stringify(await checkWebRelease(process.argv[2]||'web-release')));
