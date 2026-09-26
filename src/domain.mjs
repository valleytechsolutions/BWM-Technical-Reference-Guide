export function normalize(text){return String(text||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9+]/g,'');}
const fold=text=>String(text||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'');
const words=text=>fold(text).match(/[a-z0-9]+(?:\.[0-9]+)*|\++/g)||[];
const indexCache=new WeakMap();
function searchIndex(board){
 if(indexCache.has(board))return indexCache.get(board);
 const core=[board.name,board.brand,board.processor,board.architecture,board.family,board.device?.category,...(board.device?.tags||[])];
 const aliases=board.aliases||[];
 const references=(board.assets||[]).flatMap(a=>[a.label,a.type,...(a.aliases||[]),...(a.originals||[])]);
 const fields=[...core,...aliases,...references,...(board.pinReferences||[]).flatMap(r=>r.pins.flatMap(p=>[p.label,p.purpose])),board.searchText].filter(Boolean);
 const index={name:normalize(board.name),aliases:aliases.map(normalize),core:core.map(normalize),fields:fields.map(normalize),tokens:new Set(fields.flatMap(words)),identity:normalize([board.name,board.processor].join(' '))};
 indexCache.set(board,index);return index;
}
function includesModel(field,term){
 let pos=field.indexOf(term);
 while(pos!==-1){const next=field[pos+term.length];if(!/\d$/.test(term)||!next||!/[0-9]/.test(next))return true;pos=field.indexOf(term,pos+1);}
 return false;
}
export function searchBoards(boards,{query='',brand='',processor='',family='',architecture='',kind='',scope='all',savedOnly=false,favorites=[],devicesOnly=false,deviceCategory='',includeUndocumented=false}={}){
 const terms=words(query),q=normalize(query);
 // Processor suffixes and decimal revisions are identities, not fuzzy text.
 const variant=normalize(query).match(/esp32(c61|s31|c[2356]|s[23]|h2|p4)(?!\d)/)?.[0];
 const suffix=terms.find(t=>/^(c61|s31|c[2356]|s[23]|h2|p4)$/.test(t));
 const teensyRevision=/teensy/i.test(query)&&terms.some(t=>/^\d+\.\d+$/.test(t));
 if(query.trim()&&!terms.some(t=>/[a-z0-9]/.test(t)))return [];
 return boards.filter(b=>{
  if(!includeUndocumented&&!b.assets.length||brand&&b.brand!==brand||processor&&b.processor!==processor||family&&(family==='SBC'?!['Other SBC','Raspberry Pi SBC'].includes(b.family):b.family!==family)||architecture&&b.architecture!==architecture&&!(b.architecture||'').split(' / ').includes(architecture))return false;
  if(devicesOnly&&!b.device||deviceCategory&&b.device?.category!==deviceCategory)return false;
  if(savedOnly&&!favorites.includes(b.id))return false;
  if(kind&&!b.assets.some(a=>a.type===kind))return false;
  if(scope==='reviewed'&&!b.assets.some(a=>a.review==='Reviewed source'))return false;
  if(scope==='source'&&!b.assets.some(a=>a.review==='Unreviewed source'))return false;
  const idx=searchIndex(b);
  if(variant&&!includesModel(idx.identity,variant))return false;
  if(suffix&&!includesModel(idx.identity,suffix))return false;
  if(teensyRevision&&idx.name.includes('teensy')&&q.includes('++')!==idx.name.includes('++'))return false;
  if(q&&[idx.name,...idx.aliases].includes(q))return true;
  return terms.every(t=>idx.tokens.has(t)||(!/^\d+(?:\.\d+)*$/.test(t)&&idx.fields.some(f=>includesModel(f,normalize(t)))));
 }).map(b=>{
  const idx=searchIndex(b);let rank=b.pinouts?20:0;
  if(q&&idx.name===q)rank+=1000;
  else if(q&&idx.aliases.includes(q))rank+=700;
  else if(q&&includesModel(idx.name,q))rank+=400;
  if(terms.length&&terms.every(t=>idx.core.some(f=>includesModel(f,normalize(t)))))rank+=200;
  if(!query.trim()&&b.featured)rank+=50;
  return {b,rank};
 }).sort((a,b)=>b.rank-a.rank||a.b.name.localeCompare(b.b.name)).map(x=>x.b);
}
export const finite=(n)=>typeof n==='number'&&Number.isFinite(n);
export function adapterCheck({voltage,current,minVoltage,maxVoltage,loadCurrent,outputType,regulated,connectorConfirmed,polarityConfirmed,powerPathConfirmed,limitsConfirmed,loadConfirmed,profile}){
 const issues=[];const unknown=[];
 if(outputType==='AC')issues.push('This input needs DC. An AC-output adapter is not a match.');
 else if(outputType!=='DC')unknown.push('Confirm whether the adapter OUTPUT is AC or DC.');
 if(!finite(voltage)||voltage<=0||!finite(current)||current<=0)unknown.push('Enter positive adapter OUTPUT ratings, not its mains INPUT rating.');
 if(!finite(minVoltage)||!finite(maxVoltage)||minVoltage<=0||maxVoltage<minVoltage)unknown.push('Add the allowed input voltage range for this exact connector.');
 else if(voltage<minVoltage||voltage>maxVoltage)issues.push('Adapter voltage is outside the entered input range.');
 if(!finite(loadCurrent)||loadCurrent<=0)unknown.push('A required supply rating or worst-case load current is needed.');
 else if(current<loadCurrent)issues.push('The adapter current rating is below the entered load requirement.');
 if(finite(profile?.voltageMin)&&finite(minVoltage)&&minVoltage<profile.voltageMin||finite(profile?.voltageMax)&&finite(maxVoltage)&&maxVoltage>profile.voltageMax)issues.push('The entered voltage range extends beyond the selected manufacturer profile.');
 if(finite(profile?.supplyCurrentA)&&finite(loadCurrent)&&loadCurrent<profile.supplyCurrentA)unknown.push('The entered load is below the manufacturer-recommended supply capacity. A typical current reading does not replace that recommendation.');
 if(!regulated)unknown.push('Confirm regulated output and voltage under load.');
 if(!connectorConfirmed)unknown.push('Confirm the exact connector, input pin and any negotiated USB-PD voltage/current mode.');
 if(!polarityConfirmed)unknown.push('Confirm positive and negative contacts from the exact board and adapter documentation.');
 if(!powerPathConfirmed)unknown.push('Check simultaneous USB, battery and external power against the board power-path instructions.');
 if(!limitsConfirmed)unknown.push('Verify the operating input range for this connector; do not use GPIO voltage or absolute-maximum ratings.');
 if(!loadConfirmed)unknown.push('Include peripherals, startup and transmit peaks; do not use an idle reading as the load requirement.');
 const watts=voltage*current,headroom=current-loadCurrent;
 if(!finite(watts)||!finite(headroom))unknown.push('The calculation is unavailable. Check units and numeric magnitude.');
 return {level:issues.length?'mismatch':unknown.length?'incomplete':'candidate',title:issues.length?'Do not connect this combination':unknown.length?'More information needed':'Entered ratings align',messages:issues.length?[...issues,...unknown]:unknown.length?unknown:['This compares the values you entered; it does not certify electrical compatibility. Check regulation, cable drop, startup behavior and temperature under the actual load.',...(headroom===0?['No additional current reserve remains above the entered requirement.']:[])],watts:finite(watts)&&voltage>0&&current>0?watts:null,headroom:finite(headroom)&&current>0&&loadCurrent>0?headroom:null};
}
export function batteryEstimate({series,parallel,cellVoltage,cellFullVoltage,cellAh,loadWatts,efficiency,minCellVoltage,usablePercent=100}){
 if(![series,parallel,cellVoltage,cellFullVoltage,cellAh,loadWatts,efficiency].every(finite)||!Number.isInteger(series)||!Number.isInteger(parallel)||series<1||parallel<1||series>1000||parallel>1000||cellVoltage<=0||cellFullVoltage<cellVoltage||cellAh<=0||loadWatts<=0||efficiency<=0||efficiency>100)return null;
 const nominal=series*cellVoltage,full=series*cellFullVoltage,ah=parallel*cellAh,wh=nominal*ah;
 if(!finite(usablePercent)||usablePercent<=0||usablePercent>100||minCellVoltage!=null&&(!finite(minCellVoltage)||minCellVoltage<=0||minCellVoltage>cellVoltage))return null;
 const lowVoltage=minCellVoltage==null?null:series*minCellVoltage;
 const result={nominal,full,ah,wh,hours:wh*(usablePercent/100)*(efficiency/100)/loadWatts,cells:series*parallel,inputAmps:loadWatts/(efficiency/100)/nominal,lowVoltage,lowInputAmps:lowVoltage==null?null:loadWatts/(efficiency/100)/lowVoltage};
 return Object.values(result).every(v=>v===null||finite(v)&&v>0)?result:null;
}
export function budgetTotal(rows,margin){
 if(!finite(margin)||margin<0||margin>500||!rows.length)return null;
 if(rows.some(r=>![r.voltage,r.current,r.quantity,r.efficiency].every(finite)||r.voltage<=0||r.current<=0||!Number.isInteger(r.quantity)||r.quantity<1||r.efficiency<=0||r.efficiency>100))return null;
 const loadWatts=rows.reduce((s,r)=>s+r.voltage*r.current*r.quantity,0);
 const inputWatts=rows.reduce((s,r)=>s+r.voltage*r.current*r.quantity/(r.efficiency/100),0);
 const result={loadWatts,inputWatts,withMargin:inputWatts*(1+margin/100)};
 return Object.values(result).every(v=>finite(v)&&v>0)?result:null;
}
export function validateMeasurement(m,boardIds){
 const required=['boardId','revision','condition','instrument','date','input'];
 if(!m||required.some(k=>typeof m[k]!=='string'||!m[k].trim())||!boardIds.has(m.boardId))return 'Board, revision, input point, conditions, instrument and date are required.';
 if(!finite(m.voltage)||m.voltage<=0||m.voltage>1000||!finite(m.currentMa)||m.currentMa<0||m.currentMa>1000000)return 'Enter a positive measured voltage and a non-negative current in mA.';
 if(m.peakMa!=null&&(!finite(m.peakMa)||m.peakMa<m.currentMa))return 'Peak current must be at least the average current.';
 if(!/^\d{4}-\d{2}-\d{2}$/.test(m.date)||Number.isNaN(Date.parse(m.date))||new Date(m.date).toISOString().slice(0,10)!==m.date)return 'Enter a valid measurement date.';
 if(m.notes!=null&&typeof m.notes!=='string')return 'Measurement notes must be text.';
 if(required.some(k=>m[k].length>2000)||(m.notes||'').length>5000)return 'A text field is too long.';
 return '';
}
export function validateBackup(data,boardIds){
 if(!data||data.format!=='black-wire-backup'||data.version!==1||!Array.isArray(data.favorites)||!Array.isArray(data.measurements))throw new Error('This is not a supported Black Wire backup.');
 if(data.measurements.length>10000||data.favorites.length>10000)throw new Error('Backup exceeds the supported record limit.');
 for(const m of data.measurements){const error=validateMeasurement(m,boardIds);if(error)throw new Error('Invalid measurement: '+error);}
 const cleanMeasurements=data.measurements.map((m,i)=>Object.fromEntries(['id','boardId','revision','condition','instrument','date','input','voltage','currentMa','peakMa','notes'].map(k=>[k,k==='id'?String(m.id||'import-'+i):m[k]??(k==='peakMa'?null:'')])));
 return {favorites:[...new Set(data.favorites.filter(id=>typeof id==='string'&&boardIds.has(id)))],measurements:cleanMeasurements};
}
export function validateSavedWorkbench(data){
 if(data&&typeof data==='object'&&!Array.isArray(data)&&Object.keys(data).length===0)return {favorites:[],measurements:[]};
 if(!data||!Array.isArray(data.favorites)||!Array.isArray(data.measurements)||data.favorites.length>10000||data.measurements.length>10000||data.favorites.some(id=>typeof id!=='string'))throw new Error('Saved workbench has an unexpected format. Your saved data has not been overwritten.');
 const ids=new Set();
 for(const m of data.measurements){
  if(!m||typeof m.id!=='string'||!m.id||ids.has(m.id)||validateMeasurement(m,new Set([m.boardId])))throw new Error('A saved measurement has an unexpected format. Your saved data has not been overwritten.');
  ids.add(m.id);
 }
 return {favorites:[...new Set(data.favorites)],measurements:data.measurements};
}
