import test from 'node:test';import assert from 'node:assert/strict';
import {createSearchCache} from '../src/search-cache.mjs';
import {searchBoards} from '../src/domain.mjs';
const b=(id,name,processor='')=>({id,name,brand:'Test',family:'ESP32',processor,aliases:[],assets:[{type:'pinout image'}]});
test('Query cache evicts least recently used entries and isolates catalog snapshots',()=>{
 const cached=createSearchCache(2),a=[],b=[];let calls=0;const value=()=>++calls;
 assert.equal(cached(a,'a',value),1);assert.equal(cached(a,'b',value),2);assert.equal(cached(a,'a',value),1);
 assert.equal(cached(a,'c',value),3);assert.equal(cached(a,'b',value),4);assert.equal(cached(b,'a',value),5);
});
test('Cached searches preserve saved-state filters, model suffixes and field boundaries',()=>{
 const boards=[b('h2','ESP32-H2 board','ESP32-H2'),b('h21','ESP32-H21 board','ESP32-H21'),b('h4','ESP32-H4 board','ESP32-H4'),b('field','Example')];
 assert.deepEqual(searchBoards(boards,{query:'ESP32-H2'}).map(x=>x.id),['h2']);
 assert.deepEqual(searchBoards(boards,{query:'ESP32-H21'}).map(x=>x.id),['h21']);
 assert.deepEqual(searchBoards(boards,{query:'H4'}).map(x=>x.id),['h4']);
 assert.deepEqual(searchBoards(boards,{savedOnly:true,favorites:['h2']}).map(x=>x.id),['h2']);
 assert.deepEqual(searchBoards(boards,{savedOnly:true,favorites:['h4']}).map(x=>x.id),['h4']);
 assert.equal(searchBoards(boards,{query:'ExampleTest'}).length,0);
});
test('Display dimensions do not become ESP32 processor suffixes',()=>{
 const boards=[b('s3','ESP32-S3 1.14-inch TFT','ESP32-S3'),b('s31','ESP32-S31 board','ESP32-S31'),b('p4','Advanced ESP32-P4 10.1-inch','ESP32-P4'),b('c6','ESP32-C6 1.47inch Display','ESP32-C6')];
 for(const board of boards)assert.equal(searchBoards(boards,{query:board.name})[0]?.id,board.id);
 assert.deepEqual(searchBoards(boards,{query:'ESP32-S3'}).map(x=>x.id),['s3']);
 assert.deepEqual(searchBoards(boards,{query:'ESP32–S31'}).map(x=>x.id),['s31']);
 assert.deepEqual(searchBoards(boards,{query:'S3'}).map(x=>x.id),['s3']);
});
test('A board with two processors can be filtered by either documented processor',()=>{
 const boards=[b('combo','ESP32-P4X-C5-Function-EV-Board','ESP32-P4 / ESP32-C5')];
 assert.equal(searchBoards(boards,{processor:'ESP32-C5'})[0]?.id,'combo');
 assert.equal(searchBoards(boards,{processor:'ESP32-P4'})[0]?.id,'combo');
 assert.equal(searchBoards(boards,{processor:'ESP32-C6'}).length,0);
});
