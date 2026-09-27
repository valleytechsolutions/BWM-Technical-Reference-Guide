// Exercise every catalog identity, including records that still need references.
import fs from 'node:fs/promises';
import {searchBoards} from '../src/domain.mjs';
import {searchMakerParts} from '../src/maker-search.mjs';
const catalog=JSON.parse(await fs.readFile(new URL('../library/catalog.json',import.meta.url),'utf8'));
const failures=[];
for(const [kind,records,search] of [['board',catalog.boards,searchBoards],['maker',catalog.makerParts||[],searchMakerParts]]){
 for(const record of records){
  for(const query of new Set([record.name,record.name.replace(/-/g,' '),record.name.replace(/-/g,'–')])){
   if(!search(records,{query,includeUndocumented:true}).some(r=>r.id===record.id))failures.push({kind,id:record.id,query});
  }
 }
}
console.log(JSON.stringify({listings:catalog.boards.length+(catalog.makerParts?.length||0),failures},null,2));
if(failures.length)process.exitCode=1;
