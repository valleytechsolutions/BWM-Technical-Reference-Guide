// Run only on disposable native CI runners: installs and upgrades real packages.
import {_electron as electron,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
if(process.env.CI!=='true')throw Error('Installer integration tests require a disposable CI runner');
const win=process.platform==='win32',version=JSON.parse(await fs.readFile('package.json','utf8')).version;
const mode=process.argv.includes('--appimage')?'appimage':win?'windows':'deb';
const output=path.resolve(win?`release/${version}`:'release');
const qa=path.join(os.tmpdir(),`blackwire-native-${mode}`),data=path.join(qa,'user-data');
await fs.mkdir(qa,{recursive:true});
await fs.mkdir('data/qa',{recursive:true});
const suffix=mode==='windows'?'-setup.exe':mode==='deb'?'.deb':'.AppImage';
async function asset(dir){const names=(await fs.readdir(dir)).filter(n=>n.endsWith(suffix));if(names.length!==1)throw Error(`Expected one ${suffix} package in ${dir}`);return path.join(dir,names[0]);}
function run(command,args=[]){return new Promise((resolve,reject)=>{const child=spawn(command,args,{stdio:'inherit',windowsHide:true});child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(Error(`${path.basename(command)} exited ${code}`)));});}
let executable=win?path.join(qa,'Installed app','Black Wire Technical Reference Guide.exe'):mode==='deb'?'/usr/bin/black-wire-technical-reference-guide':path.join(qa,'Black-Wire.AppImage');
async function install(file){if(win)await run(file,['/S',`/D=${path.dirname(executable)}`]);else if(mode==='deb')await run('sudo',['apt-get','install','-y','--allow-downgrades',file]);else{await fs.copyFile(file,executable);await fs.chmod(executable,0o755);}}
const env={...process.env,BLACKWIRE_TEST_DATA:data};
async function launch(expected){
 const app=await electron.launch({executablePath:executable,env,timeout:90000});const page=await app.firstWindow();
 await expect(page.getByRole('heading',{name:'Board library',exact:true})).toBeVisible({timeout:90000});
 expect(await app.evaluate(({app})=>app.getVersion())).toBe(expected);
 expect(await page.evaluate(()=>typeof window.require)).toBe('undefined');
 await page.getByRole('button',{name:'Updates & offline library',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Updates & offline library',exact:true})).toBeVisible();
 await expect.poll(()=>page.evaluate(()=>window.blackwire.maintenance().then(s=>s.library.scanning)),{timeout:120000}).toBe(false);
 return {app,page};
}
const released=await asset(output);
await install(released);
let active=await launch(version);
let catalog=await active.page.evaluate(()=>fetch('/catalog.json').then(r=>r.json()));
const board=catalog.boards.find(b=>b.name==='Teensy 4.1');const image=board.assets.find(a=>a.type==='pinout image');
const pdf=catalog.boards.flatMap(b=>b.assets).find(a=>a.extension==='pdf');
const saved={favorites:[board.id],measurements:[]};
await active.page.evaluate(s=>window.blackwire.saveState(s),saved);
for(const ref of [image,pdf]){
 const buffer=await active.page.evaluate(async file=>Array.from(new Uint8Array(await (await fetch('/library/'+file)).arrayBuffer())),ref.file);
 expect(createHash('sha256').update(Buffer.from(buffer)).digest('hex')).toBe(ref.hash);
}
const before=await fs.readdir(path.join(data,'reference-cache'));
expect(before.length).toBeGreaterThan(0);
await active.page.screenshot({path:`data/qa/${mode}-installed-updates.png`});
await active.app.close();

// The baseline is the same code packaged as a lower QA-only version. It is
// never uploaded to Releases. Test a real updater download and install.
await install(await asset(path.resolve('qa-build')));
active=await launch('0.13.99');
expect(await active.page.evaluate(()=>window.blackwire.loadState())).toEqual(saved);
let legacy;
if(win){
 const resources=await active.app.evaluate(()=>process.resourcesPath);legacy=path.join(resources,'library');
 await fs.mkdir(path.dirname(path.join(legacy,image.file)),{recursive:true});
 await fs.copyFile(path.join('library',image.file),path.join(legacy,image.file));
 await fs.writeFile(path.join(legacy,'manifest.json'),JSON.stringify([image.file]));
}
let failFeed=true;
const server=http.createServer(async(req,res)=>{
 try{const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname).slice(1);if(name!==path.basename(name)||failFeed){res.writeHead(503);res.end();return;}
 const file=path.join(output,name);const bytes=await fs.readFile(file);res.writeHead(200,{'Content-Length':bytes.length});res.end(bytes);
 }catch{res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const feed=`http://127.0.0.1:${server.address().port}/`;
await active.app.evaluate(({app},url)=>{const require=process.getBuiltinModule('module').createRequire(app.getAppPath()+'/package.json');const updater=require(require('node:path').join(app.getAppPath(),'electron/desktop-updater.cjs')).desktopUpdater();updater.setFeedURL({provider:'generic',url});},feed);
await active.page.getByRole('button',{name:'Check for updates',exact:true}).click();
await expect(active.page.getByRole('alert')).toContainText('could not complete',{timeout:60000});
failFeed=false;
await active.page.getByRole('button',{name:'Check for updates',exact:true}).click();
await expect(active.page.getByRole('button',{name:'Download update',exact:true})).toBeVisible({timeout:60000});
await active.page.getByRole('button',{name:'Download update',exact:true}).click();
await expect(active.page.getByRole('button',{name:'Restart & update',exact:true})).toBeVisible({timeout:180000});
await active.page.screenshot({path:`data/qa/${mode}-update-ready.png`});
const exited=new Promise(resolve=>active.app.once('close',resolve));
await active.page.getByRole('button',{name:'Restart & update',exact:true}).click();
await Promise.race([exited,new Promise((_,reject)=>setTimeout(()=>reject(Error('Updater did not close the previous app')),120000))]);
// Allow the real installer and automatic relaunch to finish. Then reconnect
// with Playwright by closing only this disposable runner's Black Wire process.
await new Promise(r=>setTimeout(r,45000));
if(win)await run('taskkill',['/F','/IM','Black Wire Technical Reference Guide.exe']);
else await run('pkill',['-f',mode==='deb'?'^/opt/Black Wire Technical Reference Guide/black-wire-technical-reference-guide':'^/tmp/\.mount_.*/black-wire-technical-reference-guide']);
active=await launch(version);
expect(await active.page.evaluate(()=>window.blackwire.loadState())).toEqual(saved);
for(const name of before)expect(await fs.stat(path.join(data,'reference-cache',name)).then(s=>s.size)).toBeGreaterThan(0);
if(win){const preserved=path.join(process.env.LOCALAPPDATA,'BlackWire','legacy-library',image.file);expect(createHash('sha256').update(await fs.readFile(preserved)).digest('hex')).toBe(image.hash);}
// The cached original remains usable with network downloads refused.
await active.app.evaluate(({app})=>{const require=process.getBuiltinModule('module').createRequire(app.getAppPath()+'/package.json');const mod=require(require('node:path').join(app.getAppPath(),'electron/library-cache.cjs'));mod.LibraryCache.prototype.download=async()=>{throw Error('Offline test');};});
const cached=await active.page.evaluate(async file=>Array.from(new Uint8Array(await (await fetch('/library/'+file)).arrayBuffer())),image.file);
expect(createHash('sha256').update(Buffer.from(cached)).digest('hex')).toBe(image.hash);
await active.app.close();server.close();
await fs.mkdir('data/qa',{recursive:true});
await fs.writeFile(`data/qa/installer-${mode}.json`,JSON.stringify({passed:true,platform:process.platform,mode,version,checks:['fresh package install','native sandboxed launch','on-demand image and PDF checksum','failed update check recovery','real update download','real update install and automatic relaunch','workbench persistence','offline cache persistence',...(win?['legacy library migration']:[])]},null,2));
console.log(`PASS ${mode}: clean install, updater ${version}, preserved saved data and offline references.`);
