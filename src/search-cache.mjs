// Catalog arrays and their records are immutable within a loaded snapshot.
// Weak keys release old snapshots; the small LRU bounds query history in memory.
export function createSearchCache(limit=32){
 const catalogs=new WeakMap();
 return (records,key,compute)=>{
  let entries=catalogs.get(records);if(!entries){entries=new Map();catalogs.set(records,entries);}
  if(entries.has(key)){const value=entries.get(key);entries.delete(key);entries.set(key,value);return value;}
  const value=compute();entries.set(key,value);
  if(entries.size>limit)entries.delete(entries.keys().next().value);
  return value;
 };
}
