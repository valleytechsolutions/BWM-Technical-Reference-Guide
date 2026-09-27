import {normalize} from './domain.mjs';
import {safeSourceURL} from './hardware-links.mjs';
const indexes=new WeakMap();
export function searchWiringGuides(guides=[],query='',category=''){
 const q=normalize(query),terms=String(query).normalize('NFKD').toLowerCase().match(/[a-z0-9]+/g)||[];
 if(query.trim()&&!q)return [];
 return guides.filter(g=>!category||g.category===category).map(g=>{
  let index=indexes.get(g);
  if(!index){index={names:[g.name,...g.aliases].map(normalize),text:[g.name,g.category,g.summary,...g.aliases,...g.rows.flat()].map(normalize).join('\0')};indexes.set(g,index);}
  const exact=index.names.includes(q),match=!q||exact||index.text.includes(q)||terms.every(t=>index.text.includes(t));
  return {g,match,rank:exact?100:normalize(g.name).includes(q)?10:0};
 }).filter(r=>r.match).sort((a,b)=>b.rank-a.rank).map(r=>r.g);
}

export function validateWiringGuides(guides=[],makerIds=new Set()){
 const errors=[],ids=new Set();
 for(const g of guides){
  if(!/^[a-z0-9-]+$/.test(g.id)||ids.has(g.id))errors.push('Invalid or duplicate wiring ID: '+g.id);ids.add(g.id);
  for(const key of ['name','summary','scope','useWhen','why','review','rights','revision'])if(typeof g[key]!=='string'||!g[key].trim())errors.push('Missing '+key+': '+g.id);
  if(g.kind!=='wiring-guide'||g.image?.type!=='original connection diagram')errors.push('Incorrect wiring reference type: '+g.id);
  if(!/^wiring\/[a-z0-9-]+\.svg$/.test(g.image?.file||'')||!/^[a-f0-9]{64}$/.test(g.image?.hash||''))errors.push('Invalid wiring image: '+g.id);
  if(!g.sources?.length||g.sources.some(s=>!safeSourceURL(s.url)||!s.title||!s.locator||!s.checked))errors.push('Missing wiring sources: '+g.id);
  if(!g.rows?.length||g.rows.some(r=>r.length!==g.columns?.length))errors.push('Invalid wiring table: '+g.id);
  for(const id of g.relatedParts||[])if(!makerIds.has(id))errors.push('Unknown wiring module: '+id);
  if(g.pinoutCoverage?.physicalCount||g.completePhysicalPinout)errors.push('Connection guides cannot count as physical board pinouts: '+g.id);
 }
 for(const g of guides)for(const id of g.relatedGuides||[])if(!ids.has(id))errors.push('Unknown related guide: '+id);
 return errors;
}
