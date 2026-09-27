import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.join(path.dirname(path.dirname(fileURLToPath(import.meta.url))),'web-release');
const base=process.env.BLACKWIRE_BASE_PATH||'/';
const port=Number(process.env.BLACKWIRE_PREVIEW_PORT||5187);
if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Preview port must be an integer from 1024 to 65535.');
const csp=fs.readFileSync(path.join(root,'_headers'),'utf8').split('\n').find(line=>line.trim().startsWith('Content-Security-Policy:'))?.trim().slice('Content-Security-Policy:'.length).trim();
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.pdf':'application/pdf','.wasm':'application/wasm','.woff2':'font/woff2','.xml':'application/xml','.txt':'text/plain'};
http.createServer((req,res)=>{
 let requested;try{requested=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);return res.end();}
 if(!requested.startsWith(base)){res.writeHead(404);return res.end();}
 const relative=requested.slice(base.length)||'index.html';let file=path.resolve(root,relative);
 if(file.startsWith(root+path.sep)&&fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end('Not found');}
 const type=mime[path.extname(file)]||'application/octet-stream';res.writeHead(200,{'Content-Type':type,'X-Content-Type-Options':'nosniff',...(csp?{'Content-Security-Policy':csp}:{})});fs.createReadStream(file).pipe(res);
}).listen(port,'127.0.0.1',()=>console.log('Browser guide preview: http://127.0.0.1:'+port+base));
