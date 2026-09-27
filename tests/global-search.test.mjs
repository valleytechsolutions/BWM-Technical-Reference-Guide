import test from 'node:test';
import assert from 'node:assert/strict';
import {searchCatalog} from '../src/global-search.mjs';
import {orderedAssets} from '../src/pin-coverage.mjs';
const board=(id,name,extra={})=>({id,name,brand:'Example',family:'Module',processor:'',assets:[],...extra});
const maker=(id,name,extra={})=>({id,name,brand:'Example',category:'Sensors',boardIds:[],...extra});
test('Unified search includes undocumented boards, deduplicates linked maker records and respects scope',()=>{
 const c={boards:[board('a','BME280'),board('b','BME280 unpublished board')],makerParts:[maker('m','BME280',{boardIds:['a'],pinoutCoverage:{physicalCount:1}})]};
 assert.deepEqual(searchCatalog(c,'BME280').map(x=>x.record.id),['m','b']);
 assert.deepEqual(searchCatalog(c,'BME280',{scope:'boards'}).map(x=>x.record.id),['a','b']);
 assert.deepEqual(searchCatalog(c,'BME280',{pinoutsOnly:true}).map(x=>x.record.id),['m']);
});
test('Physical diagrams precede photos; functions remain searchable without claiming a map',()=>{
 const photo={type:'product photo'},pinout={type:'pinout image'};
 assert.deepEqual(orderedAssets([photo,pinout]),[pinout,photo]);
 const c={boards:[],makerParts:[maker('m','Sensor',{pinReferences:[{pins:[{label:'SDA',purpose:'Serial data signal'}]}],pinoutCoverage:{physicalCount:0}})]};
 assert.equal(searchCatalog(c,'serial data')[0].record.id,'m');
 assert.equal(searchCatalog(c,'SDA',{pinoutsOnly:true}).length,0);
});
test('A maker without pinouts cannot hide a linked board when pinout-only search is enabled',()=>{
 const c={boards:[board('a','Example GPIO',{pinoutCoverage:{physicalCount:1}})],makerParts:[maker('m','Example GPIO',{boardIds:['a'],pinoutCoverage:{physicalCount:0}})]};
 assert.deepEqual(searchCatalog(c,'Example GPIO',{pinoutsOnly:true}).map(x=>x.record.id),['a']);
});
