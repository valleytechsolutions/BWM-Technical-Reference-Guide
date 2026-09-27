import {pinPriority} from './pin-coverage.mjs';
const boardIndexes=new WeakMap();
function boardIndex(boards){
 if(!boardIndexes.has(boards))boardIndexes.set(boards,new Map(boards.map((board,position)=>[board.id,{board,position}])));
 return boardIndexes.get(boards);
}
export function makerAssets(part,catalog){
 const seen=new Set();
 const byId=boardIndex(catalog.boards);
 const linked=[...new Set(part.boardIds||[])].map(id=>byId.get(id)).filter(Boolean).sort((a,b)=>a.position-b.position);
 const assets=[...(part.assets||[]),...linked.flatMap(({board})=>board.assets)];
 return assets.filter(a=>{if(seen.has(a.file))return false;seen.add(a.file);return true;})
  .sort((a,b)=>pinPriority(a)-pinPriority(b));
}
export const hasVisual=a=>!!a.thumb||['jpg','jpeg','png','webp','gif','svg'].includes(a.extension);
