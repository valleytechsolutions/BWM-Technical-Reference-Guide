import test from 'node:test';
import assert from 'node:assert/strict';
import {createPart, emptyProject, validateProject, ledExample, dimmerExample, partSize, partBounds, localToWorld, worldToLocal, pinPosition, endpointPosition, duplicatePart, removeTerminal, reconnectWire, insertWireBend, simulateCircuit} from '../src/breadboard.mjs';
import {PROJECTS_KEY, createWorkspace, validateWorkspace, loadWorkspace, activeProject, updateActiveProject, addProject, deleteProject} from '../src/circuit-projects.mjs';

test('all four rotations preserve contact geometry and invert pointer coordinates', () => {
  const part = {...createPart('device'), x: 40, y: 55, referenceImage: true, pins: [{id: 'signal', label: 'OUT', position: {x: .2, y: .7}}]};
  for (const rotation of [0, 90, 180, 270]) {
    part.rotation = rotation;
    const local = {x: partSize(part).width * .2, y: partSize(part).height * .7};
    const point = localToWorld(part, local), restored = worldToLocal(part, point);
    assert.deepEqual(pinPosition(part, 'signal'), point);
    assert.ok(Math.abs(restored.x - local.x) < 1e-9 && Math.abs(restored.y - local.y) < 1e-9);
    assert.equal(partBounds(part).width, rotation % 180 ? 260 : 300);
  }
});
test('moving and rotating a wired device keeps its endpoint attached without changing electrical nets', () => {
  const project = validateProject(ledExample()), before = simulateCircuit(project).readings.led.current;
  const p = project.parts[0]; p.rotation = 90; p.x += 100; p.y += 200;
  assert.deepEqual(endpointPosition(project, 'supply:a'), pinPosition(p, 'a'));
  assert.equal(simulateCircuit(project).readings.led.current, before);
});
test('duplicate parts have independent terminals and do not duplicate connections', () => {
  const project = validateProject(ledExample()), next = duplicatePart(project, 'led');
  assert.equal(next.project.parts.length, 5); assert.equal(next.project.wires.length, 9);
  assert.notEqual(next.id, 'led');
  next.project.parts.at(-1).pins[0].label = 'Copy terminal';
  assert.equal(project.parts.find(p => p.id === 'led').pins[0].label, 'A +');
  assert.ok(!next.project.wires.some(w => w.from.startsWith(next.id + ':') || w.to.startsWith(next.id + ':')));
});
test('removing a custom terminal removes only attached wires', () => {
  const project = ledExample(), device = {...createPart('device'), id: 'd', pins: [{id: 'gnd', label: 'GND'}, {id: 'out', label: 'OUT'}]};
  project.parts.push(device); project.wires.push({id: 'dw', from: 'd:gnd', to: 'hole:a1', color: '#112233'});
  const next = removeTerminal(project, 'd', 'gnd');
  assert.equal(next.wires.length, 9); assert.deepEqual(next.parts.at(-1).pins, [{id: 'out', label: 'OUT'}]);
  assert.equal(project.wires.length, 10);
});
test('wire reconnection is atomic and rejects invalid, self-connected and duplicate pairs', () => {
  const project = validateProject(ledExample());
  assert.throws(() => reconnectWire(project, 'wire0', 'to', 'supply:a'));
  assert.throws(() => reconnectWire(project, 'wire0', 'to', 'hole:tp31'));
  assert.equal(project.wires[0].to, 'hole:tp2');
  const next = reconnectWire(project, 'wire0', 'to', 'hole:bp2');
  assert.equal(next.wires[0].to, 'hole:bp2');
  assert.notEqual(simulateCircuit(next).status, 'ok');
});
test('wire bends, labels and mapped terminals survive file round trips', () => {
  const project = validateProject(ledExample());
  const next = insertWireBend(project, 'wire0', {x: 200, y: 200});
  next.wires[0].label = 'Positive rail';
  const device = {...createPart('device'), referenceImage: true, rotation: 270, pins: [{id: 'p', label: 'GND', position: {x: .2, y: .8}}]};
  next.parts.push(device);
  const restored = validateProject(JSON.parse(JSON.stringify(next)));
  assert.deepEqual(restored.wires[0].points, [{x: 200, y: 200}]); assert.equal(restored.wires[0].label, 'Positive rail');
  assert.deepEqual(restored.parts.at(-1).pins[0].position, {x: .2, y: .8}); assert.equal(restored.parts.at(-1).rotation, 270);
  assert.equal(simulateCircuit(restored).readings.led.current, simulateCircuit(project).readings.led.current);
  assert.equal(project.wires[0].points.length, 0);
});
test('malformed extensions are rejected instead of silently changing a circuit', () => {
  for (const mutate of [p => p.parts[0].rotation = 45, p => p.wires[0].points = [{x: NaN, y: 10}], p => p.wires[0].points = Array(25).fill({x: 5, y: 5}), p => p.wires[0].label = {}, p => p.parts[0].pins[0].position = {x: .5, y: .5}]) {
    const project = ledExample(); mutate(project); assert.throws(() => validateProject(project));
  }
});
test('the dimmer responds monotonically, reaches both ends, and conserves wiper current', () => {
  const project = validateProject(dimmerExample()), pot = project.parts.find(p => p.type === 'potentiometer'); let last = -1;
  for (const position of [0, 25, 50, 75, 100]) {
    pot.position = position;
    const result = simulateCircuit(project);
    assert.equal(result.status, 'ok'); assert.ok(result.readings.led.current > last); last = result.readings.led.current;
    assert.ok(Math.abs(result.readings.dimmer.wiperCurrent - result.readings.led.current) < 1e-8);
    if (position === 0) assert.ok(result.readings.led.current < 1e-7);
    if (position === 100) assert.ok(result.readings.led.current > .008);
    assert.ok(!Object.keys(result.readings).some(id => id.includes('~')));
  }
});
test('v1 circuits migrate without modifying the old saved circuit', () => {
  const old = {...ledExample(), version: 1}, raw = JSON.stringify(old), storage = new Map([['blackwire-breadboard-v1', raw]]);
  const loaded = loadWorkspace({getItem: key => storage.get(key) ?? null});
  assert.equal(loaded.blocked, false); assert.equal(activeProject(loaded.workspace).version, 3); assert.equal(activeProject(loaded.workspace).parts.length, 4);
  assert.equal(storage.get('blackwire-breadboard-v1'), raw); assert.equal(storage.has(PROJECTS_KEY), false);
});
test('projects save separately and delete without losing unrelated builds', () => {
  const first = createWorkspace(ledExample()), firstId = first.activeId;
  let workspace = addProject(first, dimmerExample()); const secondId = workspace.activeId;
  workspace = updateActiveProject(workspace, project => ({...project, name: 'My dimmer'}));
  assert.equal(workspace.entries[0].project.name, 'First light · LED circuit'); assert.equal(activeProject(workspace).name, 'My dimmer');
  const restored = validateWorkspace(JSON.parse(JSON.stringify(workspace))); assert.equal(restored.activeId, secondId);
  workspace = deleteProject(restored, secondId); assert.equal(workspace.activeId, firstId); assert.equal(workspace.entries.length, 1);
  workspace = deleteProject(workspace, firstId); assert.equal(workspace.entries.length, 1); assert.equal(activeProject(workspace).parts.length, 0);
});
test('corrupt project collections remain untouched and cannot fall back to stale legacy data', () => {
  const raw = '{broken', storage = new Map([[PROJECTS_KEY, raw], ['blackwire-breadboard-v1', JSON.stringify(ledExample())]]);
  const loaded = loadWorkspace({getItem: key => storage.get(key) ?? null});
  assert.equal(loaded.blocked, true); assert.equal(activeProject(loaded.workspace).parts.length, 0); assert.equal(storage.get(PROJECTS_KEY), raw);
  const duplicate = createWorkspace(); duplicate.entries.push(duplicate.entries[0]); assert.throws(() => validateWorkspace(duplicate));
  const missing = createWorkspace(); missing.activeId = 'missing'; assert.throws(() => validateWorkspace(missing));
});
