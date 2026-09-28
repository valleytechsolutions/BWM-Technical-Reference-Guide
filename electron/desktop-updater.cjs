const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const {DebUpdater}=require('electron-updater');

class SafeDebUpdater extends DebUpdater{
 get installerPath(){return this.downloadedUpdateHelper?.file||null;}
 doInstall(options){
  if(!this.installerPath)throw Error('No verified update is available');
  // apt resolves dependencies with its normal repository signature checks.
  this.runCommandWithSudoIfNeeded(['apt-get','install','-y',this.installerPath]);
  if(options.isForceRunAfter)this.app.relaunch();
  return true;
 }
 runCommandWithSudoIfNeeded(args){
  if(!['dpkg','apt-get'].includes(args[0]))throw Error('Unsupported package manager');
  const command=`/usr/bin/${args[0]}`;let executable=command,argv=args.slice(1);
  if(!this.isRunningAsRoot()){
   // Preserve normal desktop authentication; also support administrator-managed
   // passwordless sudo without a shell or interpolated installer paths.
   const unattended=spawnSync('/usr/bin/sudo',['-n','true'],{stdio:'ignore'}).status===0;
   executable=unattended?'/usr/bin/sudo':'/usr/bin/pkexec';
   argv=[...(unattended?['-n']:[]),command,...argv];
  }
  const result=spawnSync(executable,argv,{encoding:'utf8',env:{...process.env,PATH:'/usr/sbin:/usr/bin:/sbin:/bin'}});
  if(result.error||result.status!==0)throw Error('System package installation failed or authentication was cancelled');
  return result.stdout;
 }
}
let singleton;
function desktopUpdater(){
 if(singleton)return singleton;
 if(process.platform==='linux'){
  if(!process.env.APPIMAGE&&fs.existsSync(path.join(process.resourcesPath,'package-type')))singleton=new SafeDebUpdater();
 }
 return singleton||(singleton=require('electron-updater').autoUpdater);
}
module.exports={desktopUpdater};
