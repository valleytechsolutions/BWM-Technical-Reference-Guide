const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('blackwire',Object.freeze({
 maintenance:()=>ipcRenderer.invoke('bw:maintenance'),
 libraryAction:action=>ipcRenderer.invoke('bw:library-action',action),
 updateAction:action=>ipcRenderer.invoke('bw:update-action',action),
 loadState:()=>ipcRenderer.invoke('bw:load'),
 saveState:state=>ipcRenderer.invoke('bw:save',state),
 openSource:url=>ipcRenderer.invoke('bw:external',url),
 openOriginal:file=>ipcRenderer.invoke('bw:original',file),
 saveAsset:(file,name)=>ipcRenderer.invoke('bw:save-asset',file,name),
 exportBackup:json=>ipcRenderer.invoke('bw:export',json),
 platform:process.platform
}));
