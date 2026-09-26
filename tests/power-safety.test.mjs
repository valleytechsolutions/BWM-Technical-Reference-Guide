import test from 'node:test';
import assert from 'node:assert/strict';
import {adapterCheck,batteryEstimate,budgetTotal} from '../src/domain.mjs';
const adapter={voltage:5,current:2,minVoltage:4.75,maxVoltage:5.25,loadCurrent:1,outputType:'DC',regulated:true,connectorConfirmed:true,polarityConfirmed:true,powerPathConfirmed:true,limitsConfirmed:true,loadConfirmed:true};
const battery={series:2,parallel:3,cellVoltage:3.6,cellFullVoltage:4.2,cellAh:2.5,loadWatts:9,efficiency:80,usablePercent:80,minCellVoltage:3};
test('every physical compatibility confirmation is required',()=>{
 for(const field of ['regulated','connectorConfirmed','polarityConfirmed','powerPathConfirmed','limitsConfirmed','loadConfirmed'])assert.equal(adapterCheck({...adapter,[field]:false}).level,'incomplete',field);
});
test('known mismatch remains visible when another adapter rating is missing',()=>{
 const r=adapterCheck({...adapter,outputType:'AC',current:NaN});assert.equal(r.level,'mismatch');assert.match(r.messages.join(' '),/AC-output/);
});
test('entered ranges cannot widen manufacturer limits',()=>{
 assert.equal(adapterCheck({...adapter,maxVoltage:12,profile:{voltageMin:4.75,voltageMax:5.25}}).level,'mismatch');
});
test('idle load does not replace recommended adapter capacity',()=>{
 assert.equal(adapterCheck({...adapter,profile:{supplyCurrentA:3}}).level,'incomplete');
});
test('adapters outside either voltage bound or below current demand are rejected',()=>{
 for(const patch of [{voltage:4.7},{voltage:5.3},{current:.9}])assert.equal(adapterCheck({...adapter,...patch}).level,'mismatch');
 assert.equal(adapterCheck({...adapter,voltage:4.75}).level,'candidate');assert.equal(adapterCheck({...adapter,voltage:5.25}).level,'candidate');
});
test('invalid and overflowing adapter arithmetic cannot produce approval',()=>{
 for(const patch of [{voltage:Infinity},{current:-1},{voltage:1e308,current:1e308,maxVoltage:1e308}])assert.notEqual(adapterCheck({...adapter,...patch}).level,'candidate');
});
test('battery derating lowers runtime and low voltage raises constant-power input current',()=>{
 const r=batteryEstimate(battery);assert.equal(r.wh,54);assert.ok(Math.abs(r.hours-3.84)<1e-10);assert.equal(r.lowVoltage,6);assert.equal(r.lowInputAmps,1.875);assert.ok(r.lowInputAmps>r.inputAmps);
});
test('battery invalid efficiencies, cutoff and derating are rejected',()=>{
 for(const patch of [{efficiency:0},{efficiency:101},{usablePercent:0},{usablePercent:101},{minCellVoltage:4},{minCellVoltage:0},{cellFullVoltage:3},{parallel:1.5},{cellAh:1e308}])assert.equal(batteryEstimate({...battery,...patch}),null);
});
test('blank cutoff stays unknown, not zero volts',()=>{
 const r=batteryEstimate({...battery,minCellVoltage:null});assert.equal(r.lowVoltage,null);assert.equal(r.lowInputAmps,null);
});
test('overflow and invalid quantities do not produce misleading power budgets',()=>{
 const row={voltage:5,current:1,quantity:1,efficiency:90};
 for(const patch of [{quantity:0},{quantity:1.1},{efficiency:0},{efficiency:101},{voltage:1e308,current:1e308}])assert.equal(budgetTotal([{...row,...patch}],20),null);
 assert.equal(budgetTotal([row],NaN),null);
});
