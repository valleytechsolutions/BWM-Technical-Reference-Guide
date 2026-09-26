// Explicitly verified specs take precedence. Older records retain their source
// links, without mislabeling an image, repository or forum as a specification.
export function hardwareLinks(record){
 const valid=url=>{try{const u=new URL(url);return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password;}catch{return false;}};
 const specs=(record.specifications||[]).filter(s=>valid(s.url)).map(s=>({...s,label:s.label||'Specifications & hardware guide',kind:'specification'}));
 const seen=new Set(specs.map(s=>s.url));
 const sources=(record.sources||[]).map(s=>typeof s==='string'?{url:s}:s).filter(s=>valid(s?.url)&&!seen.has(s.url)&&seen.add(s.url)).map(s=>({...s,label:'Hardware source documentation',kind:'source'}));
 return [...specs,...sources].slice(0,5);
}
