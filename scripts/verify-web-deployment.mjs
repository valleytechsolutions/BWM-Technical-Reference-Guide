import fs from 'node:fs/promises';
import crypto from 'node:crypto';
const production='https://valleytech-black-wire-guide.pages.dev/';
const input=process.env.GUIDE_DEPLOYMENT_URL;
if(!input)throw Error('Cloudflare did not return a deployment URL.');
const deployed=new URL(input);
if(deployed.protocol!=='https:'||deployed.username||deployed.password||!(deployed.hostname==='valleytech-black-wire-guide.pages.dev'||deployed.hostname.endsWith('.valleytech-black-wire-guide.pages.dev')))throw Error('Unexpected deployment host.');
const expected=await fs.readFile('web-release/build-info.json');
const hash=b=>crypto.createHash('sha256').update(Buffer.from(b)).digest('hex');
async function get(url){const r=await fetch(url,{signal:AbortSignal.timeout(30000),cache:'no-store'});if(!r.ok)throw Error(`HTTP ${r.status} at ${new URL(url).pathname}`);return r;}
// The immutable deployment must be correct before checking production propagation.
if(hash(await(await get(new URL('/build-info.json',deployed))).arrayBuffer())!==hash(expected))throw Error('Deployed build identity mismatch.');
let current=false;
for(let attempt=0;attempt<12;attempt++){
  try{current=hash(await(await get(new URL('build-info.json?commit='+JSON.parse(expected).appCommit,production))).arrayBuffer())===hash(expected);}catch{}
  if(current)break;
  await new Promise(resolve=>setTimeout(resolve,5000));
}
if(!current)throw Error('Production did not reach the new build; inspect Cloudflare before retrying.');
const catalog=await fs.readFile('web-release/catalog.json');
for(const rel of ['catalog.json','wiki/index.html','wiki.css']){
  const remote=await(await get(new URL(rel,production))).arrayBuffer();
  if(hash(remote)!==hash(await fs.readFile('web-release/'+rel)))throw Error('Published bytes differ: '+rel);
}
const html=await(await get(production)).text();
const localHTML=await fs.readFile('web-release/index.html','utf8');
for(const m of localHTML.matchAll(/(?:src|href)="([^\"]*assets\/[^\"]+)"/g)){
  if(!html.includes(m[1]))throw Error('Production entry page references old assets.');
  const rel=m[1].replace(/^\//,'');
  if(hash(await(await get(new URL(rel,production))).arrayBuffer())!==hash(await fs.readFile('web-release/'+rel)))throw Error('Published app asset differs.');
}
const boards=JSON.parse(catalog).boards;
const sample=boards.flatMap(b=>b.assets).find(a=>a.type==='pinout image'&&a.hash);
if(!sample)throw Error('No pinout sample available.');
if(hash(await(await get(new URL('library/'+sample.file,production))).arrayBuffer())!==sample.hash)throw Error('Live original pinout hash mismatch.');
const store=await(await get('https://valleytechsolutions.tech/pages/bwm-technical-reference-guide')).text();
if(!/<iframe\b[^>]*src="https:\/\/valleytech-black-wire-guide\.pages\.dev\/"/i.test(store))throw Error('Shopify guide embed not found.');
console.log('Verified production build identity, catalog, wiki, app assets, original pinout and Shopify embed.');
