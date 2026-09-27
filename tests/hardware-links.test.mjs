import test from 'node:test';
import assert from 'node:assert/strict';
import {hardwareLinks,documentationSummary,safeLibraryPath,availabilityLabel} from '../src/hardware-links.mjs';
import {searchBoards} from '../src/domain.mjs';
test('Link availability never claims document or electrical validation',()=>{
 assert.match(availabilityLabel({status:'reachable',checked:'2026-09-26T00:00:00Z'}),/identity is a separate check.*2026-09-26/);
 assert.match(availabilityLabel({status:'deferred-host-errors'}),/^Not checked/);
 assert.match(availabilityLabel({status:'access-limited'}),/restricted/);
 assert.equal(availabilityLabel({status:'unknown'}),'');
});
test('verified specs lead and duplicate sources are removed',()=>{
 const links=hardwareLinks({specifications:[{url:'https://maker.example/board'}],sources:['https://maker.example/board','https://maker.example/reference','https://maker.example/reference']});
 assert.equal(links.length,2);assert.equal(links[0].kind,'specification');assert.equal(links[1].kind,'source');
});
test('maker object sources work without promoting them to specifications',()=>assert.deepEqual(hardwareLinks({sources:[{url:'https://maker.example/docs'}]}).map(x=>x.kind),['source']));
test('unsafe URLs and credentials never become external links',()=>assert.equal(hardwareLinks({specifications:[{url:'javascript:alert(1)'},{url:'https://user:password@maker.example'}],sources:['file:///private',null]}).length,0));

test('component datasheets and unspecified legacy specs never count as board datasheets',()=>{
 const record={specifications:[{url:'https://maker.example/datasheet.pdf'}],documentation:{resources:[{kind:'datasheet',scope:'component',url:'https://maker.example/chip.pdf'},{kind:'schematic',scope:'board',url:'https://maker.example/schematic.pdf'}]}};
 assert.equal(documentationSummary(record).boardDatasheet,false);
 record.documentation.resources.push({kind:'datasheet',scope:'board',url:'https://maker.example/board.pdf'});
 assert.equal(documentationSummary(record).boardDatasheet,true);
});

test('HTML datasheets retain their document role alongside original website links',()=>{
 const url='https://maker.example/model/datasheet';const links=hardwareLinks({documentation:{website:{url},resources:[{url,kind:'datasheet',scope:'board'}]},sources:[url]});
 assert.deepEqual(links.map(x=>x.kind),['website','datasheet']);
});

test('all document links remain available, including late schematic revisions',()=>{
 assert.equal(hardwareLinks({documentation:{resources:Array.from({length:12},(_,i)=>({url:'https://maker.example/revision/'+i,kind:'schematic'}))}}).length,12);
});

test('saved document navigation rejects traversal and uses linked visual coverage',()=>{
 assert.equal(safeLibraryPath('../private.pdf'),false);assert.equal(safeLibraryPath('media/%2e%2e/private.pdf'),false);
 assert.equal(safeLibraryPath('media/'+'a'.repeat(64)+'.pdf'),true);
 assert.equal(documentationSummary({assets:[],documentationCoverage:{visualCount:3}}).visualCount,3);
 assert.equal(documentationSummary({assets:[{type:'chip-package reference',thumb:'chip.png'}]}).visualCount,0);
});

test('dash-separated alphanumeric model codes match without widening numeric variants',()=>{
 const boards=['RAK13002 WisBlock IO Module','RAK130020 Other Module','NanoPi M6V2'].map((name,i)=>({id:String(i),name,brand:'Maker',family:'Expansion',assets:[{type:'pinout image'}],aliases:[]}));
 assert.deepEqual(searchBoards(boards,{query:'RAK-13002'}).map(b=>b.name),['RAK13002 WisBlock IO Module']);
 assert.deepEqual(searchBoards(boards,{query:'Nano-Pi M6-V2'}).map(b=>b.name),['NanoPi M6V2']);
});
test('SBC and architecture filters preserve ARM, x86 and RISC-V identities',()=>{
 const boards=[['Pi 5','Raspberry Pi SBC','ARM'],['IOTA','Other SBC','x86'],['Mars','Other SBC','RISC-V'],['Pico 2','RP2350','ARM / RISC-V']].map(([name,family,architecture],i)=>({id:String(i),name,family,architecture,brand:'Test',assets:[{type:'pinout image'}],aliases:[]}));
 assert.deepEqual(searchBoards(boards,{family:'SBC'}).map(b=>b.name),['IOTA','Mars','Pi 5']);
 assert.deepEqual(searchBoards(boards,{family:'SBC',architecture:'RISC-V'}).map(b=>b.name),['Mars']);
 assert.deepEqual(searchBoards(boards,{query:'x86'}).map(b=>b.name),['IOTA']);
 assert.deepEqual(searchBoards(boards,{architecture:'ARM'}).map(b=>b.name),['Pi 5','Pico 2']);
 assert.deepEqual(searchBoards(boards,{architecture:'RISC-V'}).map(b=>b.name),['Mars','Pico 2']);
});
