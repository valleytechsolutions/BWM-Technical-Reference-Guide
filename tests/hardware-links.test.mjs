import test from 'node:test';
import assert from 'node:assert/strict';
import {hardwareLinks} from '../src/hardware-links.mjs';
import {searchBoards} from '../src/domain.mjs';
test('verified specs lead and duplicate sources are removed',()=>{
 const links=hardwareLinks({specifications:[{url:'https://maker.example/board'}],sources:['https://maker.example/board','https://maker.example/reference','https://maker.example/reference']});
 assert.equal(links.length,2);assert.equal(links[0].kind,'specification');assert.equal(links[1].kind,'source');
});
test('maker object sources work without promoting them to specifications',()=>assert.deepEqual(hardwareLinks({sources:[{url:'https://maker.example/docs'}]}).map(x=>x.kind),['source']));
test('unsafe URLs and credentials never become external links',()=>assert.equal(hardwareLinks({specifications:[{url:'javascript:alert(1)'},{url:'https://user:password@maker.example'}],sources:['file:///private',null]}).length,0));
test('SBC and architecture filters preserve ARM, x86 and RISC-V identities',()=>{
 const boards=[['Pi 5','Raspberry Pi SBC','ARM'],['IOTA','Other SBC','x86'],['Mars','Other SBC','RISC-V'],['Pico 2','RP2350','ARM / RISC-V']].map(([name,family,architecture],i)=>({id:String(i),name,family,architecture,brand:'Test',assets:[{type:'pinout image'}],aliases:[]}));
 assert.deepEqual(searchBoards(boards,{family:'SBC'}).map(b=>b.name),['IOTA','Mars','Pi 5']);
 assert.deepEqual(searchBoards(boards,{family:'SBC',architecture:'RISC-V'}).map(b=>b.name),['Mars']);
 assert.deepEqual(searchBoards(boards,{query:'x86'}).map(b=>b.name),['IOTA']);
 assert.deepEqual(searchBoards(boards,{architecture:'ARM'}).map(b=>b.name),['Pi 5','Pico 2']);
 assert.deepEqual(searchBoards(boards,{architecture:'RISC-V'}).map(b=>b.name),['Mars','Pico 2']);
});
