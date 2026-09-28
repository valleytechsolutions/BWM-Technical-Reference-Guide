import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {Updates} from '../electron/updates.cjs';
test('updates require an explicit download and restart, saving work first',async()=>{
 const engine=new EventEmitter();const calls=[];
 engine.checkForUpdates=async()=>{calls.push('check');engine.emit('update-available',{version:'2.0.0'});};
 engine.downloadUpdate=async()=>{calls.push('download');engine.emit('download-progress',{percent:52});engine.emit('update-downloaded',{version:'2.0.0'});};
 engine.quitAndInstall=(silent,restart)=>{assert.equal(silent,true);assert.equal(restart,true);calls.push('install');};
 const u=new Updates({updater:engine,version:'1.0.0',supported:true,beforeInstall:async()=>calls.push('save')});
 assert.equal(engine.autoDownload,false);assert.equal(engine.autoInstallOnAppQuit,false);assert.equal(engine.allowDowngrade,false);assert.equal(engine.allowPrerelease,false);
 await u.action('install');assert.deepEqual(calls,[]);await u.action('check');assert.equal(u.state.phase,'available');assert.deepEqual(calls,['check']);await u.action('download');assert.equal(u.state.phase,'ready');await u.action('check');assert.equal(u.state.phase,'ready');await u.action('install');assert.deepEqual(calls,['check','download','save','install']);
});
test('failed download preserves current app, reports an actionable error and can retry',async()=>{
 const engine=new EventEmitter();let checks=0;engine.checkForUpdates=async()=>{checks++;engine.emit('update-available',{version:'2.0.0'});};engine.downloadUpdate=async()=>{throw Error('private absolute path / token must not be displayed');};
 const u=new Updates({updater:engine,version:'1.0.0',supported:true,beforeInstall:async()=>{}});await u.action('check');await u.action('download');assert.equal(u.state.phase,'error');assert.doesNotMatch(u.state.error,/token|absolute path/);await u.action('check');assert.equal(checks,2);assert.equal(u.state.phase,'available');
});
test('unsupported builds cannot start update installs',async()=>{const u=new Updates({updater:new EventEmitter(),version:'1.0.0',supported:false});await u.action('install');assert.equal(u.state.phase,'unsupported');});
