import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {searchBoards,adapterCheck,batteryEstimate,budgetTotal,validateMeasurement,validateBackup} from '../src/domain.mjs';
const require=createRequire(import.meta.url);const {contained,externalURL}=require('../electron/paths.cjs');
const b=(id,name,brand,processor,extra={})=>({id,name,brand,processor,family:'ESP32',assets:[{type:'pinout image',review:'Reviewed source'}],pinouts:1,searchText:name+' '+brand+' '+processor,...extra});

test('Device browsing excludes bare boards and missing sheets while preserving model search',()=>{
 const rows=[b('embed','T-Embed','LILYGO','ESP32-S3',{device:{category:'Handhelds & pocket tools',tags:['IoT']}}),b('beam','T-Beam Supreme','LILYGO','ESP32-S3',{device:{category:'Radios & GNSS',tags:['LoRa']}}),b('kit','ESP32-S3 DevKit','Espressif','ESP32-S3'),b('future','Future handheld','LILYGO','ESP32-S3',{device:{category:'Handhelds & pocket tools'},assets:[]})];
 assert.deepEqual(searchBoards(rows,{devicesOnly:true,query:'t embed'}).map(x=>x.id),['embed']);
 assert.deepEqual(searchBoards(rows,{devicesOnly:true,query:'T-Beam'}).map(x=>x.id),['beam']);
 assert.deepEqual(searchBoards(rows,{devicesOnly:true,query:'LoRa'}).map(x=>x.id),['beam']);
 assert.equal(searchBoards(rows,{devicesOnly:true}).length,2);
 assert.deepEqual(searchBoards(rows,{devicesOnly:true,deviceCategory:'Radios & GNSS'}).map(x=>x.id),['beam']);
 assert.equal(searchBoards(rows,{devicesOnly:true,brand:'Espressif'}).length,0);
});
test('Search matches punctuation variants without confusing C5 and C6',()=>{const rows=[b('a','ESP32-C5-DevKitC-1','Espressif','ESP32-C5'),b('b','ESP32-C6-DevKitC-1','Espressif','ESP32-C6')];assert.deepEqual(searchBoards(rows,{query:'esp32 c5'}).map(x=>x.id),['a']);assert.deepEqual(searchBoards(rows,{query:'ESP32C5'}).map(x=>x.id),['a']);assert.equal(searchBoards(rows,{query:'c5',brand:'Waveshare'}).length,0);});
test('Aliases find original files and filters combine',()=>{const rows=[b('a','Pico 2','Raspberry Pi','RP2350',{searchText:'Pico 2 Raspberry Pi RP2350 old-pinmap.pdf'}),b('b','Pico','Raspberry Pi','RP2040')];assert.equal(searchBoards(rows,{query:'old pinmap'}).length,1);assert.deepEqual(searchBoards(rows,{processor:'RP2350',savedOnly:true,favorites:['a']}).map(x=>x.id),['a']);assert.equal(searchBoards(rows,{kind:'original reference PDF'}).length,0);});
const adapter={voltage:9,current:2,minVoltage:7,maxVoltage:12,loadCurrent:.7,outputType:'DC',regulated:true,connectorConfirmed:true,polarityConfirmed:true,powerPathConfirmed:true,limitsConfirmed:true,loadConfirmed:true};
test('Adapter rejects wrong voltage, AC, insufficient capacity and missing facts',()=>{assert.equal(adapterCheck(adapter).level,'candidate');assert.equal(adapterCheck({...adapter,voltage:24}).level,'mismatch');assert.equal(adapterCheck({...adapter,outputType:'AC'}).level,'mismatch');assert.equal(adapterCheck({...adapter,current:.3}).level,'mismatch');assert.equal(adapterCheck({...adapter,loadCurrent:NaN}).level,'incomplete');assert.equal(adapterCheck({...adapter,minVoltage:NaN}).level,'incomplete');assert.equal(adapterCheck({...adapter,connectorConfirmed:false}).level,'incomplete');assert.equal(adapterCheck({...adapter,outputType:''}).level,'incomplete');});
test('More available current is capacity, not forced board draw',()=>{const r=adapterCheck({...adapter,current:10});assert.equal(r.level,'candidate');assert.equal(r.watts,90);assert.equal(r.headroom,9.3);});
test('Battery series affects voltage; parallel affects Ah, losses affect runtime',()=>{const r=batteryEstimate({series:2,parallel:3,cellVoltage:3.6,cellFullVoltage:4.2,cellAh:2.5,loadWatts:9,efficiency:80});assert.equal(r.nominal,7.2);assert.equal(r.full,8.4);assert.equal(r.ah,7.5);assert.equal(r.wh,54);assert.ok(Math.abs(r.hours-4.8)<1e-10);assert.equal(r.cells,6);assert.equal(batteryEstimate({series:2.5,parallel:1,cellVoltage:3.6,cellFullVoltage:4.2,cellAh:2.5,loadWatts:9,efficiency:80}),null);});
test('Different voltage rails budget watts instead of summing unrelated amps',()=>{const r=budgetTotal([{voltage:5,current:1,quantity:2,efficiency:80},{voltage:12,current:.5,quantity:1,efficiency:100}],25);assert.equal(r.loadWatts,16);assert.equal(r.inputWatts,18.5);assert.equal(r.withMargin,23.125);});
const ids=new Set(['board']);const measurement={id:'one',boardId:'board',revision:'V1.0',input:'USB',date:'2026-09-24',voltage:5,currentMa:120,peakMa:300,condition:'Wi-Fi TX, LED off',instrument:'Bench meter',notes:''};
test('Measurements require conditions, identity and real numeric readings',()=>{assert.equal(validateMeasurement(measurement,ids),'');assert.ok(validateMeasurement({...measurement,condition:''},ids));assert.ok(validateMeasurement({...measurement,peakMa:100},ids));assert.ok(validateMeasurement({...measurement,boardId:'wrong'},ids));assert.ok(validateMeasurement({...measurement,voltage:Infinity},ids));});
test('Backup validates data and drops unrecognized favorite IDs',()=>{const r=validateBackup({format:'black-wire-backup',version:1,favorites:['board','wrong','board'],measurements:[measurement]},ids);assert.deepEqual(r.favorites,['board']);assert.equal(r.measurements[0].currentMa,120);assert.throws(()=>validateBackup({format:'black-wire-backup',version:1,favorites:[],measurements:[{...measurement,voltage:'5'}]},ids));assert.throws(()=>validateBackup({},ids));});
test('Reference protocol cannot walk outside the bundle or open executable URLs',()=>{assert.equal(contained(process.cwd(),'../../elsewhere'),null);assert.equal(contained(process.cwd(),'..\\secrets'),null);assert.ok(contained(process.cwd(),'media/pinout.png'));assert.equal(externalURL('javascript:alert(1)'),null);assert.equal(externalURL('file:///C:/Windows/system32/cmd.exe'),null);assert.equal(externalURL('https://user:secret@example.com'),null);assert.equal(externalURL('https://example.com/docs'),'https://example.com/docs');});

