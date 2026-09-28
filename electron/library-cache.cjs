const fs=require('node:fs/promises');
const path=require('node:path');
const {createHash,randomUUID}=require('node:crypto');
const {EventEmitter}=require('node:events');
const hash=b=>createHash('sha256').update(b).digest('hex');
const safePath=s=>typeof s==='string'&&/^[a-zA-Z0-9_.\-/]+$/.test(s)&&!s.split('/').some(p=>!p||p==='.'||p==='..');
function validateIndex(index){
 if(index?.schema!==1||!/^[a-f0-9]{40}$/.test(index.commit)||!Array.isArray(index.files)||index.files.length>100000)throw Error('Invalid library index');
 const seen=new Set();
 for(const f of index.files){
  if(!safePath(f.path)||seen.has(f.path)||!/^[a-f0-9]{64}$/.test(f.sha256)||!Number.isSafeInteger(f.size)||f.size<1||f.size>100*1024*1024||typeof f.bundled!=='boolean')throw Error('Invalid library entry');
  seen.add(f.path);
 }
 return index;
}
class LibraryCache extends EventEmitter{
 constructor({index,root,seed,legacy=[],fetcher=fetch}){
  super();this.index=validateIndex(index);this.entries=new Map(index.files.map(f=>[f.path,f]));this.root=root;this.seed=seed;this.legacy=legacy;this.fetcher=fetcher;
  this.ready=new Map();this.pending=new Map();this.running=false;this.scanning=true;this.stopped=false;this.error='';this.batch=null;
 }
 status(){let bytes=0;for(const name of this.ready.keys())bytes+=this.entries.get(name).size;return {snapshot:this.index.snapshot,total:this.entries.size,available:this.ready.size,bytes,totalBytes:this.index.files.reduce((n,f)=>n+f.size,0),scanning:this.scanning,running:this.running,complete:this.ready.size===this.entries.size,error:this.error};}
 changed(){this.emit('status',this.status());}
 object(f){return path.join(this.root,f.sha256+path.extname(f.path));}
 async valid(file,f){try{const stat=await fs.stat(file);if(!stat.isFile()||stat.size!==f.size)return false;return hash(await fs.readFile(file))===f.sha256;}catch(e){if(['ENOENT','EACCES','EPERM'].includes(e.code))return false;throw e;}}
 async local(f){
  const choices=[...(f.bundled?[path.join(this.seed,f.path)]:[]),this.object(f),...this.legacy.map(root=>path.join(root,f.path))];
  for(const file of choices)if(await this.valid(file,f)){this.ready.set(f.path,file);return file;}
  return null;
 }
 async initialize(){
  try{await fs.mkdir(this.root,{recursive:true});}catch(e){this.scanning=false;throw e;}
  // Interrupted writes are never presented as available references.
  for(const n of await fs.readdir(this.root))if(/^[a-f0-9-]+\.partial$/.test(n))await fs.rm(path.join(this.root,n),{force:true});
  try{let n=0;for(const f of this.entries.values()){if(this.stopped)break;if(!this.ready.has(f.path))await this.local(f);if(++n%100===0)this.changed();}}
  finally{this.scanning=false;this.changed();}
 }
 async get(name){
  const f=this.entries.get(name);if(!f)throw Error('Reference is not in this collection');
  const known=this.ready.get(name);
  if(known){try{await fs.access(known);return known;}catch{this.ready.delete(name);}}
  if(this.pending.has(name))return this.pending.get(name);
  const job=(async()=>{const local=await this.local(f);if(local)return local;if(this.stopped)throw Error('Library is closing');return this.download(f);})();
  this.pending.set(name,job);
  try{return await job;}finally{this.pending.delete(name);this.changed();}
 }
 async download(f){
  const encoded=f.path.split('/').map(encodeURIComponent).join('/');
  // A moving CDN is an optimization only: the bundled hash is authoritative.
  // The pinned Git commit is the fallback for retired or changed CDN paths.
  const urls=[`https://valleytech-black-wire-guide.pages.dev/library/${encoded}`,`https://raw.githubusercontent.com/valleytechsolutions/black-wire-pinouts/${this.index.commit}/library/${encoded}`];
  for(let attempt=0;attempt<urls.length;attempt++){
   const temporary=path.join(this.root,randomUUID()+'.partial');
   let handle;
   try{
    if(this.stopped)throw Error('Library is closing');
    const disk=await fs.statfs(this.root);if(disk.bavail*disk.bsize<f.size+32*1024*1024)throw Object.assign(Error('Not enough free disk space'),{code:'ENOSPC'});
    const response=await this.fetcher(urls[attempt],{signal:AbortSignal.timeout(60000)});
    if(!response.ok||!response.body)throw Error('Reference download unavailable');
    handle=await fs.open(temporary,'wx');let size=0;const digest=createHash('sha256');
    for await(const chunk of response.body){size+=chunk.length;if(size>f.size)throw Error('Reference size mismatch');digest.update(chunk);await handle.writeFile(chunk);}
    if(size!==f.size||digest.digest('hex')!==f.sha256)throw Error('Reference integrity check failed');
    await handle.sync();await handle.close();handle=null;
    await fs.rename(temporary,this.object(f));this.ready.set(f.path,this.object(f));return this.object(f);
   }catch(e){
    if(['ENOSPC','EACCES','EPERM'].includes(e.code))throw Error(e.code==='ENOSPC'?'Not enough disk space. Free space, then retry; downloaded references are kept.':'Cannot write the offline library. Check this account’s folder permissions.');
    if(attempt===urls.length-1)throw Error('Reference download failed or did not match its checksum. Check your connection and retry; verified files are kept.');
   }finally{await handle?.close();await fs.rm(temporary,{force:true}).catch(()=>{});}
  }
 }
 start(){
  if(this.scanning||this.stopped)return;
  this.running=true;this.error='';this.changed();
  if(this.batch)return;
  const todo=this.index.files.filter(f=>!this.ready.has(f.path));let cursor=0;
  const worker=async()=>{while(this.running&&cursor<todo.length){const f=todo[cursor++];try{await this.get(f.path);}catch(e){this.error=e.message;this.running=false;}}};
  this.batch=Promise.all(Array.from({length:4},worker)).finally(()=>{this.batch=null;this.running=false;this.changed();});
 }
 pause(){this.running=false;this.changed();} // Finish at most four bounded files; retain their verified bytes.
 async close(){this.stopped=true;this.pause();await Promise.allSettled([...this.pending.values()]);}
}
module.exports={LibraryCache,validateIndex};
