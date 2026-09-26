// Build-time validation: reject malformed evidence before it reaches a release.
export function validatePowerProfiles(profiles, boardIds) {
 const errors=[],ids=new Set(),positive=n=>typeof n==='number'&&Number.isFinite(n)&&n>0;
 for(const p of profiles){
  const fail=message=>errors.push(`${p.id||'unnamed'}: ${message}`);
  if(!p.id||ids.has(p.id))fail('missing or duplicate profile ID');ids.add(p.id);
  for(const key of ['name','revision','input','logic','rangeKind','connector','currentMeaning','notes'])if(typeof p[key]!=='string'||!p[key].trim())fail(`missing ${key}`);
  if(!p.boardIds?.length||p.boardIds.some(id=>!boardIds.has(id)))fail('unknown or missing exact board');
  if((p.voltageMin==null)!==(p.voltageMax==null))fail('input range must have both bounds or neither');
  if(p.voltageMin!=null&&(!positive(p.voltageMin)||!positive(p.voltageMax)||p.voltageMin>p.voltageMax))fail('invalid input range');
  if(p.nominal!=null&&(!positive(p.nominal)||p.voltageMin!=null&&(p.nominal<p.voltageMin||p.nominal>p.voltageMax)))fail('invalid nominal voltage');
  if(p.supplyCurrentA!=null&&!positive(p.supplyCurrentA))fail('invalid supply current');
  if(!p.sources?.length)fail('no sources');
  for(const s of p.sources||[]){
   try{const u=new URL(s.url);if(u.protocol!=='https:'||u.username||u.password)fail('unsafe source URL');}catch{fail('invalid source URL');}
   if(!s.title||!s.section||!/^\d{4}-\d{2}-\d{2}$/.test(s.checked||''))fail('incomplete source citation');
   if(s.sha256!=null&&!/^[a-f0-9]{64}$/.test(s.sha256))fail('invalid source digest');
  }
  for(const o of p.observations||[]){
   if(!Number.isInteger(o.source)||!p.sources?.[o.source])fail('observation source missing');
   if(!o.kind||!o.condition||!o.caveat)fail('observation lacks context');
   if(typeof o.currentMa!=='number'||!Number.isFinite(o.currentMa)||o.currentMa<0)fail('invalid observed current');
   if(o.voltage!=null&&!positive(o.voltage))fail('invalid observation voltage');
   if(o.peakMa!=null&&(!Number.isFinite(o.peakMa)||o.peakMa<o.currentMa))fail('peak below average or non-finite');
  }
 }
 return errors;
}