test('Separators, Unicode dashes, exact names and plus variants remain meaningful',()=>{
 const rows=[b('c5','ESP32-C5-DevKitC-1','Espressif','ESP32-C5'),b('c6','ESP32-C6-DevKitC-1','Espressif','ESP32-C6'),b('s3','ESP32-S3-DevKitC-1','Espressif','ESP32-S3'),b('s31','ESP32-S31-DevKit','Espressif','ESP32-S31')];
 for(const query of ['ESP32-C5-DevKitC-1','esp32 c5 devkitc 1','ESP32_C5_DevKitC_1','ESP32–C5—DevKitC–1','esp32c5devkitc1','c5 Espressif'])assert.deepEqual(searchBoards(rows,{query}).map(x=>x.id),['c5'],query);
 assert.deepEqual(searchBoards(rows,{query:'ESP32-S3'}).map(x=>x.id),['s3']);
 assert.deepEqual(searchBoards(rows,{query:'---'}),[]);
 const teensy=[b('two','Teensy 2.0','PJRC','AVR'),b('plus','Teensy++ 2.0','PJRC','AVR'),b('four','Teensy 4.1','PJRC','ARM')];
 assert.deepEqual(searchBoards(teensy,{query:'teensy 2.0'}).map(x=>x.id),['two']);
 assert.deepEqual(searchBoards(teensy,{query:'teensy++ 2.0'}).map(x=>x.id),['plus']);
});
test('Exact board identity outranks a matching filename, while filenames stay searchable',()=>{
 const rows=[b('file','Accessory kit','Other','',{searchText:'Accessory kit Raspberry Pi Pico 2 pinout.png'}),b('exact','Pico 2','Raspberry Pi','RP2350')];
 assert.deepEqual(searchBoards(rows,{query:'Pico-2'}).map(x=>x.id),['exact','file']);
 assert.equal(searchBoards(rows,{query:'pinout.png'})[0].id,'file');
});
