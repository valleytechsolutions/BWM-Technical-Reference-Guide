import test from 'node:test';
import assert from 'node:assert/strict';
import {createPart, emptyProject, ledExample, validateProject, simulateCircuit, circuitNets, endpointPosition, duplicatePart} from '../src/breadboard.mjs';
import {mountPart, unmountPart, shiftMountedPart, dragMountedPart, holeOccupants, insertedLedExample} from '../src/breadboard-placement.mjs';
import {inspectWiring, measureCircuit, buildSheetHtml} from '../src/circuit-bench.mjs';

test('inserted leads replace four jumper connections without changing the solved LED current', () => {
  const project = insertedLedExample(), result = simulateCircuit(project);
  assert.equal(project.wires.length, 4); assert.equal(result.status, 'ok');
  assert.ok(Math.abs(result.readings.led.current - simulateCircuit(ledExample()).readings.led.current) < 1e-8);
  assert.deepEqual(inspectWiring(project), []);
  const nets = circuitNets(project);
  assert.equal(nets.find('resistor:a'), nets.find('hole:a8'));
  assert.equal(nets.find('led:a'), nets.find('hole:a14'));
  assert.notEqual(nets.find('led:a'), nets.find('led:b'));
  assert.deepEqual(endpointPosition(project, 'led:a'), endpointPosition(project, 'hole:e14'));
  assert.equal(measureCircuit(project, {red: 'led:a', black: 'hole:a14', mode: 'continuity'}, null).state, 'connected');
});
test('putting both component leads in one strip is an electrical bypass', () => {
  const project = mountPart(insertedLedExample(), 'led', 'd14', 'e14');
  assert.match(inspectWiring(project).find(c => c.target === 'led').message, /bypasses/);
  assert.ok(Math.abs(simulateCircuit(project).readings.led.current) < 1e-6);
});
test('mounting prevents duplicate holes and collisions with another lead or a jumper end', () => {
  const project = insertedLedExample(), original = JSON.stringify(project);
  for (const [a, b] of [['a1', 'a1'], ['a31', 'b1'], ['tp2', 'b1'], ['e14', 'b1']]) assert.throws(() => mountPart(project, 'resistor', a, b));
  assert.throws(() => mountPart(project, 'supply', 'a1', 'a2'));
  assert.equal(JSON.stringify(project), original);
  assert.equal(holeOccupants(project).get('c8')[0].kind, 'lead');
  assert.equal(holeOccupants(project).get('tp2')[0].kind, 'wire');
});
test('moving inserted parts uses holes, keeps wire endpoints, and clears physical assembly progress', () => {
  const project = insertedLedExample(); project.parts.find(p => p.id === 'resistor').mount.built = true;
  project.wires.push({id: 'lead-wire', from: 'resistor:a', to: 'hole:a3', color: '#333333', built: true});
  const moved = shiftMountedPart(project, 'resistor', 1, 0), mount = moved.parts.find(p => p.id === 'resistor').mount;
  assert.deepEqual(mount, {holes: {a: 'c9', b: 'c15'}}); assert.equal(moved.wires.at(-1).from, 'resistor:a'); assert.ok(!moved.wires.at(-1).built);
  assert.throws(() => shiftMountedPart(project, 'resistor', -10, 0));
  const dragged = dragMountedPart(project, 'resistor', {x: 26, y: 0});
  assert.deepEqual(dragged.parts.find(p => p.id === 'resistor').mount, mount);
  assert.equal(project.parts.find(p => p.id === 'resistor').mount.built, true);
});
test('lifting disconnects only the mount, and duplication creates an uninserted independent part', () => {
  const project = insertedLedExample(), lifted = unmountPart(project, 'led');
  assert.ok(!lifted.parts.find(p => p.id === 'led').mount); assert.equal(lifted.wires.length, 4);
  assert.notEqual(circuitNets(lifted).find('led:a'), circuitNets(lifted).find('hole:e14'));
  const copy = duplicatePart(project, 'resistor'); assert.ok(!copy.project.parts.at(-1).mount);
  assert.equal(copy.project.parts.find(p => p.id === 'resistor').mount.holes.a, 'c8');
});
test('v3 preserves lead positions and assembly state; old circuits upgrade with unchanged connectivity', () => {
  const project = insertedLedExample(); project.parts[1].mount.built = true;
  assert.deepEqual(validateProject(JSON.parse(JSON.stringify(project))), project);
  for (const version of [1, 2]) {
    const restored = validateProject({...ledExample(), version});
    assert.equal(restored.version, 3); assert.equal(restored.parts.some(p => p.mount), false);
    assert.equal(simulateCircuit(restored).readings.led.current, simulateCircuit(ledExample()).readings.led.current);
  }
  assert.throws(() => validateProject({...project, version: 2}));
  for (const mount of [{holes: {a: 'a1', b: 'a1'}}, {holes: {a: 'x1', b: 'a1'}}, {holes: {a: 'a1', b: 'a2'}, built: 'yes'}, {holes: {a: 'a1'}}, {a: 'a1', b: 'a1'}]) assert.throws(() => validateProject({...project, parts: project.parts.map(p => p.id === 'resistor' ? {...p, mount} : p)}));
});
test('imported physical overlaps stay visible in wiring checks instead of changing the circuit', () => {
  const project = insertedLedExample(); project.wires.push({id: 'crowded', from: 'hole:c8', to: 'hole:bp1', color: '#333333'});
  const restored = validateProject(project), check = inspectWiring(restored).find(c => c.id === 'crowded:hole:c8');
  assert.match(check.message, /2 wire ends or component leads/); assert.equal(check.target, 'resistor');
});
test('portable build sheet includes component insertion and exact lead polarity', () => {
  const project = insertedLedExample(); project.parts[2].mount.built = true;
  const html = buildSheetHtml(project);
  assert.match(html, /Insert the components/); assert.match(html, /A \+ → E14/); assert.match(html, /K − → F14/);
  assert.ok(html.includes('class="mounting"')); assert.ok(html.includes('R1 · 330 Ω'));
});
