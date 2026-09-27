import {searchBoards,normalize} from './domain.mjs';
import {searchMakerParts} from './maker-search.mjs';
import {searchWiringGuides} from './wiring-guides.mjs';
export function searchCatalog(catalog,query,{scope='all',pinoutsOnly=false}={}){
 if(!query.trim())return [];
 const makers=['all','makers'].includes(scope)?searchMakerParts(catalog.makerParts||[],{query,pinoutsOnly}):[];
 const linked=new Set(scope==='all'?makers.flatMap(p=>p.boardIds):[]);
 const boards=['all','boards'].includes(scope)?searchBoards(catalog.boards||[],{query,includeUndocumented:true}).filter(b=>!linked.has(b.id)):[];
 const guides=!pinoutsOnly&&['all','wiring'].includes(scope)?searchWiringGuides(catalog.wiringGuides||[],query):[];
 const q=normalize(query);
 return [...makers.map(record=>({kind:'maker',record})),...boards.map(record=>({kind:'board',record})),...guides.map(record=>({kind:'wiring',record}))]
  .filter(x=>!pinoutsOnly||x.record.pinoutCoverage?.physicalCount>0)
  .map((x,i)=>({...x,rank:normalize(x.record.name)===q?10000:((x.record.aliases||[]).some(a=>normalize(a)===q)?9000:0)+(x.record.pinoutCoverage?.physicalCount?50:0)-i/1000}))
  .sort((a,b)=>b.rank-a.rank);
}
