export function resolveBoardId(id,aliases={}){return typeof id==='string'&&Object.hasOwn(aliases,id)?aliases[id]:id;}
export function remapWorkbench(data,aliases={}){
 if(!data||typeof data!=='object'||Array.isArray(data))return data;
 const favorites=Array.isArray(data.favorites)?[...new Set(data.favorites.map(id=>resolveBoardId(id,aliases)))]:data.favorites;
 const measurements=Array.isArray(data.measurements)?data.measurements.map(m=>m&&Object.hasOwn(aliases,m.boardId)?{...m,boardId:resolveBoardId(m.boardId,aliases)}:m):data.measurements;
 if(JSON.stringify(favorites)===JSON.stringify(data.favorites)&&measurements?.every?.((m,i)=>m===data.measurements[i]))return data;
 return {...data,favorites,measurements};
}
