const {app,BrowserWindow,protocol,net,ipcMain,dialog,shell,session,Menu}=require('electron');
const path=require('node:path');
const fs=require('node:fs/promises');
const {pathToFileURL}=require('node:url');
const {contained,externalURL}=require('./paths.cjs');
const {LibraryCache}=require('./library-cache.cjs');
const {Updates}=require('./updates.cjs');
protocol.registerSchemesAsPrivileged([{scheme:'blackwire',privileges:{standard:true,secure:true,supportFetchAPI:true,stream:true,corsEnabled:true}}]);
app.setName('Black Wire Technical Reference Guide');
if(process.env.BLACKWIRE_TEST_DATA)app.setPath('userData',process.env.BLACKWIRE_TEST_DATA);
const appRoot=path.join(__dirname,'..');
const library=app.isPackaged?path.join(process.resourcesPath,'library'):path.join(appRoot,'library');
let window,cache,updates;let writeQueue=Promise.resolve(),saveFailure=false;
if(!app.requestSingleInstanceLock()){app.quit();}else app.on('second-instance',()=>{if(window){if(window.isMinimized())window.restore();window.show();window.focus();}});
const senderOK=e=>e.senderFrame?.url?.startsWith('blackwire://app/');
function verify(e){if(!senderOK(e))throw new Error('Untrusted sender');}
async function libraryFile(relative){return cache.entries.has(relative)?cache.get(relative):null;}
const statePath=()=>path.join(app.getPath('userData'),'workbench.json');
async function readState(){try{return JSON.parse(await fs.readFile(statePath(),'utf8'));}catch(e){if(e.code==='ENOENT')return {};throw new Error('Saved workbench could not be read. Your file has not been overwritten.');}}
function validState(s){return s&&Array.isArray(s.favorites)&&s.favorites.length<20000&&s.favorites.every(x=>typeof x==='string')&&Array.isArray(s.measurements)&&s.measurements.length<=10000&&JSON.stringify(s).length<5000000;}
function installIPC(){
 ipcMain.handle('bw:maintenance',e=>{verify(e);return {library:cache.status(),update:updates.state};});
 ipcMain.handle('bw:library-action',(e,action)=>{verify(e);if(action==='download')cache.start();else if(action==='pause')cache.pause();else throw Error('Unknown library action');return cache.status();});
 ipcMain.handle('bw:update-action',(e,action)=>{verify(e);return updates.action(action);});
 ipcMain.handle('bw:load',async e=>{verify(e);return readState();});
 ipcMain.handle('bw:save',async(e,state)=>{verify(e);if(!validState(state))throw new Error('Invalid workbench data');const text=JSON.stringify(state,null,2);const task=async()=>{await fs.mkdir(app.getPath('userData'),{recursive:true});await fs.writeFile(statePath()+'.tmp',text);await fs.rename(statePath()+'.tmp',statePath());return true;};const result=writeQueue.then(task);writeQueue=result.then(()=>{saveFailure=false;},()=>{saveFailure=true;});return result;});
 ipcMain.handle('bw:external',async(e,url)=>{verify(e);const u=externalURL(url);if(!u)throw new Error('Only HTTP(S) source links are supported');await shell.openExternal(u);});
 ipcMain.handle('bw:original',async(e,relative)=>{verify(e);const file=await libraryFile(relative);if(!file)throw new Error('Reference is not in the library');return shell.openPath(file);});
 ipcMain.handle('bw:save-asset',async(e,relative,filename)=>{verify(e);const file=await libraryFile(relative);if(!file)throw new Error('Reference is not in the library');const ext=path.extname(file);const name=String(filename||'Black-Wire-reference').replace(/[<>:"/\\|?*\x00-\x1f]/g,'-').slice(0,160);const result=await dialog.showSaveDialog(window,{title:'Save original reference',defaultPath:name+ext});if(result.canceled)return false;await fs.copyFile(file,result.filePath);return true;});
 ipcMain.handle('bw:export',async(e,data)=>{verify(e);if(typeof data!=='string'||data.length>5000000)throw new Error('Invalid backup');JSON.parse(data);const result=await dialog.showSaveDialog(window,{title:'Export your Black Wire workbench',defaultPath:'Black-Wire-workbench.json',filters:[{name:'JSON backup',extensions:['json']}]});if(result.canceled)return false;await fs.writeFile(result.filePath,data);return true;});
}
async function createWindow(){
 window=new BrowserWindow({width:1440,height:960,minWidth:860,minHeight:620,title:'Black Wire Technical Reference Guide',backgroundColor:'#0a0808',icon:path.join(appRoot,'dist/brand/black-wire.png'),show:false,webPreferences:{preload:path.join(__dirname,'preload.cjs'),sandbox:true,contextIsolation:true,nodeIntegration:false,webSecurity:true}});
 window.webContents.setWindowOpenHandler(({url})=>{const u=externalURL(url);if(u)shell.openExternal(u);return {action:'deny'};});
 window.webContents.on('will-navigate',(e,url)=>{if(!url.startsWith('blackwire://app/')){e.preventDefault();const u=externalURL(url);if(u)shell.openExternal(u);}});
 window.webContents.on('will-attach-webview',e=>e.preventDefault());
 await window.loadURL('blackwire://app/index.html');
 window.once('ready-to-show',()=>window.show());window.show();
}
app.whenReady().then(async()=>{
 const bundle=app.isPackaged?path.join(process.resourcesPath,'desktop-library'):path.join(appRoot,'build/desktop-library');
 const index=JSON.parse(await fs.readFile(path.join(bundle,'index.json'),'utf8'));
 cache=new LibraryCache({index,root:path.join(app.getPath('userData'),'reference-cache'),seed:path.join(bundle,'seed'),legacy:[library,...(process.platform==='win32'&&process.env.LOCALAPPDATA?[path.join(process.env.LOCALAPPDATA,'BlackWire','legacy-library')]:[])]});
 cache.initialize().catch(()=>{cache.error='The offline library could not be scanned. Check disk space and permissions, then reopen the app.';cache.changed();});
 const autoUpdater=require('./desktop-updater.cjs').desktopUpdater();
 const supported=app.isPackaged&&(process.platform==='win32'||(process.platform==='linux'&&(process.env.APPIMAGE||await fs.access(path.join(process.resourcesPath,'package-type')).then(()=>true,()=>false))));
 updates=new Updates({updater:autoUpdater,version:app.getVersion(),supported:!!supported,beforeInstall:async()=>{await writeQueue;if(saveFailure)throw Error('The workbench must be saved before installing an update');cache.pause();}});
 protocol.handle('blackwire',async request=>{
   try{
    const url=new URL(request.url);if(url.hostname!=='app')return new Response('Not found',{status:404});
    const rel=decodeURIComponent(url.pathname.slice(1));
    let file;if(rel.startsWith('library/'))file=await libraryFile(rel.slice(8));else file=contained(path.join(appRoot,'dist'),rel||'index.html');
    if(!file)return new Response('Not found',{status:404});
    const result=await net.fetch(pathToFileURL(file).href);const headers=new Headers(result.headers);
    headers.set('Content-Security-Policy',"default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-src 'self' blob:; object-src 'none'; base-uri 'none'; form-action 'none'");
    headers.set('X-Content-Type-Options','nosniff');return new Response(result.body,{status:result.status,headers});
   }catch{return new Response('Reference not available',{status:404});}
 });
 session.defaultSession.setPermissionRequestHandler((_wc,_p,callback)=>callback(false));session.defaultSession.setPermissionCheckHandler(()=>false);
 installIPC();
 Menu.setApplicationMenu(Menu.buildFromTemplate([
  ...(process.platform==='darwin'?[{label:app.name,submenu:[{role:'about'},{type:'separator'},{role:'hide'},{role:'quit'}]}]:[]),
  {label:'Edit',submenu:[{role:'undo'},{role:'redo'},{type:'separator'},{role:'cut'},{role:'copy'},{role:'paste'},{role:'selectAll'}]},
  {label:'View',submenu:[{role:'resetZoom'},{role:'zoomIn'},{role:'zoomOut'},{role:'togglefullscreen'}]},
  {label:'Window',submenu:[{role:'minimize'},{role:'close'}]}
 ]));
 await createWindow();
 if(supported&&!process.env.BLACKWIRE_TEST_DATA){setTimeout(()=>updates.action('check'),15000).unref();setInterval(()=>updates.action('check'),4*60*60*1000).unref();}
 app.on('activate',()=>{if(!BrowserWindow.getAllWindows().length)createWindow();});
}).catch(error=>{dialog.showErrorBox('Black Wire could not start',error.message);app.quit();});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});
