import test from 'node:test';
import assert from 'node:assert/strict';
import {makerAssets} from '../src/maker-assets.mjs';
import {searchMakerParts,makerWords} from '../src/maker-search.mjs';
test('maker gallery deduplicates linked originals and prefers physical references',()=>{
 const photo={file:'a.jpg',type:'identification photo'},pinout={file:'b.png',type:'pinout image'};
 assert.deepEqual(makerAssets({assets:[photo],boardIds:['board']},{boards:[{id:'board',assets:[photo,pinout]}]}),[pinout,photo]);
});
test('Linked asset lookup keeps catalog order and isolates replaced catalogs',()=>{
 const a={file:'a.png',type:'pinout image'},b={file:'b.png',type:'pinout image'};
 const part={boardIds:['b','missing','a','a']},catalog={boards:[{id:'a',assets:[a]},{id:'b',assets:[b]}]};
 assert.deepEqual(makerAssets(part,catalog),[a,b]);
 assert.deepEqual(makerAssets(part,{boards:[{id:'a',assets:[b]}]}),[b]);
});
test('power search recognizes step-up and step-down without conflating exact charger numbers',()=>{
 assert.deepEqual(makerWords('step up'),makerWords('boost'));assert.deepEqual(makerWords('stepdown'),makerWords('buck'));
 assert.deepEqual(makerWords('step–down'),makerWords('step-down'));assert.deepEqual(makerWords('I²C e–paper'),makerWords('I2C epaper'));
 const parts=['TP4056','TP4057'].map((name,i)=>({id:name,name,brand:'Test',category:'Power & charging',aliases:[],tags:['charger'],imageCount:i}));
 assert.deepEqual(searchMakerParts(parts,{query:'TP 4057'}).map(p=>p.id),['TP4057']);
 assert.deepEqual(searchMakerParts(parts,{imagesOnly:true}).map(p=>p.id),['TP4057']);
});
