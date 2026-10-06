import test from 'node:test';
import assert from 'node:assert/strict';
import {createPart, emptyProject, ledExample, validateProject, simulateCircuit, circuitNets, endpointPosition, endpointLabel, WIRE_COLORS, PIN_SOURCE_REVIEWS} from '../src/breadboard.mjs';
import {boardLayout, findHole, projectHoles} from '../src/breadboard-boards.mjs';
import {addBoard, updateBoard, removeBoard, mountPart, footprintHoles, footprintOffsets, rotateMountedPart, shiftMountedPart, dragMountedPart, transistorExample, insertedLedExample} from '../src/breadboard-placement.mjs';
import {inspectWiring, buildEndpointLabel, buildSheetHtml, billOfMaterials, partReferences} from '../src/circuit-bench.mjs';
import {emptyLibrary, saveTemplate, partFromTemplate, validateLibrary, mergeLibrary, loadLibrary, suggestRoles, parsePinLabels, LIBRARY_KEY} from '../src/device-library.mjs';

const approx = (actual, expected, tolerance = 1e-6) => assert.ok(Math.abs(actual - expected) < tolerance, `${actual} should be near ${expected}`);
const part = (type, id, extra = {}) => ({...createPart(type), id, ...extra});
const circuit = (parts, links = []) => ({...emptyProject(), parts, wires: links.map(([from, to], i) => ({id: 'w' + i, from, to, color: WIRE_COLORS[0]}))});
const device = (pins, extra = {}) => ({...createPart('device'), id: 'u', name: 'Sensor', pins: pins.map((label, i) => ({id: 'p' + i, label})), ...extra});

test('single-read terminal provenance survives project and device-library round trips', () => {
  const image = 'media/' + 'a'.repeat(64) + '.png';
  const record = {id: 'single-read-board', name: 'Single read board', pinConnectors: {method: 'image-transcription', review: 'single-entry', images: [{file: image}], connectors: [{id: 'J1', rows: 1, pins: [{position: 1, label: 'GND'}, {position: 2, label: '3V3'}]}]}};
  const part = createPart('device', 0, record);
  assert.equal(part.pinSource.review, 'single-entry');
  assert.deepEqual(validateProject(circuit([part])).parts[0].pinSource, part.pinSource);
  assert.deepEqual(partFromTemplate(validateLibrary(saveTemplate(emptyLibrary(), part).library).devices[0]).pinSource, part.pinSource);
});

test('large catalog connector maps retain every terminal and oversized maps fail explicitly', () => {
  const record = {id: 'large-board', name: 'Large board', pinReferences: [{connector: 'J1', pins: Array.from({length: 273}, (_, i) => ({position: i + 1, label: 'GPIO' + i}))}]};
  const part = createPart('device', 0, record);
  assert.equal(part.pins.length, 273);
  assert.equal(part.pins.at(-1).label, 'GPIO272');
  assert.equal(validateProject(circuit([part])).parts[0].pins.length, 273);
  assert.equal(partFromTemplate(validateLibrary(saveTemplate(emptyLibrary(), part).library).devices[0]).pins.length, 273);
  record.pinReferences[0].pins = Array.from({length: 513}, (_, i) => ({position: i + 1, label: 'GPIO' + i}));
  assert.throws(() => createPart('device', 0, record), /513 terminals.*512/);
});

