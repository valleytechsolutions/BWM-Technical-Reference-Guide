import {createSearchCache} from './search-cache.mjs';
const cachedSearch=createSearchCache();
// Search facts identify hardware; they never infer electrical compatibility.
const cache=new WeakMap();
const synonyms={modules:'module',screen:'display',screens:'display',displays:'display',epd:'epaper',eink:'epaper',iic:'i2c',twi:'i2c',buttons:'button',knob:'encoder',rotary:'encoder',pot:'potentiometer',sensors:'sensor',humidity:'humidity',temp:'temperature',stepup:'boost',stepdown:'buck',charger:'charging',chargers:'charging'};
export function makerWords(value){
 const text=String(value??'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/\p{Pd}/gu,'-')
  .replace(/step[\s-]*up/g,'boost').replace(/step[\s-]*down/g,'buck')
  .replace(/e[\s-]*(?:paper|ink)/g,'epaper').replace(/i[\s-]*2[\s-]*c/g,'i2c')
  .replace(/(\d+)\s*(?:x|×|by)\s*(\d+)/g,'$1x$2')
  .replace(/\b(ssd|sh|st|ili|gc|pcd|hd|pcf|ht|tm|ky|bme|bmp|ina|mcp|ads|apds|drv|max|pca|tp|xl|mt|lm|mp|cn|ip|bq)[\s_-]+(?=\d)/g,'$1');
 return (text.match(/[a-z0-9]+(?:\.[0-9]+)*|\++/g)||[]).filter(t=>!['inch','inches','in'].includes(t)).map(t=>synonyms[t]||t);
}
const identity=value=>makerWords(value).join('');
function index(part){
 if(cache.has(part))return cache.get(part);
 const facts=[part.category,part.subcategory,part.technology,...(part.interfaces||[]),...(part.controllers||[]),part.resolution,
  part.diagonalInches!=null?String(part.diagonalInches):'',...(part.tags||[]),...(part.pinLabels||[]),...(part.pinReferences||[]).flatMap(r=>r.pins.flatMap(p=>[p.label,p.purpose]))];
 const fields=[part.name,part.brand,...(part.aliases||[]),...facts];
 const idx={name:identity(part.name),aliases:(part.aliases||[]).map(identity),controllers:(part.controllers||[]).map(identity),tokens:new Set(fields.flatMap(makerWords)),words:fields.map(v=>makerWords(v).join(' '))};
 idx.tokens.add('module');
 if(part.category==='Displays')idx.tokens.add('display');
 if(part.technology==='TFT LCD'){idx.tokens.add('lcd');idx.tokens.add('tft');}
 if(part.category==='Sensors')idx.tokens.add('sensor');
 cache.set(part,idx);return idx;
}
function termMatch(idx,term){
 if(idx.tokens.has(term))return true;
 // Numeric sizes, resolutions and model codes require exact tokens. 1.3 != 13.
 if(/\d/.test(term))return false;
 return term.length>=3&&[...idx.tokens].some(word=>word.startsWith(term));
}
export function searchMakerParts(parts,{query='',category='',brand='',technology='',interface:bus='',size='',identityKind='',documentedOnly=false,imagesOnly=false,pinoutsOnly=false,savedOnly=false,favorites=[]}={}){
 const terms=makerWords(query),q=identity(query);
 if(query.trim()&&!terms.length)return [];
 const key=JSON.stringify([terms,category,brand,technology,bus,size,identityKind,documentedOnly,imagesOnly,pinoutsOnly,savedOnly,savedOnly?favorites:[]]);
 return cachedSearch(parts,key,()=>parts.filter(p=>{
  if(category&&p.category!==category||brand&&p.brand!==brand||technology&&p.technology!==technology||bus&&!p.interfaces?.includes(bus)||size&&String(p.diagonalInches)!==size||identityKind&&p.identityKind!==identityKind)return false;
  if(documentedOnly&&p.documentationStatus!=='Manufacturer documentation recorded')return false;
  if(imagesOnly&&!p.imageCount)return false;
  if(pinoutsOnly&&!p.pinoutCoverage?.physicalCount)return false;
  if(savedOnly&&!favorites.includes(p.id))return false;
  const idx=index(p);
  return !q||[idx.name,...idx.aliases,...idx.controllers].includes(q)||terms.every(t=>termMatch(idx,t));
 }).map(p=>{
  const idx=index(p);let rank=p.documentationStatus==='Manufacturer documentation recorded'?10:0;
  if(q&&idx.name===q)rank+=1000;
  else if(q&&idx.aliases.includes(q))rank+=800;
  else if(q&&idx.controllers.includes(q))rank+=600;
  else if(q&&idx.name.includes(q))rank+=300;
  return {p,rank};
 }).sort((a,b)=>b.rank-a.rank||a.p.name.localeCompare(b.p.name)||a.p.id.localeCompare(b.p.id)).map(x=>x.p));
}
export function makerSuggestions(parts,query){
 const terms=makerWords(query);if(!terms.length)return [];
 const vocabulary=new Set(parts.flatMap(p=>[...(p.controllers||[]),...(p.aliases||[])]));
 const q=identity(query);if(q.length<4||q.length>32)return [];
 function distance(a,b){let row=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){const next=[i];for(let j=1;j<=b.length;j++)next[j]=Math.min(next[j-1]+1,row[j]+1,row[j-1]+(a[i-1]===b[j-1]?0:1));row=next;}return row[b.length];}
 return [...vocabulary].map(label=>({label,d:distance(q,identity(label))})).filter(x=>x.d>0&&x.d<=1).sort((a,b)=>a.d-b.d||a.label.localeCompare(b.label)).slice(0,3).map(x=>x.label);
}
