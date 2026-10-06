import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyProject, createPart, validateProject, circuitNets, simulateCircuit, ledExample, WIRE_COLORS} from '../src/breadboard.mjs';

const approx = (actual, expected, tolerance = 1e-6) => assert.ok(Math.abs(actual - expected) < tolerance, `${actual} should be near ${expected}`);
const part = (type, id, value) => ({...createPart(type), id, ...(value == null ? {} : {value})});
function circuit(parts, links = []) { return {...emptyProject(), parts, wires: links.map(([from, to], i) => ({id: 'w' + i, from, to, color: WIRE_COLORS[0]}))}; }

test('breadboard strips connect five holes, separate the trench and separate continuous rails', () => {
  const nets = circuitNets(emptyProject());
  assert.equal(nets.find('hole:a1'), nets.find('hole:e1'));
  assert.equal(nets.find('hole:f1'), nets.find('hole:j1'));
  assert.notEqual(nets.find('hole:e1'), nets.find('hole:f1'));
  assert.notEqual(nets.find('hole:a1'), nets.find('hole:a2'));
  assert.equal(nets.find('hole:tp1'), nets.find('hole:tp30'));
  assert.notEqual(nets.find('hole:tp1'), nets.find('hole:tn1'));
  assert.notEqual(nets.find('hole:tp1'), nets.find('hole:bp1'));
});
test('starter LED circuit solves with realistic series current and saves losslessly', () => {
  const example = validateProject(ledExample()), result = simulateCircuit(example);
  assert.equal(result.status, 'ok');
  approx(result.readings.led.current, 3 / 350, 1e-6);
  approx(result.readings.supply.current, result.readings.led.current);
  approx(result.voltages['hole:tp30'], 5);
  approx(result.voltages['hole:tn30'], 0);
  assert.deepEqual(validateProject(JSON.parse(JSON.stringify(example))), example);
});
test('opening and reclosing a switch stops and restores LED current', () => {
  const example = ledExample(); example.parts.find(p => p.type === 'switch').closed = false;
  const result = simulateCircuit(example);
  approx(result.readings.led.current, 0);
  assert.match(result.diagnostics.map(d => d.message).join(' '), /No closed load path/);
  example.parts.find(p => p.type === 'switch').closed = true;
  assert.ok(simulateCircuit(example).readings.led.current > .008);
});
test('series resistors obey voltage division; parallel branches conserve current', () => {
  const parts = [part('supply', 's', 9), part('resistor', 'r1', 1000), part('resistor', 'r2', 2000)];
  const series = simulateCircuit(circuit(parts, [['s:a', 'r1:a'], ['r1:b', 'r2:a'], ['r2:b', 's:b']]));
  approx(series.readings.r1.voltage, 3); approx(series.readings.r2.voltage, 6); approx(series.readings.s.current, .003);
  const parallel = simulateCircuit(circuit(parts, [['s:a', 'r1:a'], ['s:a', 'r2:a'], ['s:b', 'r1:b'], ['s:b', 'r2:b']]));
  approx(parallel.readings.s.current, .0135);
});
test('multiple forward LEDs converge in series and parallel', () => {
  const parts = [part('supply', 's', 9), part('resistor', 'r', 1000), part('led', 'l1', 2), part('led', 'l2', 2)];
  const result = simulateCircuit(circuit(parts, [['s:a', 'r:a'], ['r:b', 'l1:a'], ['l1:b', 'l2:a'], ['l2:b', 's:b']]));
  assert.equal(result.status, 'ok'); approx(result.readings.l1.current, 5 / 1040, 2e-6);
  const parallel = simulateCircuit(circuit(parts, [['s:a', 'r:a'], ['r:b', 'l1:a'], ['r:b', 'l2:a'], ['l1:b', 's:b'], ['l2:b', 's:b']]));
  assert.equal(parallel.status, 'ok'); approx(parallel.readings.l1.current, parallel.readings.l2.current); approx(parallel.readings.r.current, 2 * parallel.readings.l1.current);
});
test('shorted supply via a connected strip produces no fabricated readings', () => {
  const result = simulateCircuit(circuit([part('supply', 's', 5)], [['s:a', 'hole:a1'], ['s:b', 'hole:e1']]));
  assert.equal(result.status, 'error'); assert.match(result.diagnostics[0].message, /short circuit/); assert.deepEqual(Object.keys(result.readings), []);
});
test('LED without current limiting and overloaded resistor are flagged', () => {
  const result = simulateCircuit(circuit([part('supply', 's', 5), part('led', 'l', 2), part('resistor', 'r', 10)], [['s:a', 'l:a'], ['s:b', 'l:b'], ['s:a', 'r:a'], ['s:b', 'r:b']]));
  assert.equal(result.status, 'error'); assert.match(result.diagnostics.map(d => d.message).join(' '), /20 mA/); assert.match(result.diagnostics.map(d => d.message).join(' '), /¼ W/);
});
test('reverse LED warns without showing illumination', () => {
  const result = simulateCircuit(circuit([part('supply', 's', 5), part('resistor', 'r', 330), part('led', 'l', 2)], [['s:a', 'r:a'], ['r:b', 'l:b'], ['l:a', 's:b']]));
  assert.ok(result.readings.l.current < .000001); assert.match(result.diagnostics.map(d => d.message).join(' '), /reverse polarity/);
});
test('disconnected components are floating, while independent supplies solve independently', () => {
  const parts = [part('supply', 's', 5), part('resistor', 'r', 1000), part('resistor', 'floating', 330), part('supply', 's2', 3.3), part('resistor', 'r2', 1000)];
  const result = simulateCircuit(circuit(parts, [['s:a', 'r:a'], ['s:b', 'r:b'], ['s2:a', 'r2:a'], ['s2:b', 'r2:b']]));
  assert.equal(result.readings.floating.voltage, null); assert.equal(result.voltages['floating:a'], undefined);
  approx(result.readings.r.current, .005); approx(result.readings.r2.current, .0033);
});
test('conflicting and redundant ideal supplies report unsolvable constraints', () => {
  for (const value of [3.3, 5]) {
    const result = simulateCircuit(circuit([part('supply', 's1', 5), part('supply', 's2', value)], [['s1:a', 's2:a'], ['s1:b', 's2:b']]));
    assert.equal(result.status, 'error'); assert.match(result.diagnostics[0].message, /constraints/);
  }
});
test('series supplies add voltage', () => {
  const result = simulateCircuit(circuit([part('supply', 's1', 5), part('supply', 's2', 3), part('resistor', 'r', 1000)], [['s1:a', 's2:b'], ['s2:a', 'r:a'], ['r:b', 's1:b']]));
  assert.equal(result.status, 'ok'); approx(result.readings.r.voltage, 8);
});
test('catalog devices preserve documented names and never claim electrical simulation', () => {
  const device = createPart('device', 0, {id: 'dev', name: 'Example MCU', pinLabels: ['3V3', 'GND', 'GPIO0'], pinReferences: []}, 'maker');
  assert.deepEqual(device.pins.map(p => p.label), ['3V3', 'GND', 'GPIO0']);
  const result = simulateCircuit(circuit([device, part('supply', 's', 5)]));
  assert.equal(result.readings[device.id], undefined); assert.match(result.diagnostics[0].message, /not simulated/);
});
test('imports reject broken wires, duplicate identities, invalid values and extra endpoints', () => {
  const mutations = [
    p => p.wires[0].to = 'hole:a31', p => p.wires[0].from = 'missing:a', p => p.wires[0].color = 'url(evil)',
    p => p.wires.push({...p.wires[0], id: 'duplicate'}), p => p.parts[0].id = p.parts[1].id,
    p => p.parts[0].value = Infinity, p => p.parts[1].value = 0, p => p.parts[2].value = '2',
    p => p.parts[0].pins.push({id: 'c', label: 'extra'}), p => p.parts[0].type = 'constructor',
    p => p.parts[0].x = NaN, p => p.parts[3].closed = 'yes', p => p.wires[0].id = p.parts[0].id,
  ];
  for (const mutate of mutations) { const p = ledExample(); mutate(p); assert.throws(() => validateProject(p)); }
});
test('empty and no-supply circuits report an incomplete test', () => {
  assert.equal(simulateCircuit(emptyProject()).status, 'warning');
  assert.equal(simulateCircuit(circuit([part('led', 'l', 2)])).readings.l.voltage, null);
});
test('imported IDs that resemble object properties cannot create phantom readings', () => {
  const device = {...createPart('device'), id: 'constructor'};
  const result = simulateCircuit(validateProject(circuit([device, part('supply', '__proto__', 5), part('resistor', 'r', 1000)], [['__proto__:a', 'r:a'], ['__proto__:b', 'r:b']])));
  assert.equal(result.readings.constructor, undefined);
  approx(result.readings.__proto__.current, .005);
  assert.equal(Object.getPrototypeOf(result.readings), null);
});
