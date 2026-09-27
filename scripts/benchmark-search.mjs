import fs from 'node:fs/promises';
import {performance} from 'node:perf_hooks';
import {searchCatalog} from '../src/global-search.mjs';
const catalog=JSON.parse(await fs.readFile(new URL('../library/catalog.json',import.meta.url),'utf8'));
export function benchmark(search,catalog){
 const queries=['esp32','esp32-c5','waveshare esp32-s3','NanoPi','Jetson AGX Orin','RAK-13002','pico 2','teensy 4.1','bme280','i2c display','sda','notarealboard'];
 const median=values=>[...values].sort((a,b)=>a-b)[Math.floor(values.length/2)];
 let start=performance.now();search(catalog,queries[0]);const firstSearchMs=performance.now()-start;
 const result=[];
 for(const query of queries){
  const uncached=[],repeat=[];
  for(let round=0;round<40;round++){
   // Keep the existing per-record indexes warm while preventing query-cache hits.
   const isolated={...catalog,boards:[...catalog.boards],makerParts:[...catalog.makerParts]};
   start=performance.now();search(isolated,query);uncached.push(performance.now()-start);
   start=performance.now();search(catalog,query);repeat.push(performance.now()-start);
  }
  result.push({query,uncachedMedianMs:median(uncached),repeatMedianMs:median(repeat)});
 }
 return {runtime:process.version,listings:catalog.boards.length+catalog.makerParts.length,rounds:40,firstSearchMs,results:result,note:'Node search functions only; excludes UI rendering, catalog loading and network time. Uncached samples retain per-record indexes but use new collection arrays. Repeated samples allow the bounded query cache.'};
}
if(process.argv[1]?.replaceAll('\\','/').endsWith('/benchmark-search.mjs'))console.log(JSON.stringify(benchmark(searchCatalog,catalog),null,2));
