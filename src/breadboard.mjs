// A deliberately bounded DC workbench. Catalog records are connection plans,
// not inferred electrical models. Only explicit wires and lead mounts make contact.
import {MAX_BOARDS, MAX_COORDINATE, boardLabel, findHole, isHoleEndpoint, mainBoard, parseHole, projectBoards, projectHoles, validateBoards} from './breadboard-boards.mjs';

export const PROJECT_KEY = 'blackwire-breadboard-v1';
export const WIRE_COLORS = ['#ef5350', '#62b5f0', '#e5be69', '#71ce9e', '#b694ed', '#a6adb9'];
// coordinate: the largest x/y for parts and boards; the workspace grows to it as you zoom out.
export const LIMITS = {parts: 60, wires: 400, pins: 512, bends: 24, projects: 50, boards: MAX_BOARDS, coordinate: MAX_COORDINATE};
// mount: 'pair' parts choose any two holes; 'inline' and 'button' parts follow a fixed footprint.
export const PARTS = {
  supply: {name: 'DC supply', detail: 'Adjustable ideal voltage source', value: 5, unit: 'V', label: 'Supply voltage (V)', min: .1, max: 48, pins: [{id: 'a', label: '+'}, {id: 'b', label: '−'}]},
  resistor: {name: 'Resistor', detail: 'Resistance and power estimate', value: 330, unit: 'Ω', label: 'Resistance (Ω)', min: 1, max: 10000000, mount: 'pair', pins: [{id: 'a', label: '1'}, {id: 'b', label: '2'}]},
  led: {name: 'LED', detail: 'Polarity, light and current', value: 2, unit: 'V forward', label: 'LED forward voltage (V)', min: .5, max: 5, mount: 'pair', pins: [{id: 'a', label: 'A +'}, {id: 'b', label: 'K −'}]},
  diode: {name: 'Diode', detail: 'One-way current · rectifier', value: .7, unit: 'V forward', label: 'Forward voltage (V)', min: .1, max: 2, mount: 'pair', pins: [{id: 'a', label: 'A'}, {id: 'b', label: 'K'}]},
  capacitor: {name: 'Capacitor', detail: 'Charges, then blocks DC', value: 100, unit: 'µF', label: 'Capacitance (µF)', min: .000001, max: 100000, mount: 'pair', pins: [{id: 'a', label: '+'}, {id: 'b', label: '−'}],
    fields: {rating: {label: 'Voltage rating (V)', value: 16, min: 1, max: 1000}}, flags: {polarized: {label: 'Polarized (electrolytic)', value: true}}},
  switch: {name: 'Switch', detail: 'Open or close a connection', mount: 'pair', pins: [{id: 'a', label: '1'}, {id: 'b', label: '2'}]},
  button: {name: 'Push button', detail: 'Momentary 4-leg tactile switch', mount: 'button', pins: [{id: '1a', label: '1A'}, {id: '1b', label: '1B'}, {id: '2a', label: '2A'}, {id: '2b', label: '2B'}]},
  potentiometer: {name: 'Potentiometer', detail: 'Three-terminal variable divider', value: 10000, unit: 'Ω', label: 'Resistance (Ω)', min: 100, max: 1000000, mount: 'inline', pins: [{id: 'a', label: 'A'}, {id: 'w', label: 'Wiper'}, {id: 'b', label: 'B'}]},
  npn: {name: 'NPN transistor', detail: 'Low-side switch · TO-92', value: 100, unit: 'hFE', label: 'Current gain (hFE)', min: 10, max: 1000, mount: 'inline', pins: [{id: 'e', label: 'E'}, {id: 'b', label: 'B'}, {id: 'c', label: 'C'}]},
  pnp: {name: 'PNP transistor', detail: 'High-side switch · TO-92', value: 100, unit: 'hFE', label: 'Current gain (hFE)', min: 10, max: 1000, mount: 'inline', pins: [{id: 'e', label: 'E'}, {id: 'b', label: 'B'}, {id: 'c', label: 'C'}]},
  buzzer: {name: 'Active buzzer', detail: 'Polarized · sounds when powered', value: 5, unit: 'V rated', label: 'Rated voltage (V)', min: 1.5, max: 24, mount: 'pair', pins: [{id: 'a', label: '+'}, {id: 'b', label: '−'}],
    fields: {current: {label: 'Rated current (mA)', value: 25, min: 1, max: 200}}},
};
export const PIN_ROLES = {'': 'Unassigned', power: 'Power in', ground: 'Ground', io: 'GPIO / digital', input: 'Input', output: 'Output', analog: 'Analog', bus: 'Bus / comms', nc: 'Not connected'};
// How a catalog device's terminals were produced; shown wherever those terminals are used.
export const PIN_SOURCE_REVIEWS = {'ocr-checked': 'transcribed once from the manufacturer pinout image; machine text recognition found the labels on each connector in the same physical sequence', 'ocr-arbitrated': 'transcribed twice from the manufacturer pinout image; where the readings differed, machine text recognition picked the one matching the image', 'single-entry': 'transcribed once from the manufacturer pinout image, with source-hash and structural checks', 'double-entry': 'transcribed twice independently from the manufacturer pinout image, with matching results', partial: 'transcribed twice independently from the manufacturer pinout image; connectors that did not match are left out', reviewed: 'transcribed from the manufacturer pinout image and reviewed'};
export const FOOTPRINT_SPREADS = {1: 'E / F · 0.3 in (DIP)', 3: 'D / G', 5: 'C / H', 7: 'B / I · wide modules', 9: 'A / J'};
export const mountKind = part => part.type === 'device' ? part.footprint ? 'footprint' : null : PARTS[part.type]?.mount || null;
export const uid = () => globalThis.crypto.randomUUID();
export const emptyProject = () => ({format: 'black-wire-breadboard', version: 3, name: 'Untitled circuit', boards: [mainBoard()], parts: [], wires: []});
export function partSize(part) {
  const height = part.type === 'device' ? part.referenceImage ? 260 : Math.max(144, 66 + Math.ceil(part.pins.length / 2) * 24) : part.type === 'potentiometer' ? 170 : ['npn', 'pnp'].includes(part.type) ? 150 : 112;
  return {width: part.referenceImage ? 300 : 166, height};
}
export function partBounds(part) { const size = partSize(part); return (part.rotation || 0) % 180 ? {width: size.height, height: size.width} : size; }
export function localToWorld(part, point) {
  const {width, height} = partSize(part), {x, y} = point;
  const p = part.rotation === 90 ? {x: height - y, y: x} : part.rotation === 180 ? {x: width - x, y: height - y} : part.rotation === 270 ? {x: y, y: width - x} : point;
  return {x: part.x + p.x, y: part.y + p.y};
}
export function worldToLocal(part, point) {
  const {width, height} = partSize(part), x = point.x - part.x, y = point.y - part.y;
  return part.rotation === 90 ? {x: y, y: height - x} : part.rotation === 180 ? {x: width - x, y: height - y} : part.rotation === 270 ? {x: width - y, y: x} : {x, y};
}
export function partTransform(part) {
  const {width, height} = partSize(part), offset = part.rotation === 90 ? [height, 0] : part.rotation === 180 ? [width, height] : part.rotation === 270 ? [0, width] : [0, 0];
  return `translate(${part.x + offset[0]} ${part.y + offset[1]}) rotate(${part.rotation || 0})`;
}
export function localPinPosition(part, pinId) {
  const index = part.pins.findIndex(p => p.id === pinId);
  const pin = part.pins[index], {width, height} = partSize(part);
  if (pin?.position) return {x: width * pin.position.x, y: height * pin.position.y};
  if (['potentiometer', 'npn', 'pnp'].includes(part.type)) return {x: [30, 83, 136][index], y: height};
  const spacing = part.referenceImage ? Math.min(24, (height - 95) / Math.max(1, Math.ceil(part.pins.length / 2) - 1)) : 24;
  return {x: index % 2 ? width : 0, y: 72 + Math.floor(index / 2) * spacing};
}
export const pinPosition = (part, pinId, project) => part.mount ? findHole(project, part.mount.holes[pinId]) : localToWorld(part, localPinPosition(part, pinId));
// Inserted parts are drawn from their lead holes: a centre, an axis from the first to the last lead, and a bounding box.
export function mountedGeometry(project, part) {
  const points = part.pins.map(pin => ({pin, ...pinPosition(part, pin.id, project)}));
  const first = points[0], last = points.at(-1), xs = points.map(p => p.x), ys = points.map(p => p.y);
  const box = {x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys)};
  return {points, a: first, b: last, box, x: (box.x0 + box.x1) / 2, y: (box.y0 + box.y1) / 2, angle: Math.atan2(last.y - first.y, last.x - first.x) * 180 / Math.PI, length: Math.min(48, Math.hypot(last.x - first.x, last.y - first.y) * .55)};
}
export function endpointPosition(project, endpoint) {
  if (endpoint.startsWith('hole:')) return findHole(project, endpoint.slice(5)) || null;
  const [id, pin] = endpoint.split(':');
  const part = project.parts.find(p => p.id === id);
  return part?.pins.some(p => p.id === pin) ? pinPosition(part, pin, project) : null;
}
export function holeName(project, id) {
  const hole = parseHole(id), board = projectBoards(project).find(b => b.id === hole?.board);
  return board ? `${boardLabel(board)} ${(hole.row + hole.column).toUpperCase()}` : id.toUpperCase();
}
export function endpointLabel(project, endpoint) {
  if (endpoint.startsWith('hole:')) return holeName(project, endpoint.slice(5));
  const [id, pin] = endpoint.split(':');
  const part = project.parts.find(p => p.id === id);
  return part ? `${part.name} · ${part.pins.find(p => p.id === pin)?.label || pin}` : endpoint;
}
export function createPart(type, index = 0, record, recordKind = 'board') {
  const base = {id: uid(), type, x: 35 + (index % 5) * 220, y: 45 + (Math.floor(index / 5) % 2) * 130, rotation: 0};
  if (type !== 'device') {
    const def = PARTS[type], extras = {};
    for (const [key, field] of Object.entries({...def.fields, ...def.flags})) extras[key] = field.value;
    return {...base, name: def.name, ...(def.value != null ? {value: def.value} : {}), closed: false, ...(type === 'potentiometer' ? {position: 50} : {}), ...extras, pins: def.pins.map(p => ({...p}))};
  }
  // Sourced pin references win; transcribed connector lists come next and carry their provenance.
  const transcribed = !record?.pinReferences?.length && record?.pinConnectors?.connectors?.length ? record.pinConnectors : null;
  const pins = record?.pinReferences?.length ? record.pinReferences.flatMap(r => r.pins.map(p => ({label: String(p.label).slice(0, 160), reference: [r.connector, p.position].filter(Boolean).join(' · ').slice(0, 300)})))
    : transcribed ? transcribed.connectors.flatMap(c => c.pins.map(p => ({label: String(p.label).slice(0, 160), reference: [c.id, p.position, (p.functions || []).join(', ')].filter(Boolean).join(' · ').slice(0, 300)})))
    : (record?.pinLabels || []).map(label => ({label: String(label).slice(0, 160)}));
  if (pins.length > LIMITS.pins) throw new Error(`This device has ${pins.length} terminals; the workbench supports ${LIMITS.pins} per device. Use Device maker to define its connectors as separate devices.`);
  return {...base, name: record?.name || 'Custom device', recordId: record?.id || '', recordKind, revision: record?.revision || '', pins: pins.map((pin, i) => ({id: 'p' + i, ...pin})),
    ...(transcribed ? {pinSource: {method: 'image-transcription', review: transcribed.review, image: transcribed.images?.[0]?.file || '', connectors: transcribed.connectors.map(c => `${c.id} (${c.pins.length})`).join(', ').slice(0, 300), ...(transcribed.pendingConnectors ? {pending: transcribed.pendingConnectors} : {}), ...(transcribed.alternatives?.length ? {alternatives: transcribed.alternatives.length} : {}), ...(transcribed.caveats?.length ? {caveats: transcribed.caveats.join(' · ').slice(0, 300)} : {})}} : {})};
}
const text = (s, max = 200) => typeof s === 'string' && s.length <= max;
const inRange = (n, min, max) => Number.isFinite(n) && n >= min && n <= max;
// Device fields shared by circuit parts and saved device-library templates.
export function validateDeviceProfile(p, pinIds, fail) {
  if (p.footprint != null && (typeof p.footprint !== 'object' || !['sip', 'dual'].includes(p.footprint.kind) || (p.footprint.kind === 'dual' && (!Object.hasOwn(FOOTPRINT_SPREADS, p.footprint.spread) || !['ccw', 'rows'].includes(p.footprint.numbering))))) fail('Invalid device package.');
  const power = p.power;
  if (power != null && (typeof power !== 'object' || !pinIds.includes(power.vcc) || !pinIds.includes(power.gnd) || power.vcc === power.gnd || !inRange(power.min, 0, 48) || !inRange(power.max, power.min, 48) || !inRange(power.voltage, power.min, power.max) || !inRange(power.current, 0, 2000))) fail('Invalid device power profile. Choose distinct supply and ground terminals and a voltage range of 0–48 V.');
  // A board powered over USB: its ground pins and each output rail's pins are tied together, and each rail is a fixed voltage above ground.
  const out = p.powerOut;
  if (out != null) {
    const used = [...(Array.isArray(out.ground) ? out.ground : []), ...(Array.isArray(out.rails) ? out.rails.flatMap(r => Array.isArray(r?.pins) ? r.pins : []) : [])];
    if (typeof out !== 'object' || !Array.isArray(out.ground) || !out.ground.length || !Array.isArray(out.rails) || !out.rails.length || out.rails.length > 4 || out.rails.some(r => !r || !Array.isArray(r.pins) || !r.pins.length || !inRange(r.voltage, .1, 48)) || used.some(id => !pinIds.includes(id)) || new Set(used).size !== used.length) fail('Invalid board power output. Choose ground terminals and at least one output rail of 0.1–48 V.');
  }
  const source = p.pinSource;
  if (source != null && (typeof source !== 'object' || source.method !== 'image-transcription' || !PIN_SOURCE_REVIEWS[source.review] || !/^(media\/[a-f0-9]{64}\.[a-z0-9]{2,5})?$/.test(source.image || '') || !text(source.connectors || '', 300) || !text(source.caveats || '', 300) || [source.pending, source.alternatives].some(n => n != null && !(Number.isInteger(n) && inRange(n, 1, 100))))) fail('Invalid terminal source note.');
  return {
    ...(source ? {pinSource: {method: source.method, review: source.review, image: source.image || '', connectors: source.connectors || '', ...(source.pending ? {pending: source.pending} : {}), ...(source.alternatives ? {alternatives: source.alternatives} : {}), ...(source.caveats ? {caveats: source.caveats} : {})}} : {}),
    ...(p.footprint ? {footprint: p.footprint.kind === 'dual' ? {kind: 'dual', spread: Number(p.footprint.spread), numbering: p.footprint.numbering} : {kind: 'sip'}} : {}),
    ...(power ? {power: {vcc: power.vcc, gnd: power.gnd, voltage: power.voltage, min: power.min, max: power.max, current: power.current}} : {}),
    ...(out ? {powerOut: {ground: [...out.ground], rails: out.rails.map(r => ({voltage: r.voltage, pins: [...r.pins]}))}} : {}),
  };
}
export function validatePins(pins, device, fail, seen = new Set()) {
  return pins.map(pin => {
    if (!pin || !text(pin.id, 100) || !/^[\w-]+$/.test(pin.id) || !text(pin.label, 160) || seen.has(pin.id)) fail('A component has an invalid or duplicate terminal.');
    seen.add(pin.id);
    if (pin.position != null && (!device || ![pin.position.x, pin.position.y].every(n => inRange(n, 0, 1)))) fail('Invalid terminal position.');
    if (pin.reference != null && !text(pin.reference, 300)) fail('Invalid terminal reference.');
    if (pin.role != null && (!device || !Object.hasOwn(PIN_ROLES, pin.role))) fail('Invalid terminal role.');
    return {id: pin.id, label: pin.label, ...(pin.reference ? {reference: pin.reference} : {}), ...(pin.position ? {position: {x: pin.position.x, y: pin.position.y}} : {}), ...(pin.role ? {role: pin.role} : {})};
  });
}
export function validateProject(data) {
  const fail = message => { throw new Error(message); };
  if (!data || data.format !== 'black-wire-breadboard' || ![1, 2, 3].includes(data.version) || !text(data.name) || !Array.isArray(data.parts) || !Array.isArray(data.wires)) fail('This is not a supported Black Wire circuit file.');
  if (data.parts.length > LIMITS.parts || data.wires.length > LIMITS.wires) fail('Circuit exceeds the limit of 60 parts or 400 wires.');
  if (data.notes != null && !text(data.notes, 4000)) fail('Build notes must be text with at most 4,000 characters.');
  const boards = validateBoards(data.boards), layout = {boards};
  const ids = new Set(), endpoints = new Set(projectHoles(layout).map(h => 'hole:' + h.id));
  const parts = data.parts.map(p => {
    if (!p || !text(p.id, 100) || !/^[\w-]+$/.test(p.id) || p.id === 'hole' || ids.has(p.id) || !text(p.name) || !(p.type === 'device' || Object.hasOwn(PARTS, p.type))) fail('A component has an invalid type, name or duplicate ID.');
    ids.add(p.id);
    if (p.rotation != null && ![0, 90, 180, 270].includes(p.rotation)) fail('Invalid component rotation.');
    if (p.referenceImage != null && (p.type !== 'device' || typeof p.referenceImage !== 'boolean')) fail('Invalid reference layout.');
    if (![p.x, p.y].every(n => inRange(n, 0, LIMITS.coordinate)) || !Array.isArray(p.pins) || p.pins.length > LIMITS.pins) fail('A component has invalid coordinates or terminals.');
    const pins = validatePins(p.pins, p.type === 'device', fail);
    for (const pin of pins) endpoints.add(p.id + ':' + pin.id);
    const def = PARTS[p.type], extras = {};
    if (p.type !== 'device' && (pins.length !== def.pins.length || pins.some((pin, i) => pin.id !== def.pins[i].id))) fail('A simulated part must have its original terminals.');
    if (def?.unit && !inRange(p.value, def.min, def.max)) fail(`Invalid ${def.name.toLowerCase()} value.`);
    for (const [key, field] of Object.entries(def?.fields || {})) { const value = p[key] ?? field.value; if (!inRange(value, field.min, field.max)) fail(`Invalid ${def.name.toLowerCase()} ${field.label.toLowerCase()}.`); extras[key] = value; }
    for (const [key, flag] of Object.entries(def?.flags || {})) { const value = p[key] ?? flag.value; if (typeof value !== 'boolean') fail(`Invalid ${def.name.toLowerCase()} setting.`); extras[key] = value; }
    if (['switch', 'button'].includes(p.type) && typeof p.closed !== 'boolean') fail('Invalid switch state.');
    if (p.type === 'potentiometer' && !inRange(p.position, 0, 100)) fail('Invalid potentiometer position.');
    if (p.type === 'device' && (!text(p.recordId || '') || !text(p.revision || '', 2000) || !['board', 'maker'].includes(p.recordKind) || (p.templateId != null && !text(p.templateId, 100)))) fail('Invalid device reference.');
    const device = p.type === 'device' ? validateDeviceProfile(p, pins.map(pin => pin.id), fail) : {};
    let mount;
    if (p.mount != null) {
      // Pre-release v3 files stored two-lead mounts as {a, b}; current files map every pin under holes.
      const holes = p.mount?.holes ?? (p.mount && typeof p.mount === 'object' ? {a: p.mount.a, b: p.mount.b} : null);
      const used = holes && typeof holes === 'object' ? pins.map(pin => holes[pin.id]) : [];
      if (data.version !== 3 || !mountKind({...p, ...device}) || !holes || Object.keys(holes).length !== pins.length || used.some(h => typeof h !== 'string' || !endpoints.has('hole:' + h)) || new Set(used).size !== used.length || (p.mount.built != null && typeof p.mount.built !== 'boolean')) fail('Invalid breadboard lead placement. Each lead needs its own breadboard hole.');
      mount = {holes: Object.fromEntries(pins.map((pin, i) => [pin.id, used[i]])), ...(p.mount.built ? {built: true} : {})};
    }
    return {id: p.id, type: p.type, name: p.name, x: p.x, y: p.y, rotation: p.rotation || 0, pins, ...(mount ? {mount} : {}), ...(def?.unit ? {value: p.value} : {}), ...extras,
      // Push buttons are momentary: a saved or imported circuit always starts released.
      ...(p.type === 'switch' ? {closed: p.closed} : p.type === 'button' ? {closed: false} : {}), ...(p.type === 'potentiometer' ? {position: p.position} : {}),
      ...(p.type === 'device' ? {recordId: p.recordId || '', recordKind: p.recordKind, revision: p.revision || '', referenceImage: p.referenceImage || false, ...(p.templateId ? {templateId: p.templateId} : {}), ...device} : {})};
  });
  const pairs = new Set();
  const wires = data.wires.map(w => {
    if (!w || !text(w.id, 100) || !/^[\w-]+$/.test(w.id) || ids.has(w.id) || !endpoints.has(w.from) || !endpoints.has(w.to) || w.from === w.to || !/^#[a-f\d]{6}$/i.test(w.color)) fail('A wire has an invalid terminal, color or ID.');
    const pair = [w.from, w.to].sort().join('|');
    if (pairs.has(pair)) fail('The circuit contains a duplicate wire.');
    ids.add(w.id); pairs.add(pair);
    if (w.points != null && (!Array.isArray(w.points) || w.points.length > LIMITS.bends || w.points.some(p => !p || ![p.x, p.y].every(n => inRange(n, 0, 4000))))) fail('Invalid wire bend points.');
    if (w.label != null && !text(w.label, 100)) fail('Invalid wire label.');
    if (w.built != null && typeof w.built !== 'boolean') fail('Invalid wiring checklist state.');
    return {id: w.id, from: w.from, to: w.to, color: w.color, points: (w.points || []).map(p => ({x: p.x, y: p.y})), label: w.label || '', ...(w.built ? {built: true} : {})};
  });
  return {format: data.format, version: 3, name: data.name, boards, parts, wires, ...(data.notes ? {notes: data.notes} : {})};
}
export function duplicatePart(project, id) {
  if (project.parts.length >= LIMITS.parts) throw new Error('This circuit has reached the 60-part limit.');
  const source = project.parts.find(p => p.id === id);
  if (!source) throw new Error('Select a component to duplicate.');
  const copy = {...structuredClone(source), id: uid(), name: (source.name + ' copy').slice(0, 200), x: Math.min(LIMITS.coordinate, source.x + 35), y: Math.min(LIMITS.coordinate, source.y + 35)};
  delete copy.mount;
  return {project: {...project, parts: [...project.parts, copy]}, id: copy.id};
}
export function removeTerminal(project, partId, pinId) {
  const endpoint = partId + ':' + pinId, part = project.parts.find(p => p.id === partId);
  if (part?.mount) throw new Error('Lift the device from the breadboard before removing a terminal.');
  const power = part?.power && [part.power.vcc, part.power.gnd].includes(pinId);
  const output = part?.powerOut && [...part.powerOut.ground, ...part.powerOut.rails.flatMap(r => r.pins)].includes(pinId);
  return {...project, parts: project.parts.map(p => { if (p.id !== partId || p.type !== 'device') return p; const next = {...p, pins: p.pins.filter(pin => pin.id !== pinId)}; if (power) delete next.power; if (output) delete next.powerOut; return next; }), wires: project.wires.filter(w => w.from !== endpoint && w.to !== endpoint)};
}
export function reconnectWire(project, wireId, end, endpoint) {
  if (!['from', 'to'].includes(end)) throw new Error('Choose a wire endpoint.');
  return validateProject({...project, wires: project.wires.map(w => w.id === wireId && w[end] !== endpoint ? {...w, [end]: endpoint, built: false} : w)});
}
export function wirePath(project, wire) {
  const a = endpointPosition(project, wire.from), b = endpointPosition(project, wire.to);
  if (wire.points?.length) return `M${a.x},${a.y} ` + [...wire.points, b].map(p => `L${p.x},${p.y}`).join(' ');
  const bend = Math.max(32, Math.abs(a.y - b.y) * .35);
  return `M${a.x},${a.y} C${a.x},${Math.max(0, a.y - bend)} ${b.x},${Math.max(0, b.y - bend)} ${b.x},${b.y}`;
}
export function insertWireBend(project, wireId, point) {
  const wire = project.wires.find(w => w.id === wireId);
  if (!wire || (wire.points?.length || 0) >= LIMITS.bends) throw new Error('A wire can have up to 24 bends.');
  const chain = [endpointPosition(project, wire.from), ...(wire.points || []), endpointPosition(project, wire.to)];
  let index = 0;
  if (point) {
    let best = Infinity;
    for (let i = 0; i < chain.length - 1; i++) {
      const a = chain[i], b = chain[i + 1], dx = b.x - a.x, dy = b.y - a.y, t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / (dx * dx + dy * dy || 1)));
      const distance = (point.x - a.x - t * dx) ** 2 + (point.y - a.y - t * dy) ** 2;
      if (distance < best) { index = i; best = distance; }
    }
  } else {
    let longest = -1;
    for (let i = 0; i < chain.length - 1; i++) { const length = Math.hypot(chain[i + 1].x - chain[i].x, chain[i + 1].y - chain[i].y); if (length > longest) { longest = length; index = i; } }
    point = {x: (chain[index].x + chain[index + 1].x) / 2, y: (chain[index].y + chain[index + 1].y) / 2};
  }
  const points = [...(wire.points || [])]; points.splice(index, 0, {x: Math.max(0, Math.min(4000, Math.round(point.x / 5) * 5)), y: Math.max(0, Math.min(4000, Math.round(point.y / 5) * 5))});
  return {...project, wires: project.wires.map(w => w.id === wireId ? {...w, points} : w)};
}
export function ledExample() {
  const project = emptyProject(); project.name = 'First light · LED circuit';
  project.parts = [
    {...createPart('supply'), id: 'supply', x: 55, y: 70},
    {...createPart('resistor'), id: 'resistor', x: 380, y: 95},
    {...createPart('led'), id: 'led', x: 705, y: 65},
    {...createPart('switch'), id: 'switch', x: 955, y: 170, closed: true},
  ];
  const links = [['supply:a', 'hole:tp2', 0], ['supply:b', 'hole:tn2', 1], ['hole:tp8', 'hole:a8', 0], ['hole:e8', 'resistor:a', 2], ['resistor:b', 'hole:e14', 2], ['hole:a14', 'led:a', 3], ['led:b', 'hole:a20', 3], ['hole:e20', 'switch:a', 1], ['switch:b', 'hole:tn28', 1]];
  project.wires = links.map(([from, to, color], i) => ({id: 'wire' + i, from, to, color: WIRE_COLORS[color]}));
  return project;
}
export function dimmerExample() {
  const project = ledExample(); project.name = 'Turn to glow · LED dimmer';
  project.parts = project.parts.filter(p => p.type !== 'switch');
  project.parts.push({...createPart('potentiometer'), id: 'dimmer', name: '10 kΩ dimmer', x: 940, y: 55, position: 80});
  project.wires = project.wires.filter(w => !['wire2', 'wire7', 'wire8'].includes(w.id));
  const links = [['hole:tp28', 'dimmer:a', 0], ['hole:tn28', 'dimmer:b', 1], ['dimmer:w', 'hole:a8', 4], ['hole:e20', 'hole:tn20', 1]];
  project.wires.push(...links.map(([from, to, color], i) => ({id: 'dimmer-wire' + i, from, to, color: WIRE_COLORS[color]})));
  return project;
}
class UnionFind {
  parent = new Map();
  find(x) { if (!this.parent.has(x)) this.parent.set(x, x); const p = this.parent.get(x); if (p !== x) this.parent.set(x, this.find(p)); return this.parent.get(x); }
  join(a, b) { this.parent.set(this.find(a), this.find(b)); }
}
export function circuitNets(project) {
  const nets = new UnionFind();
  for (const h of projectHoles(project)) nets.join('hole:' + h.id, 'strip:' + h.net);
  for (const p of project.parts) {
    for (const pin of p.pins) { nets.find(p.id + ':' + pin.id); if (p.mount) nets.join(p.id + ':' + pin.id, 'hole:' + p.mount.holes[pin.id]); }
    if (p.type === 'switch' && p.closed) nets.join(p.id + ':a', p.id + ':b');
    if (p.type === 'device' && p.powerOut) for (const group of [p.powerOut.ground, ...p.powerOut.rails.map(r => r.pins)]) for (const pin of group.slice(1)) nets.join(p.id + ':' + group[0], p.id + ':' + pin);
    // A tactile switch's paired legs are always joined; pressing bridges the pairs.
    if (p.type === 'button') { nets.join(p.id + ':1a', p.id + ':1b'); nets.join(p.id + ':2a', p.id + ':2b'); if (p.closed) nets.join(p.id + ':1a', p.id + ':2a'); }
  }
  for (const w of project.wires) nets.join(w.from, w.to);
  return nets;
}
function solveLinear(matrix, values) {
  const a = matrix.map((row, i) => [...row, values[i]]), n = a.length;
  for (let c = 0; c < n; c++) {
    let pivot = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(a[r][c]) > Math.abs(a[pivot][c])) pivot = r;
    if (Math.abs(a[pivot][c]) < 1e-14) return null;
    [a[c], a[pivot]] = [a[pivot], a[c]];
    const d = a[c][c]; for (let j = c; j <= n; j++) a[c][j] /= d;
    for (let r = 0; r < n; r++) if (r !== c) { const f = a[r][c]; for (let j = c; j <= n; j++) a[r][j] -= f * a[c][j]; }
  }
  const result = a.map(row => row[n]);
  return result.every(Number.isFinite) ? result : null;
}
// Smooth piecewise junction: ~1 nS off, `ron` ohms on, knee at vf.
const junction = (v, vf, ron) => {
  const z = (v - vf) / .025;
  const softplus = Math.max(z, 0) + Math.log1p(Math.exp(-Math.abs(z)));
  return {i: .025 / ron * softplus + v * 1e-9, g: 1 / (ron * (1 + Math.exp(-Math.max(-700, Math.min(700, z))))) + 1e-9};
};
// Simplified bipolar transistor: the base-emitter junction drives Ic = hFE·Ib, smoothly limited as Vce
// falls into saturation (~0.1–0.3 V); a base-collector junction holds a saturated or floating collector
// near the base. Terminal currents flow into the part; PNP mirrors every polarity.
function transistor(sign, vb, vc, ve, beta) {
  const vbe = sign * (vb - ve), vce = sign * (vc - ve), base = junction(vbe, .65, 10), bc = junction(vbe - vce, .6, 10);
  const z = Math.max(-700, Math.min(700, (vce - .3) / .04)), s = 1 / (1 + Math.exp(-z)), ds = s * (1 - s) / .04;
  const transport = beta * base.i * s, dt = [beta * base.g * s, beta * base.i * ds];
  const ib = base.i + bc.i, ic = transport - bc.i;
  // Rows: base, collector, emitter currents. Columns: d/dVb, d/dVc, d/dVe (vbc = vb - vc).
  const db = [base.g + bc.g, -bc.g, -base.g], dc = [dt[0] - bc.g, dt[1] + bc.g, -dt[0] - dt[1]];
  const jacobian = [db, dc, db.map((g, i) => -g - dc[i])];
  return {currents: [sign * ib, sign * ic, -sign * (ib + ic)], jacobian, ib, ic, vbe, vce, saturation: s};
}
const twoTerminal = {resistor: true, led: true, diode: true, buzzer: true, capacitor: true, load: true};
function modelElements(project) {
  const elements = [];
  for (const p of project.parts) {
    if (p.type === 'supply' || twoTerminal[p.type]) elements.push({id: p.id, type: p.type, name: p.name, value: p.value, part: p, terminals: [p.id + ':a', p.id + ':b']});
    if (p.type === 'npn' || p.type === 'pnp') elements.push({id: p.id, type: 'bjt', sign: p.type === 'npn' ? 1 : -1, name: p.name, value: p.value, part: p, terminals: [p.id + ':b', p.id + ':c', p.id + ':e']});
    if (p.type === 'potentiometer') elements.push(
      {id: p.id + '~upper', type: 'resistor', name: p.name + ' A–W', value: Math.max(.001, p.value * (1 - p.position / 100)), terminals: [p.id + ':a', p.id + ':w']},
      {id: p.id + '~lower', type: 'resistor', name: p.name + ' W–B', value: Math.max(.001, p.value * p.position / 100), terminals: [p.id + ':w', p.id + ':b']});
    // A device with a power profile becomes a resistive load sized from its nominal voltage and current.
    // A USB-powered board drives each output rail as a fixed supply above its ground.
    if (p.type === 'device' && p.powerOut) for (const rail of p.powerOut.rails) elements.push({id: `${p.id}~out~${rail.pins[0]}`, type: 'supply', board: true, name: `${p.name} ${p.pins.find(pin => pin.id === rail.pins[0])?.label || 'output'}`, value: rail.voltage, part: p, terminals: [p.id + ':' + rail.pins[0], p.id + ':' + p.powerOut.ground[0]]});
    if (p.type === 'device' && p.power?.current > 0) elements.push({id: p.id, type: 'load', name: p.name, value: p.power.voltage / (p.power.current / 1000), part: p, terminals: [p.id + ':' + p.power.vcc, p.id + ':' + p.power.gnd]});
  }
  return elements;
}
const twoTerminalModel = (e, v) => {
  if (e.type === 'resistor' || e.type === 'load') return {i: v / e.value, g: 1 / e.value};
  if (e.type === 'capacitor') return {i: v * 1e-12, g: 1e-12};
  if (e.type === 'led') return junction(v, e.value, 20);
  if (e.type === 'diode') return junction(v, e.value, 1);
  return junction(v, .5, Math.max(1, (e.value - .5) / (e.part.current / 1000)));
};
export const formatFarads = microfarads => microfarads >= 1 ? `${Number(microfarads.toPrecision(4))} µF` : microfarads >= .001 ? `${Number((microfarads * 1000).toPrecision(4))} nF` : `${Number((microfarads * 1e6).toPrecision(4))} pF`;
export function simulateCircuit(project) {
  const nets = circuitNets(project), diagnostics = [], readings = Object.create(null), voltages = Object.create(null), references = Object.create(null);
  const add = (level, message, partId) => diagnostics.push({level, message, partId});
  const elements = modelElements(project), sources = elements.filter(e => e.type === 'supply');
  for (const p of project.parts.filter(p => p.type === 'device')) {
    const outputs = p.powerOut ? p.powerOut.rails.map(r => `${p.pins.find(pin => pin.id === r.pins[0])?.label || 'output'} ${r.voltage} V`).join(', ') : '';
    if (p.powerOut) add('note', `${p.name}: powered over USB in this model (${outputs}). Its regulator limits, GPIO, firmware and protocols are not simulated.`, p.id);
    else add(p.power?.current > 0 ? 'note' : 'warning', p.power?.current > 0 ? `${p.name}: modeled only as a ${p.power.current} mA load at ${p.power.voltage} V. GPIO, firmware and protocols are not simulated.` : `${p.name}: wiring reference only. Its power draw, GPIO, firmware and protocols are not simulated.`, p.id);
  }
  if (!sources.length) add('warning', 'Add a DC supply to test a powered circuit.');
  const graph = new UnionFind();
  for (const e of elements) for (const t of e.terminals.slice(1)) graph.join(nets.find(e.terminals[0]), nets.find(t));
  const groups = new Map();
  for (const e of elements) { const key = graph.find(nets.find(e.terminals[0])); if (!groups.has(key)) groups.set(key, []); groups.get(key).push(e); }
  for (const parts of groups.values()) {
    const supplies = parts.filter(e => e.type === 'supply');
    if (!supplies.length) { for (const e of parts) readings[e.id] = {voltage: null, current: 0, power: 0}; add('warning', 'Some components are disconnected from a supply; their voltages are unknown.'); continue; }
    const shorted = supplies.find(e => nets.find(e.terminals[0]) === nets.find(e.terminals[1]));
    if (shorted) { add('error', `${shorted.name}: short circuit across the supply terminals.`, shorted.id); continue; }
    const ground = nets.find(supplies[0].terminals[1]);
    const nodes = [...new Set(parts.flatMap(e => e.terminals.map(t => nets.find(t))))].filter(n => n !== ground);
    const nodeIndex = new Map(nodes.map((n, i) => [n, i]));
    const node = endpoint => nodeIndex.get(nets.find(endpoint));
    const size = nodes.length + supplies.length;
    // Newton with backtracking solves every nonlinear part together; rhs scales supplies for source stepping.
    function equations(at, scale) {
      const a = Array.from({length: size}, () => Array(size).fill(0)), rhs = Array(size).fill(0);
      const stamp = (u, v, g, offset) => {
        if (u !== undefined) { a[u][u] += g; rhs[u] -= offset; }
        if (v !== undefined) { a[v][v] += g; rhs[v] += offset; }
        if (u !== undefined && v !== undefined) { a[u][v] -= g; a[v][u] -= g; }
      };
      for (const e of parts) {
        if (e.type === 'supply') continue;
        const index = e.terminals.map(node), v = index.map(i => at[i] || 0);
        if (e.type === 'bjt') {
          const model = transistor(e.sign, v[0], v[1], v[2], e.value);
          index.forEach((row, k) => { if (row === undefined) return; rhs[row] -= model.currents[k]; index.forEach((column, j) => { rhs[row] += model.jacobian[k][j] * v[j]; if (column !== undefined) a[row][column] += model.jacobian[k][j]; }); });
          continue;
        }
        const delta = v[0] - v[1], m = twoTerminalModel(e, delta);
        stamp(index[0], index[1], m.g, m.i - m.g * delta);
      }
      supplies.forEach((e, k) => {
        const u = node(e.terminals[0]), v = node(e.terminals[1]), s = nodes.length + k;
        if (u !== undefined) { a[u][s] += 1; a[s][u] += 1; }
        if (v !== undefined) { a[v][s] -= 1; a[s][v] -= 1; }
        rhs[s] = e.value * scale;
      });
      return {a, rhs};
    }
    const residual = (at, scale) => { const {a, rhs} = equations(at, scale); return Math.max(0, ...a.map((row, i) => Math.abs(row.reduce((s, g, j) => s + g * at[j], 0) - rhs[i]))); };
    let singular = false;
    function newton(start, scale) {
      let guess = start;
      for (let iteration = 0; iteration < 100; iteration++) {
        const {a, rhs} = equations(guess, scale), next = solveLinear(a, rhs);
        if (!next) { singular = true; return null; }
        if (residual(next, scale) < 1e-9) return next;
        const before = residual(guess, scale); let step = 1, trial = next;
        while (residual(trial, scale) >= before && step > 1 / 1024) { step /= 2; trial = guess.map((v, i) => v + step * (next[i] - v)); }
        guess = trial;
      }
      return null;
    }
    let solution = newton(Array(size).fill(0), 1);
    // Source stepping: ramp the supplies from 10% so strongly nonlinear circuits start near a solution.
    if (!solution && !singular) { let guess = Array(size).fill(0); for (let step = 1; step <= 10 && guess; step++) guess = newton(guess, step / 10); solution = guess; }
    if (!solution) { add('error', singular ? 'Supply constraints conflict or are redundant. Check polarity and remove parallel ideal supplies.' : 'The DC model did not converge. Simplify this circuit before relying on its readings.'); continue; }
    const vAt = endpoint => solution[node(endpoint)] || 0;
    const nodeVolts = new Map([[ground, 0], ...nodes.map((n, i) => [n, solution[i]])]);
    const storeVoltage = endpoint => { if (nodeVolts.has(nets.find(endpoint))) { voltages[endpoint] = nodeVolts.get(nets.find(endpoint)); references[endpoint] = supplies[0].id; } };
    for (const h of projectHoles(project)) storeVoltage('hole:' + h.id);
    for (const p of project.parts) for (const pin of p.pins) storeVoltage(p.id + ':' + pin.id);
    for (const e of parts) {
      if (e.type === 'bjt') {
        const [vb, vc, ve] = e.terminals.map(vAt), m = transistor(e.sign, vb, vc, ve, e.value), power = m.vce * m.ic + m.vbe * m.ib;
        readings[e.id] = {voltage: vc - ve, current: e.sign * m.ic, power, base: e.sign * m.ib, region: m.ib < 1e-6 ? 'off' : m.saturation < .9 ? 'saturated' : 'active'};
        if (m.ic > .2) add('error', `${e.name}: ${(m.ic * 1000).toFixed(0)} mA collector current exceeds the example 200 mA rating.`, e.id);
        if (m.ib > .01) add('error', `${e.name}: ${(m.ib * 1000).toFixed(1)} mA base current. Add or increase the base resistor.`, e.id);
        if (power > .625) add('warning', `${e.name}: ${power.toFixed(2)} W exceeds the example 0.625 W TO-92 rating.`, e.id);
        continue;
      }
      const voltage = vAt(e.terminals[0]) - vAt(e.terminals[1]);
      const current = e.type === 'supply' ? -solution[nodes.length + supplies.indexOf(e)] : e.type === 'capacitor' ? 0 : twoTerminalModel(e, voltage).i;
      readings[e.id] = {voltage, current, power: voltage * current};
      if (e.type === 'led' && current > .02) add('error', `${e.name}: ${(current * 1000).toFixed(1)} mA exceeds the example model's 20 mA limit. Increase series resistance.`, e.id);
      if (e.type === 'led' && voltage < -.5) add('warning', `${e.name}: reverse polarity (${voltage.toFixed(2)} V). Reverse breakdown is not modeled.`, e.id);
      if (e.type === 'diode' && current > 1) add('error', `${e.name}: ${current.toFixed(2)} A exceeds the example 1 A rectifier rating.`, e.id);
      if (e.type === 'resistor' && voltage * current > .25) add('warning', `${e.name}: ${(voltage * current).toFixed(2)} W exceeds the example ¼ W rating.`, e.id);
      if (e.type === 'capacitor') {
        readings[e.id].charge = e.value * voltage;
        if (Math.abs(voltage) > e.part.rating) add('error', `${e.name}: ${Math.abs(voltage).toFixed(2)} V exceeds its ${e.part.rating} V rating.`, e.id);
        if (e.part.polarized && voltage < -.5) add('error', `${e.name}: reverse-biased electrolytic (${voltage.toFixed(2)} V). Swap its + and − leads.`, e.id);
      }
      if (e.type === 'buzzer') {
        readings[e.id].sounding = current >= e.part.current / 1000 * .4;
        if (voltage > e.value * 1.25) add('warning', `${e.name}: ${voltage.toFixed(2)} V is well above its ${e.value} V rating.`, e.id);
        if (voltage < -.5) add('warning', `${e.name}: reverse polarity (${voltage.toFixed(2)} V). Active buzzers stay silent when reversed.`, e.id);
      }
    }
    if (supplies.some(e => !e.board) && supplies.every(e => Math.abs(readings[e.id].current) < .000001)) add('warning', 'No closed load path draws current from this supply. Check wires and switches.');
  }
  for (const p of project.parts) {
    if (p.type === 'potentiometer') {
      const upper = readings[p.id + '~upper'], lower = readings[p.id + '~lower'];
      if (upper && lower) readings[p.id] = {voltage: upper.voltage == null || lower.voltage == null ? null : upper.voltage + lower.voltage, current: upper.current, power: upper.power + lower.power, wiperCurrent: upper.current - lower.current};
      delete readings[p.id + '~upper']; delete readings[p.id + '~lower'];
    }
    if (p.type === 'device' && p.power) checkDevicePower(p, voltages, add);
  }
  for (const id of Object.keys(readings)) if (id.includes('~out~')) delete readings[id];
  return {diagnostics, readings, voltages, references, status: diagnostics.some(d => d.level === 'error') ? 'error' : diagnostics.some(d => d.level !== 'note') ? 'warning' : 'ok'};
}
// Compares solved voltages with the device's own entered limits; nothing here infers a datasheet.
function checkDevicePower(p, voltages, add) {
  const at = pin => voltages[p.id + ':' + pin], gnd = at(p.power.gnd), vcc = at(p.power.vcc), label = id => p.pins.find(pin => pin.id === id)?.label || id;
  if (!Number.isFinite(gnd) || !Number.isFinite(vcc) || Math.abs(vcc - gnd) < .05) { add('warning', `${p.name}: ${label(p.power.vcc)} is not powered.`, p.id); return; }
  const supply = vcc - gnd;
  if (supply > p.power.max) add('error', `${p.name}: ${supply.toFixed(2)} V at ${label(p.power.vcc)} exceeds the ${p.power.max} V maximum you entered.`, p.id);
  else if (supply < p.power.min) add('warning', `${p.name}: ${supply.toFixed(2)} V at ${label(p.power.vcc)} is below the ${p.power.min} V minimum you entered.`, p.id);
  for (const pin of p.pins) {
    if (!['io', 'input', 'analog', 'bus'].includes(pin.role) || !Number.isFinite(at(pin.id))) continue;
    const level = at(pin.id) - gnd;
    if (level > p.power.max + .3) add('warning', `${p.name}: ${pin.label} sees ${level.toFixed(2)} V, above the ${p.power.max} V supply limit. Use a level shifter or divider.`, p.id);
    if (level < -.3) add('warning', `${p.name}: ${pin.label} is ${level.toFixed(2)} V below ground.`, p.id);
  }
}
export {isHoleEndpoint};
