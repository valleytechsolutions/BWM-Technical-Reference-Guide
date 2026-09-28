import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {LibraryCache,validateIndex} from '../electron/library-cache.cjs';
const digest=b=>createHash('sha256').update(b).digest('hex');
const entry=(name,body,bundled=false)=>({path:name,size:Buffer.byteLength(body),sha256:digest(body),bundled});
const index=files=>({schema:1,commit:'a'.repeat(40),snapshot:'test',files});
async function fixture(t,files,fetcher){const dir=await fs.mkdtemp(path.join(os.tmpdir(),'bw-cache-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));const options={index:index(files),root:path.join(dir,'cache'),seed:path.join(dir,'seed'),legacy:[path.join(dir,'legacy')],fetcher};return {dir,options,cache:new LibraryCache(options)};}
test('rejects traversal, malformed hashes, oversized entries and duplicate paths',()=>{
 for(const name of ['../secret','/root','C:/test','x\\y','a//b','a/./b','a/%2e%2e/b'])assert.throws(()=>validateIndex(index([entry(name,'x')])));
 assert.throws(()=>validateIndex(index([{...entry('x','x'),sha256:'bad'}])));
 assert.throws(()=>validateIndex(index([{...entry('x','x'),size:200*1024**2}])));
 assert.throws(()=>validateIndex(index([entry('x','x'),entry('x','x')])));
});
test('downloads only pinned references, verifies bytes, survives restart offline',async t=>{
 const urls=[];const f=entry('media/test.pdf','%PDF-reference');const {cache,options}=await fixture(t,[f],async url=>{urls.push(url);return new Response('%PDF-reference');});
 await cache.initialize();const saved=await cache.get(f.path);assert.equal(await fs.readFile(saved,'utf8'),'%PDF-reference');assert.equal(cache.status().complete,true);assert.match(urls[0],/^https:\/\/valleytech-black-wire-guide\.pages\.dev\/library\//);
 await assert.rejects(cache.get('../secret'));assert.equal(urls.length,1);
 const reopened=new LibraryCache({...options,fetcher:()=>{throw Error('offline');}});await reopened.initialize();assert.equal(await reopened.get(f.path),saved);assert.equal(reopened.status().complete,true);
});
test('corrupt CDN response uses pinned commit fallback and never exposes partial bytes',async t=>{
 const urls=[];const {cache,options}=await fixture(t,[entry('media/reference.png','right')],async url=>{urls.push(url);return new Response(urls.length===1?'wrong':'right');});
 await cache.initialize();await cache.get('media/reference.png');assert.match(urls[1],/raw\.githubusercontent\.com\/valleytechsolutions\/black-wire-pinouts\/a{40}\//);assert.equal((await fs.readdir(options.root)).some(n=>n.endsWith('.partial')),false);
});
test('truncated and oversized files fail without replacing verified references',async t=>{
 for(const body of ['x','much too large']){
  const {cache,options}=await fixture(t,[entry('media/test.png','valid')],async()=>new Response(body));await cache.initialize();await assert.rejects(cache.get('media/test.png'),/checksum/);assert.equal(cache.status().available,0);assert.deepEqual(await fs.readdir(options.root),[]);
 }
});
test('reuses verified legacy files and bundled previews without a network request',async t=>{
 const files=[entry('thumbs/t.webp','thumb',true),entry('media/r.pdf','original')];const {cache,options}=await fixture(t,files,()=>{throw Error('unexpected network');});
 for(const [root,f,body] of [[options.seed,files[0],'thumb'],[options.legacy[0],files[1],'original']]){await fs.mkdir(path.dirname(path.join(root,f.path)),{recursive:true});await fs.writeFile(path.join(root,f.path),body);}
 await cache.initialize();assert.equal(cache.status().complete,true);assert.match(await cache.get(files[1].path),/legacy/);
});
test('concurrent requests share one download; changed snapshots reuse unchanged files',async t=>{
 let requests=0;const f=entry('media/a.png','same');const {cache,options}=await fixture(t,[f],async()=>{requests++;await new Promise(r=>setTimeout(r,20));return new Response('same');});await cache.initialize();
 const paths=await Promise.all([cache.get(f.path),cache.get(f.path)]);assert.equal(paths[0],paths[1]);assert.equal(requests,1);
 const next=new LibraryCache({...options,index:index([{...f,path:'media/renamed.png'}])});await next.initialize();assert.equal(next.status().complete,true);assert.equal(requests,1);
});
test('removes interrupted files, detects corrupt cache and repairs on retry',async t=>{
 const f=entry('media/a.png','right');const {cache,options}=await fixture(t,[f],async()=>new Response('right'));await fs.mkdir(options.root,{recursive:true});await fs.writeFile(path.join(options.root,'a-b.partial'),'unfinished');await fs.writeFile(cache.object(f),'wrong');await cache.initialize();assert.equal(cache.status().complete,false);assert.equal((await fs.readdir(options.root)).some(n=>n.endsWith('.partial')),false);await cache.get(f.path);assert.equal(cache.status().complete,true);
});
test('offline batch failure is retryable and never deletes completed files',async t=>{
 let online=false;const f=entry('media/a.png','right');const {cache}=await fixture(t,[f],async()=>{if(!online)throw Error('offline');return new Response('right');});await cache.initialize();cache.start();await cache.batch;assert.match(cache.status().error,/connection/);online=true;cache.start();await cache.batch;assert.equal(cache.status().complete,true);assert.equal(cache.status().error,'');
});
