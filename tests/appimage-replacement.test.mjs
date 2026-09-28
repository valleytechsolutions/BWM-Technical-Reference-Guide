import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const source=fs.readFileSync(new URL('../electron/desktop-updater.cjs',import.meta.url),'utf8');
function updater(target){
 const calls=[],module={exports:{}};
 vm.runInNewContext(source,{module,process:{platform:'linux',env:{APPIMAGE:target},chdir:dir=>calls.push({cwd:dir})},require:name=>name==='electron-updater'?{AppImageUpdater:class{},DebUpdater:class{}}:name==='electron'?{app:{relaunch:options=>calls.push(JSON.parse(JSON.stringify(options)))}}:require(name)});
 return {engine:module.exports.desktopUpdater(),calls};
}
test('AppImage keeps the working file if the replacement cannot be copied',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'bw-appimage-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const target=path.join(dir,'Black-Wire.AppImage');fs.writeFileSync(target,'working installation');
 const {engine,calls}=updater(target);engine.installerPath=path.join(dir,'missing-download');
 assert.throws(()=>engine.doInstall({isForceRunAfter:true}));
 assert.equal(fs.readFileSync(target,'utf8'),'working installation');assert.deepEqual(calls,[]);
 assert.deepEqual(fs.readdirSync(dir),['Black-Wire.AppImage']);
});
// Exercise Linux filesystem semantics on the same OS that runs AppImages.
test('AppImage replacement retains the verified download and schedules launch after exit',{skip:process.platform!=='linux'},t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'bw-appimage-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const target=path.join(dir,'Black-Wire.AppImage'),download=path.join(dir,'download.AppImage');
 fs.writeFileSync(target,'old installation');fs.writeFileSync(download,'verified new installation');
 const {engine,calls}=updater(target);engine.installerPath=download;
 assert.equal(engine.doInstall({isForceRunAfter:true}),true);
 assert.equal(fs.readFileSync(target,'utf8'),'verified new installation');assert.equal(fs.readFileSync(download,'utf8'),'verified new installation');
 assert.deepEqual(calls,[{cwd:dir},{execPath:target,args:[]}]);
 assert.deepEqual(fs.readdirSync(dir).sort(),['Black-Wire.AppImage','download.AppImage']);
});
