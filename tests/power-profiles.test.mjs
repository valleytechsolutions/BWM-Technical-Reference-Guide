import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validatePowerProfiles} from '../src/power-profiles.mjs';
const profiles=JSON.parse(fs.readFileSync(new URL('../data/power-profiles.json',import.meta.url)));
const ids=new Set(profiles.flatMap(p=>p.boardIds));
test('all curated profiles have valid ratings and observation citations',()=>assert.deepEqual(validatePowerProfiles(profiles,ids),[]));
test('nominal-only profiles never acquire an inferred tolerance',()=>{
 for(const id of ['pi5','espc5','wireless-paper']){const p=profiles.find(p=>p.id===id);assert.equal(p.voltageMin,null);assert.equal(p.voltageMax,null);}
});
test('profile validation rejects bad ranges, current, source index and mismatched boards',()=>{
 const cases=[p=>p.voltageMax=0,p=>p.voltageMin=null,p=>p.nominal=100,p=>p.supplyCurrentA=-1,p=>p.observations[0].source=99,p=>p.observations[0].peakMa=0,p=>p.boardIds=['unknown']];
 for(const mutate of cases){const p=structuredClone(profiles[0]);mutate(p);assert.ok(validatePowerProfiles([p],ids).length);}
});
