import test from 'node:test';
import assert from 'node:assert/strict';
import {searchWiringGuides,validateWiringGuides} from '../src/wiring-guides.mjs';
import {searchCatalog} from '../src/global-search.mjs';
const make=(id,name,aliases,category='Serial & buses')=>({id,name,aliases,category,summary:'Connection reference',rows:[['TX','RX']],columns:['From','To'],scope:'Exact signal example',useWhen:'Local prototype',why:'Communicate',review:'Source checked; untested',rights:'Kal / Valleytech Solutions, CC BY 4.0',revision:'2026-09-27',kind:'wiring-guide',image:{file:'wiring/'+id+'.svg',hash:'a'.repeat(64),type:'original connection diagram'},sources:[{url:'https://www.ti.com/lit/an/slla272d/slla272d.pdf',title:'Publisher source',locator:'Termination',checked:'2026-09-27'}],relatedParts:[],relatedGuides:[]});
const guides=[make('rs485','RS-485 bus',['RS485','Modbus RTU']),make('i2c','I2C bus',['I²C','IIC']),make('nfc','ST25R3916B I2C wiring',['ST25R3916B','NFC'],'RFID & NFC')];
test('Wiring search tolerates separators and I2C typography while retaining category filtering',()=>{
 for(const q of ['RS-485','RS 485','rs_485','Modbus RTU'])assert.equal(searchWiringGuides(guides,q)[0].id,'rs485');
 for(const q of ['I²C','IIC','i2c'])assert.equal(searchWiringGuides(guides,q)[0].id,'i2c');
 assert.deepEqual(searchWiringGuides(guides,'ST25R I2C','RFID & NFC').map(g=>g.id),['nfc']);
 assert.deepEqual(searchWiringGuides(guides,'ST25R','Connectors'),[]);
 assert.deepEqual(searchWiringGuides(guides,'---'),[]);
});
test('Unified search routes wiring independently and does not advertise it as a board pinout',()=>{
 const c={boards:[],makerParts:[],wiringGuides:guides};
 assert.equal(searchCatalog(c,'RS-485')[0].kind,'wiring');
 assert.equal(searchCatalog(c,'NFC',{scope:'wiring'})[0].record.id,'nfc');
 for(const scope of ['boards','makers'])assert.deepEqual(searchCatalog(c,'NFC',{scope}),[]);
 assert.deepEqual(searchCatalog(c,'NFC',{pinoutsOnly:true}),[]);
});
test('Wiring validation catches unsafe assets, missing provenance and broken hardware links',()=>{
 assert.deepEqual(validateWiringGuides(guides),[]);
 const bad=structuredClone(guides);bad[0].image.file='../private.svg';bad[1].sources=[];bad[2].relatedParts=['missing-module'];bad[2].relatedGuides=['missing-guide'];
 const errors=validateWiringGuides(bad);
 for(const pattern of ['Invalid wiring image','Missing wiring sources','Unknown wiring module','Unknown related guide'])assert.ok(errors.some(e=>e.includes(pattern)));
});
test('Connection diagrams cannot silently turn into approved physical board pinouts',()=>{
 const bad=structuredClone(guides);bad[0].pinoutCoverage={physicalCount:1};bad[1].completePhysicalPinout=true;
 assert.equal(validateWiringGuides(bad).filter(e=>e.includes('cannot count')).length,2);
});
