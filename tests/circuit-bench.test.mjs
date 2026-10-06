import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyProject, createPart, ledExample, validateProject, simulateCircuit, reconnectWire} from '../src/breadboard.mjs';
import {measureCircuit, inspectWiring, billOfMaterials, buildEndpointLabel, buildSheetHtml, partReferences} from '../src/circuit-bench.mjs';

test('voltmeter measures a signed difference without changing the circuit', () => {
  const project = ledExample(), before = JSON.stringify(project), result = simulateCircuit(project);
  const measure = (red, black) => measureCircuit(project, {red, black, mode: 'voltage'}, result);
  assert.equal(measure('hole:tp30', 'hole:tn30').value, 5);
  assert.equal(measure('hole:tn30', 'hole:tp30').value, -5);
  assert.ok(Math.abs(measure('resistor:a', 'resistor:b').value - result.readings.resistor.voltage) < 1e-8);
  assert.equal(measure('led:a', 'led:a').value, 0);
  assert.equal(measure('hole:bp1', 'hole:tn1').state, 'unknown');
  assert.equal(measure(null, 'hole:a1').state, 'pending');
  assert.equal(JSON.stringify(project), before);
});
test('voltmeter refuses to subtract voltages in unrelated floating supply groups', () => {
  const project = ledExample(); project.parts.push({...createPart('supply'), id: 'isolated', value: 9});
  const result = simulateCircuit(project);
  assert.equal(result.voltages['isolated:a'], 9);
  assert.equal(measureCircuit(project, {red: 'isolated:a', black: 'supply:b', mode: 'voltage'}, result).text, 'Separate floating circuits');
  project.wires.push({id: 'common-ground', from: 'isolated:b', to: 'supply:b', color: '#333333'});
  assert.equal(measureCircuit(project, {red: 'isolated:a', black: 'supply:b', mode: 'voltage'}, simulateCircuit(project)).value, 9);
});
test('continuity follows columns, separate rails and switch state but not resistors', () => {
  const project = ledExample(), read = (red, black) => measureCircuit(project, {red, black, mode: 'continuity'}, null).state;
  assert.equal(read('hole:a2', 'hole:e2'), 'connected'); assert.equal(read('hole:a2', 'hole:f2'), 'open');
  assert.equal(read('hole:tp1', 'hole:tp30'), 'connected'); assert.equal(read('hole:tp1', 'hole:bp1'), 'open');
  assert.equal(read('resistor:a', 'resistor:b'), 'open');
  assert.equal(read('switch:a', 'switch:b'), 'connected'); project.parts.find(p => p.type === 'switch').closed = false;
  assert.equal(read('switch:a', 'switch:b'), 'open');
  assert.equal(measureCircuit(project, {red: 'hole:a1', black: 'hole:e1', mode: 'continuity'}, simulateCircuit(project)).state, 'paused');
});
test('wiring checks distinguish physical hole crowding from shared breadboard strips', () => {
  const project = ledExample(); assert.deepEqual(inspectWiring(project), []);
  project.wires.push({id: 'extra', from: 'hole:tp2', to: 'hole:bp2', color: '#333333'});
  assert.equal(inspectWiring(project).filter(c => c.id.startsWith('crowded:')).length, 1);
  project.wires.at(-1).from = 'hole:tp3'; assert.deepEqual(inspectWiring(project), []);
  project.wires.push({id: 'bypass', from: 'resistor:a', to: 'resistor:b', color: '#333333'});
  assert.match(inspectWiring(project).find(c => c.target === 'resistor').message, /bypasses/);
});
test('unwired modeled terminals and shorted supplies locate the relevant component', () => {
  const project = emptyProject(), supply = {...createPart('supply'), id: 'ps'}; project.parts.push(supply);
  assert.match(inspectWiring(project)[0].message, /no wire/);
  project.wires.push({id: 'short', from: 'ps:a', to: 'ps:b', color: '#333333'});
  const issue = inspectWiring(project)[0]; assert.equal(issue.level, 'error'); assert.equal(issue.target, 'ps');
});
test('materials group identical values but preserve different specifications and device revisions', () => {
  const project = ledExample(); project.parts.push({...createPart('resistor'), id: 'r2'}, {...createPart('resistor'), id: 'r3', value: 1000});
  const rows = billOfMaterials(project).filter(r => r.name === 'Resistor');
  assert.equal(rows.length, 2); assert.equal(rows[0].quantity, 2); assert.deepEqual(rows[0].references, ['R1', 'R2']); assert.match(rows[1].detail, /1 kΩ/);
  assert.equal(partReferences(project).get('led'), 'D1');
  assert.match(buildEndpointLabel(project, 'resistor:a'), /^R1 Resistor/);
  assert.equal(buildEndpointLabel(project, 'hole:bn30'), 'Bottom − rail · 30');
  project.parts.push({...createPart('device'), id: 'u1', name: 'Sensor', revision: 'A'}, {...createPart('device'), id: 'u2', name: 'Sensor', revision: 'B'});
  assert.equal(billOfMaterials(project).filter(r => r.name === 'Sensor').length, 2);
});
test('notes and checklist progress survive files; changing endpoints clears only affected progress', () => {
  const project = ledExample(); project.notes = 'Use silicone wire\nCheck polarity'; project.wires[0].built = true; project.wires[1].built = true;
  const restored = validateProject(JSON.parse(JSON.stringify(project)));
  assert.equal(restored.notes, project.notes); assert.equal(restored.wires[0].built, true);
  const changed = reconnectWire(restored, 'wire0', 'to', 'hole:tp3');
  assert.ok(!changed.wires[0].built); assert.equal(changed.wires[1].built, true); assert.equal(restored.wires[0].built, true);
  assert.equal(reconnectWire(restored, 'wire0', 'to', 'hole:tp2').wires[0].built, true);
  assert.throws(() => validateProject({...project, notes: 'a'.repeat(4001)}));
  assert.throws(() => validateProject({...project, wires: project.wires.map(w => ({...w, built: 'yes'}))}));
});
test('portable build sheet escapes user content and includes every exact wiring endpoint', () => {
  const project = ledExample(); project.name = '<script>bad()</script>'; project.notes = '<img src=x onerror=bad()> & "notes"'; project.wires[0].label = '<b>Supply</b>';
  const sheet = buildSheetHtml(project);
  assert.ok(!sheet.includes('<script>')); assert.ok(!sheet.includes('<img')); assert.ok(!sheet.includes('<b>Supply</b>'));
  assert.ok(sheet.includes('&lt;script&gt;bad()&lt;/script&gt;')); assert.ok(sheet.includes('&lt;img src=x onerror=bad()&gt;'));
  assert.ok(sheet.includes('viewBox="0 0 1200 840"')); assert.ok(sheet.includes('@media print'));
  for (const wire of project.wires) for (const endpoint of [wire.from, wire.to]) assert.ok(sheet.includes(buildEndpointLabel(project, endpoint)));
  assert.ok(!sheet.includes('/library/')); assert.ok(!sheet.includes('<image'));
});
