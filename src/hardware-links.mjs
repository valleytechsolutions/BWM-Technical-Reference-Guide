export const documentKinds={datasheet:'Datasheet','hardware-guide':'Hardware guide',schematic:'Schematic','connector-reference':'Connector reference','design-files':'Design files'};
export function safeSourceURL(url){try{const u=new URL(url);return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password;}catch{return false;}}
export function safeLibraryPath(file){return typeof file==='string'&&/^media\/[a-f0-9]{64}\.(pdf|png|jpg|jpeg|svg|webp)$/i.test(file);}

// Resources are explicitly typed by the researcher. Neither a filename nor a
// chip datasheet is evidence that the exact board has a datasheet.
export function hardwareLinks(record){
 const d=record.documentation||{},seen=new Set();
 const website=d.website&&safeSourceURL(d.website.url)?[{...d.website,kind:'website',label:d.website.label||'Original manufacturer website'}]:[];
 const resources=(d.resources||[]).filter(s=>safeSourceURL(s.url)).map(s=>({...s,label:s.label||documentKinds[s.kind]||'Hardware document',file:safeLibraryPath(s.file)?s.file:undefined,kind:s.kind||'source'}));
 const specs=(record.specifications||[]).filter(s=>safeSourceURL(s.url)).map(s=>({...s,label:s.label||'Specifications & hardware guide',kind:'specification'}));
 const sources=(record.sources||[]).map(s=>typeof s==='string'?{url:s}:s).filter(s=>safeSourceURL(s?.url)).map(s=>({...s,label:'Hardware source documentation',kind:'source'}));
 // Keep a typed datasheet even when its HTML URL is also the original website.
 return [...website,...resources,...specs,...sources].filter(s=>{const key=s.url+'|'+(s.kind==='website'?'website':'document');if(seen.has(key))return false;seen.add(key);return true;});
}
export function documentationSummary(record){
 const links=hardwareLinks(record),resources=record.documentation?.resources||[];
 const boardDatasheet=resources.some(s=>s.kind==='datasheet'&&s.scope==='board'&&safeSourceURL(s.url));
 const visualCount=record.documentationCoverage?.visualCount??(record.assets||[]).filter(a=>a.type!=='chip-package reference'&&(a.thumb||['png','jpg','jpeg','webp','svg','gif'].includes(a.extension))).length;
 return {boardDatasheet,website:links.some(s=>s.kind==='website'),visualCount,hardwareGuide:resources.some(s=>s.kind==='hardware-guide'&&s.scope==='board'&&safeSourceURL(s.url))};
}
