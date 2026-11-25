export const coverageLabels={'pinout-source':'Pinout source','linked-pinout':'Online pinout','linked-reference':'Online GPIO reference','functions-only':'Pin functions · map needed','reference-only':'Pinout needed','missing':'Documentation needed'};
export function pinCoverage(record){return record.pinoutCoverage||{status:record.assets?.some(a=>a.type==='pinout image')?'pinout-source':'reference-only',scope:'Check source coverage and exact board revision.',physicalCount:record.assets?.filter(a=>a.type==='pinout image').length||0,purposeRows:0};}
export const pinPriority=a=>a.type==='pinout image'?0:a.type==='pin function reference'?1:/physical board pinout|prettypin/i.test(a.label)?2:3;
export function orderedAssets(assets){return [...assets].sort((a,b)=>pinPriority(a)-pinPriority(b));}