test('the main board keeps legacy hole IDs and coordinates; added boards are prefixed and independent', () => {
  const legacy = validateProject({...ledExample(), version: 2});
  assert.deepEqual(legacy.boards, [{id: 'main', size: 'half', x: 153, y: 307, splitRails: false}]);
  assert.deepEqual(endpointPosition(legacy, 'hole:a14'), {...findHole(legacy, 'a14')});
  assert.equal(findHole(legacy, 'e14').x, 208 + 13 * 26); assert.equal(findHole(legacy, 'f1').y, 562);
  const {project, id} = addBoard(legacy, 'mini');
  assert.equal(id, 'b2'); assert.equal(endpointLabel(project, 'hole:b2.c3'), 'Breadboard 2 C3');
  assert.equal(projectHoles(project).filter(h => h.board === 'b2').length, 170);
  const nets = circuitNets(project);
  assert.notEqual(nets.find('hole:a3'), nets.find('hole:b2.a3'));
  assert.equal(nets.find('hole:b2.a3'), nets.find('hole:b2.e3'));
  assert.equal(findHole(project, 'b2.tp1'), undefined);
  assert.deepEqual(validateProject(JSON.parse(JSON.stringify(project))), project);
});
test('split rails break at the middle, full boards have 63 columns, and resizing never strands a connection', () => {
  let project = validateProject(ledExample());
  assert.equal(circuitNets(project).find('hole:tp1'), circuitNets(project).find('hole:tp30'));
  project = updateBoard(project, 'main', {splitRails: true});
  const nets = circuitNets(project);
  assert.equal(nets.find('hole:tp1'), nets.find('hole:tp15')); assert.notEqual(nets.find('hole:tp15'), nets.find('hole:tp16'));
  assert.match(buildEndpointLabel(project, 'hole:tp28'), /\(right\)/);
  // The LED example draws ground from tn28 on the right half, so the split opens its loop.
  assert.equal(simulateCircuit(project).readings.led.current < 1e-6, true);
  assert.throws(() => updateBoard(project, 'main', {size: 'mini'}), /too small for/);
  const full = updateBoard(project, 'main', {size: 'full'});
  assert.equal(boardLayout(full.boards[0]).columns, 63); assert.ok(findHole(full, 'j63'));
  assert.throws(() => validateProject({...project, boards: [{id: 'b2', size: 'half', x: 0, y: 0}]}), /main breadboard/);
  assert.throws(() => validateProject({...project, boards: [...project.boards, {id: 'b2', size: 'huge', x: 0, y: 0}]}));
});
test('removing a board lifts parts and drops wires on it but leaves the rest of the circuit', () => {
  const {project: withBoard} = addBoard(validateProject(ledExample()));
  let project = {...withBoard, parts: [...withBoard.parts, part('resistor', 'r9')], wires: [...withBoard.wires, {id: 'jump', from: 'hole:tp5', to: 'hole:b2.tp5', color: '#333333'}]};
  project = mountPart(project, 'r9', 'b2.c4', 'b2.c9');
  const removed = removeBoard(project, 'b2');
  assert.equal(removed.boards.length, 1); assert.equal(removed.wires.length, 9); assert.ok(!removed.parts.find(p => p.id === 'r9').mount);
  assert.throws(() => removeBoard(project, 'main'));
  assert.throws(() => addBoard(addBoard(addBoard(project).project).project), /up to 4/);
});
test('footprints place inline, tactile and dual-row parts from pin 1 and rotate in quarter turns', () => {
  const project = circuit([part('potentiometer', 'pot'), part('button', 'sw'), device(['1', '2', '3', '4', '5', '6', '7', '8'], {footprint: {kind: 'dual', spread: 1, numbering: 'ccw'}})]);
  assert.deepEqual(footprintHoles(project, project.parts[0], 'c10'), {a: 'c10', w: 'c11', b: 'c12'});
  assert.deepEqual(footprintHoles(project, project.parts[1], 'e4'), {'1a': 'e4', '1b': 'f4', '2a': 'e6', '2b': 'f6'});
  const dip = footprintHoles(project, project.parts[2], 'f10');
  assert.deepEqual([dip.p0, dip.p3, dip.p4, dip.p7], ['f10', 'f13', 'e13', 'e10']);
  const header = {...project.parts[2], footprint: {kind: 'dual', spread: 7, numbering: 'rows'}};
  assert.deepEqual(footprintOffsets(header).slice(3, 5), [['p3', 0, 3], ['p4', 7, 0]]);
  assert.throws(() => footprintHoles(project, project.parts[2], 'f29'), /needs room/);
  let placed = mountPart(project, 'pot', footprintHoles(project, project.parts[0], 'c10'));
  placed = rotateMountedPart(placed, 'pot');
  assert.deepEqual(placed.parts[0].mount.holes, {a: 'c10', w: 'd10', b: 'e10'});
  assert.throws(() => mountPart(project, 'u', {}), /Each lead|hole/);
  assert.throws(() => mountPart(circuit([part('supply', 's')]), 's', 'a1', 'a2'), /wires only/);
});
test('inserted multi-lead parts move as one shape, including onto another board', () => {
  const {project: withBoard} = addBoard(circuit([part('npn', 'q')]));
  let project = mountPart(withBoard, 'q', footprintHoles(withBoard, withBoard.parts[0], 'c10'));
  project = shiftMountedPart(project, 'q', 2, 1);
  assert.deepEqual(project.parts[0].mount.holes, {e: 'd12', b: 'd13', c: 'd14'});
  const target = findHole(project, 'b2.a3'), origin = findHole(project, 'd12');
  project = dragMountedPart(project, 'q', {x: target.x - origin.x, y: target.y - origin.y});
  assert.deepEqual(project.parts[0].mount.holes, {e: 'b2.a3', b: 'b2.a4', c: 'b2.a5'});
  assert.throws(() => shiftMountedPart(project, 'q', 0, -20));
});
test('the transistor switch lights the LED only while its button is pressed', () => {
  const project = transistorExample();
  assert.deepEqual(inspectWiring(project), []);
  const released = simulateCircuit(project);
  assert.ok(released.readings.led.current < 1e-6); assert.equal(released.readings.npn.region, 'off');
  project.parts.find(p => p.id === 'button').closed = true;
  const pressed = simulateCircuit(project);
  assert.equal(pressed.status, 'ok'); assert.equal(pressed.readings.npn.region, 'saturated');
  assert.ok(pressed.readings.led.current > .007 && pressed.readings.led.current < .01);
  assert.ok(pressed.readings.npn.voltage > .05 && pressed.readings.npn.voltage < .35);
  approx(pressed.readings.npn.base, (5 - pressed.voltages['npn:b']) / 1000, 1e-6);
  assert.equal(validateProject(JSON.parse(JSON.stringify(project))).parts.find(p => p.id === 'button').closed, false);
});
test('a misoriented push button is flagged because its sides are always joined', () => {
  const project = circuit([part('button', 'sw', {mount: {holes: {'1a': 'a4', '1b': 'b4', '2a': 'c4', '2b': 'd4'}}})]);
  assert.match(inspectWiring(project).find(c => c.target === 'sw').message, /Rotate it/);
});
test('transistors amplify in the active region, mirror for PNP and flag missing base resistors', () => {
  const npn = simulateCircuit(circuit([part('supply', 's', {value: 5}), part('npn', 'q'), part('resistor', 'rb', {value: 100000}), part('resistor', 'rc', {value: 100})], [['s:a', 'rb:a'], ['rb:b', 'q:b'], ['s:a', 'rc:a'], ['rc:b', 'q:c'], ['q:e', 's:b']]));
  assert.equal(npn.readings.q.region, 'active'); approx(npn.readings.q.current / npn.readings.q.base, 100, .5);
  const pnp = simulateCircuit(circuit([part('supply', 's', {value: 5}), part('pnp', 'q'), part('resistor', 'rb', {value: 10000}), part('resistor', 'rl', {value: 330}), part('led', 'l')], [['s:a', 'q:e'], ['q:b', 'rb:a'], ['rb:b', 's:b'], ['q:c', 'rl:a'], ['rl:b', 'l:a'], ['l:b', 's:b']]));
  assert.equal(pnp.status, 'ok'); assert.ok(pnp.readings.l.current > .007); assert.ok(pnp.readings.q.current < 0);
  const direct = simulateCircuit(circuit([part('supply', 's', {value: 5}), part('npn', 'q')], [['s:a', 'q:b'], ['q:e', 's:b']]));
  assert.match(direct.diagnostics.map(d => d.message).join(' '), /base resistor/);
  for (const rb of [1e7, 1e5, 4700, 470]) assert.notEqual(simulateCircuit(circuit([part('supply', 's', {value: 9}), part('npn', 'q'), part('resistor', 'rb', {value: rb}), part('resistor', 'rl', {value: 470}), part('led', 'l')], [['s:a', 'rb:a'], ['rb:b', 'q:b'], ['s:a', 'rl:a'], ['rl:b', 'l:a'], ['l:b', 'q:c'], ['q:e', 's:b']])).diagnostics.at(-1)?.message, 'The DC model did not converge. Simplify this circuit before relying on its readings.');
});
test('capacitors block DC, hold the charged voltage and check rating and polarity', () => {
  const rc = parts => simulateCircuit(circuit([part('supply', 's', {value: 9}), part('resistor', 'r', {value: 1000}), ...parts], [['s:a', 'r:a'], ['r:b', 'c:a'], ['c:b', 's:b']]));
  const charged = rc([part('capacitor', 'c', {value: 47, rating: 16})]);
  approx(charged.readings.c.voltage, 9, 1e-5); assert.equal(charged.readings.c.current, 0); approx(charged.readings.c.charge, 47 * 9, 1e-3);
  assert.match(charged.diagnostics.map(d => d.message).join(' '), /No closed load path/);
  assert.match(rc([part('capacitor', 'c', {rating: 6.3})]).diagnostics.map(d => d.message).join(' '), /exceeds its 6.3 V rating/);
  const reversed = simulateCircuit(circuit([part('supply', 's', {value: 5}), part('capacitor', 'c')], [['s:a', 'c:b'], ['c:a', 's:b']]));
  assert.match(reversed.diagnostics.map(d => d.message).join(' '), /reverse-biased electrolytic/);
  const ceramic = simulateCircuit(circuit([part('supply', 's', {value: 5}), part('capacitor', 'c', {polarized: false})], [['s:a', 'c:b'], ['c:a', 's:b']]));
  assert.ok(!ceramic.diagnostics.some(d => /reverse/.test(d.message)));
});
test('diodes conduct one way and buzzers sound only with the right polarity', () => {
  const run = (type, forward) => simulateCircuit(circuit([part('supply', 's', {value: 5}), part('resistor', 'r', {value: 100}), part(type, 'd')], [['s:a', 'r:a'], forward ? ['r:b', 'd:a'] : ['r:b', 'd:b'], forward ? ['d:b', 's:b'] : ['d:a', 's:b']]));
  const forward = run('diode', true);
  assert.ok(forward.readings.d.voltage > .6 && forward.readings.d.voltage < .85); approx(forward.readings.d.current, (5 - forward.readings.d.voltage) / 100, 1e-9);
  assert.ok(run('diode', false).readings.d.current < 1e-6);
  const buzzer = simulateCircuit(circuit([part('supply', 's', {value: 5}), part('buzzer', 'z')], [['s:a', 'z:a'], ['z:b', 's:b']]));
  approx(buzzer.readings.z.current, .025, 1e-4); assert.equal(buzzer.readings.z.sounding, true);
  const reversed = simulateCircuit(circuit([part('supply', 's', {value: 5}), part('buzzer', 'z')], [['s:a', 'z:b'], ['z:a', 's:b']]));
  assert.equal(reversed.readings.z.sounding, false); assert.match(reversed.diagnostics.map(d => d.message).join(' '), /reverse polarity/);
});
test('new parts validate their fields and get distinct designators in the parts list', () => {
  const project = circuit([part('capacitor', 'c1'), part('diode', 'd1'), part('led', 'd2'), part('npn', 'q1'), part('pnp', 'q2'), part('button', 'sw1'), part('buzzer', 'bz')]);
  assert.deepEqual([...partReferences(project).values()], ['C1', 'D1', 'D2', 'Q1', 'Q2', 'SW1', 'BZ1']);
  assert.deepEqual(validateProject(JSON.parse(JSON.stringify(project))), validateProject(project));
  assert.throws(() => validateProject({...project, parts: [{...project.parts[0], rating: 0}]}));
  assert.throws(() => validateProject({...project, parts: [{...project.parts[0], polarized: 'yes'}]}));
  assert.throws(() => validateProject({...project, parts: [{...project.parts[3], pins: project.parts[3].pins.slice(0, 2)}]}));
  assert.match(billOfMaterials(project).find(r => r.name === 'Capacitor').detail, /100 µF · 16 V · electrolytic/);
});
test('device power profiles model a load, check the entered voltage range and flag overdriven inputs', () => {
  const sensor = device(['VCC', 'GND', 'SDA', 'OUT'], {power: {vcc: 'p0', gnd: 'p1', voltage: 3.3, min: 3, max: 3.6, current: 33}});
  sensor.pins[2].role = 'bus'; sensor.pins[3].role = 'output';
  const run = volts => simulateCircuit(circuit([part('supply', 's', {value: volts}), sensor], [['s:a', 'u:p0'], ['s:b', 'u:p1'], ['s:a', 'u:p2'], ['s:a', 'u:p3']]));
  const ok = run(3.3);
  assert.equal(ok.status, 'ok'); approx(ok.readings.u.current, .033, 1e-9); approx(ok.readings.s.current, .033, 1e-9);
  const high = run(5), messages = high.diagnostics.map(d => d.message).join(' ');
  assert.match(messages, /5.00 V at VCC exceeds the 3.6 V maximum/); assert.match(messages, /SDA sees 5.00 V/); assert.ok(!/OUT sees/.test(messages));
  assert.match(run(2.5).diagnostics.map(d => d.message).join(' '), /below the 3 V minimum/);
  const unpowered = simulateCircuit(circuit([part('supply', 's'), part('resistor', 'r'), sensor], [['s:a', 'r:a'], ['r:b', 's:b']]));
  assert.match(unpowered.diagnostics.map(d => d.message).join(' '), /VCC is not powered/);
  for (const power of [{...sensor.power, vcc: 'p0', gnd: 'p0'}, {...sensor.power, min: 4}, {...sensor.power, vcc: 'missing'}]) assert.throws(() => validateProject(circuit([{...sensor, power}])));
});
test('assigned roles catch shorts and reversed power without inferring anything from labels', () => {
  const pins = ['VCC', 'GND', 'NC'], roled = device(pins); roled.pins[0].role = 'power'; roled.pins[1].role = 'ground'; roled.pins[2].role = 'nc';
  const reversed = circuit([part('supply', 's'), roled], [['s:a', 'u:p1'], ['s:b', 'u:p0'], ['u:p2', 'hole:a1']]);
  const checks = inspectWiring(reversed).map(c => c.message).join(' ');
  assert.match(checks, /ground terminal GND is wired to DC supply \+/); assert.match(checks, /power terminal VCC is wired to DC supply −/); assert.match(checks, /NC is marked not connected but wired/);
  assert.match(inspectWiring(circuit([roled], [['u:p0', 'u:p1']])).map(c => c.message).join(' '), /VCC \(power\) and GND \(ground\) are connected/);
  assert.deepEqual(inspectWiring(circuit([part('supply', 's'), device(pins)], [['s:a', 'u:p1'], ['s:b', 'u:p0']])).filter(c => c.target === 'u'), []);
  assert.throws(() => validateProject(circuit([{...roled, pins: [{id: 'x', label: 'X', role: 'magic'}]}])));
});
test('the device library saves, reuses, merges and validates templates without positions or wiring', () => {
  const sensor = {...device(['VCC', 'GND', 'SCL', 'SDA'], {footprint: {kind: 'sip'}, revision: 'v2'}), x: 400, mount: undefined};
  sensor.pins[0].position = {x: .2, y: .3};
  let {library, id} = saveTemplate(emptyLibrary(), sensor);
  assert.equal(library.devices.length, 1); assert.ok(!('position' in library.devices[0].pins[0])); assert.equal(library.devices[0].footprint.kind, 'sip');
  ({library} = saveTemplate(library, {...sensor, templateId: id, name: 'Sensor v3'}));
  assert.equal(library.devices.length, 1); assert.equal(library.devices[0].name, 'Sensor v3');
  const copy = partFromTemplate(library.devices[0], 3);
  assert.equal(copy.templateId, id); assert.notEqual(copy.id, sensor.id); assert.ok(!copy.mount);
  const placed = validateProject(circuit([copy])); assert.equal(placed.parts[0].templateId, id);
  assert.deepEqual(validateLibrary(JSON.parse(JSON.stringify(library))), library);
  const merged = mergeLibrary(library, {...library, devices: [{...library.devices[0], name: 'Imported'}, {...library.devices[0], id: 'other'}]});
  assert.deepEqual(merged.devices.map(d => d.name), ['Imported', 'Sensor v3']);
  assert.throws(() => validateLibrary({...library, devices: [{...library.devices[0], name: ''}]}));
  assert.equal(loadLibrary({getItem: key => key === LIBRARY_KEY ? '{bad' : null}).blocked, true);
});
test('role suggestions only fill blanks and bulk terminal entry splits common separators', () => {
  assert.deepEqual(parsePinLabels('VCC, GND\nSDA;SCL\tGPIO4\n\n'), ['VCC', 'GND', 'SDA', 'SCL', 'GPIO4']);
  const pins = ['VCC', 'GND', '3V3', 'SDA', 'GPIO4', 'A0', 'NC', 'OUT', 'D7'].map((label, i) => ({id: 'p' + i, label}));
  pins[7].role = 'output';
  assert.deepEqual(suggestRoles(pins).map(p => p.role || ''), ['power', 'ground', 'power', 'bus', 'io', 'analog', 'nc', 'output', 'io']);
});
test('build sheets list every board and multi-lead insertion with exact holes', () => {
  const {project: boards} = addBoard(transistorExample(), 'mini');
  const html = buildSheetHtml(boards);
  assert.match(html, /Half breadboard/); assert.match(html, /Mini breadboard/); assert.match(html, />BB2</);
  assert.match(html, /1A → E4<br>1B → F4<br>2A → E6<br>2B → F6/); assert.match(html, /E → C10<br>B → C11<br>C → C12/);
  assert.equal(buildEndpointLabel(insertedLedExample(), 'led:a'), 'D1 LED · A + [at E14]');
});
test('transcribed catalog connectors load as ordered terminals and keep their provenance everywhere', () => {
  const image = 'media/' + 'a'.repeat(64) + '.png';
  const record = {id: 'demo-board', name: 'Demo board', pinConnectors: {method: 'image-transcription', review: 'partial', pendingConnectors: 1, images: [{file: image, sha256: 'a'.repeat(64)}], connectors: [
    {id: 'J1', rows: 1, image, pins: [{position: 1, label: '3V3', functions: []}, {position: 2, label: 'GPIO4', functions: ['ADC1_CH4', 'SDA']}]},
    {id: 'J3', rows: 1, image, pins: [{position: 1, label: 'GND', functions: []}, {position: 2, label: 'GPIO5', functions: []}]}]}};
  const part = {...createPart('device', 0, record), id: 'u'};
  assert.deepEqual(part.pins.map(p => [p.label, p.reference]), [['3V3', 'J1 · 1'], ['GPIO4', 'J1 · 2 · ADC1_CH4, SDA'], ['GND', 'J3 · 1'], ['GPIO5', 'J3 · 2']]);
  assert.deepEqual(part.pinSource, {method: 'image-transcription', review: 'partial', image, connectors: 'J1 (2), J3 (2)', pending: 1});
  const project = validateProject(circuit([part]));
  assert.deepEqual(project.parts[0].pinSource, part.pinSource);
  assert.match(billOfMaterials(project)[0].detail, /transcribed from the pinout image/);
  assert.deepEqual(partFromTemplate(saveTemplate(emptyLibrary(), part).library.devices[0]).pinSource, part.pinSource);
  for (const pinSource of [{...part.pinSource, review: 'guessed'}, {...part.pinSource, image: '../secret.png'}, {...part.pinSource, method: 'ocr'}]) assert.throws(() => validateProject(circuit([{...part, pinSource}])), /terminal source/);
  // Sourced pin references still take precedence over transcriptions.
  assert.equal(createPart('device', 0, {...record, pinReferences: [{connector: 'H1', pins: [{label: 'VIN', position: '1'}]}]}).pinSource, undefined);
});
test('single-entry transcriptions load with a note that says only one reading was made', () => {
  const image = 'media/' + 'b'.repeat(64) + '.jpg';
  const part = {...createPart('device', 0, {id: 'one-read', name: 'One read', pinConnectors: {method: 'image-transcription', review: 'single-entry', images: [{file: image}], connectors: [{id: 'J1', rows: 1, image, pins: [{position: 1, label: 'GND', functions: []}]}]}}), id: 'u'};
  assert.equal(validateProject(circuit([part])).parts[0].pinSource.review, 'single-entry');
  assert.match(PIN_SOURCE_REVIEWS['single-entry'], /transcribed once/);
});
test('OCR-checked transcriptions keep their machine-check level and caveats', () => {
  const image = 'media/' + 'c'.repeat(64) + '.png';
  const record = {id: 'ocr-board', name: 'OCR board', pinConnectors: {method: 'image-transcription', review: 'ocr-checked', caveats: ['Pin 1 end inferred by the reader', 'Not machine-confirmed: GPIO11'], images: [{file: image}], connectors: [{id: 'J1', rows: 1, image, pins: [{position: 1, label: 'GND', functions: []}, {position: 2, label: 'GPIO11', functions: []}]}]}};
  const part = validateProject(circuit([{...createPart('device', 0, record), id: 'u'}])).parts[0];
  assert.equal(part.pinSource.review, 'ocr-checked'); assert.match(part.pinSource.caveats, /Pin 1 end inferred.*GPIO11/);
  assert.match(PIN_SOURCE_REVIEWS['ocr-arbitrated'], /picked the one matching the image/);
  assert.throws(() => validateProject(circuit([{...part, pinSource: {...part.pinSource, caveats: 'x'.repeat(301)}}])));
});
test('catalog records are split by whether they arrive with terminals', async () => {
  const {pinStatus, splitByPins} = await import('../src/catalog-pins.mjs');
  const transcribed = {id: 't', pinConnectors: {review: 'ocr-checked', connectors: [{pins: [{}, {}, {}]}, {pins: [{}]}]}};
  const sourced = {id: 's', pinReferences: [{connector: 'J1', pins: [{label: 'GND'}, {label: 'VCC'}]}], pinConnectors: transcribed.pinConnectors};
  assert.deepEqual(pinStatus(transcribed), {ready: true, count: 4, level: 'ocr-checked', text: 'OCR-checked'});
  assert.equal(pinStatus(sourced).level, 'sourced'); assert.equal(pinStatus(sourced).count, 2);
  assert.deepEqual(pinStatus({pinLabels: ['A', 'B']}), {ready: true, count: 2, level: 'labels', text: 'Pin label list'});
  assert.equal(pinStatus({id: 'none'}).ready, false);
  const {ready, missing} = splitByPins([{record: transcribed}, {record: {id: 'none'}}, {record: sourced}]);
  assert.deepEqual([ready.length, missing.length], [2, 1]);
  // Every "ready" record really produces that many terminals when added.
  for (const record of [transcribed, sourced, {pinLabels: ['A', 'B']}]) assert.equal(createPart('device', 0, record).pins.length, pinStatus(record).count);
});
