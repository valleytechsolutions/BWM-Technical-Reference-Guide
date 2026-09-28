const {EventEmitter}=require('node:events');
class Updates extends EventEmitter{
 constructor({updater,version,supported,beforeInstall}){
  super();this.updater=updater;this.beforeInstall=beforeInstall;this.busy=false;
  this.state={version,phase:supported?'idle':'unsupported',availableVersion:null,percent:0,error:''};
  if(!supported)return;
  updater.autoDownload=false;updater.autoInstallOnAppQuit=false;updater.allowDowngrade=false;updater.allowPrerelease=false;
  updater.on('checking-for-update',()=>this.set({phase:'checking',error:''}));
  updater.on('update-available',info=>this.set({phase:'available',availableVersion:info.version,error:''}));
  updater.on('update-not-available',()=>this.set({phase:'current',error:''}));
  updater.on('download-progress',p=>this.set({phase:'downloading',percent:Math.min(100,Math.max(0,p.percent))}));
  updater.on('update-downloaded',info=>this.set({phase:'ready',availableVersion:info.version,percent:100,error:''}));
  updater.on('error',()=>this.set({phase:'error',error:'The update could not complete. Check your connection, free disk space and permissions, then retry. Your current app and saved workbench are kept.'}));
 }
 set(patch){this.state={...this.state,...patch};this.emit('status',this.state);}
 async action(action){
  if(this.state.phase==='unsupported'||this.busy)return this.state;
  if(action==='check'&&['ready','downloading','installing'].includes(this.state.phase))return this.state;
  if(action==='download'&&this.state.phase!=='available')return this.state;
  if(action==='install'&&this.state.phase!=='ready')return this.state;
  if(!['check','download','install'].includes(action))throw Error('Unknown update action');
  this.busy=true;
  try{
   if(action==='check')await this.updater.checkForUpdates();
   if(action==='download'){this.set({phase:'downloading',percent:0,error:''});await this.updater.downloadUpdate();}
   if(action==='install'){this.set({phase:'installing',error:''});await this.beforeInstall();this.updater.quitAndInstall(true,true);}
  }catch{this.set({phase:'error',error:'The update could not complete. Check your connection, free disk space and permissions, then retry. Your current app and saved workbench are kept.'});}
  finally{this.busy=false;}
  return this.state;
 }
}
module.exports={Updates};
