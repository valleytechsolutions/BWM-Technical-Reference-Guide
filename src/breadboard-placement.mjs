import {WIRE_COLORS, LIMITS, createPart, emptyProject, validateProject, pinPosition, mountKind} from './breadboard.mjs';
import {BOARD_SIZES, boardLabel, boardLayout, findHole, holeCode, holeDelta, offsetHole, parseHole, projectBoards, projectHoles} from './breadboard-boards.mjs';

export function holeOccupants(project) {
  const occupied = new Map();
  const add = (hole, item) => { if (!occupied.has(hole)) occupied.set(hole, []); occupied.get(hole).push(item); };
  for (const p of project.parts) if (p.mount) for (const pin of p.pins) add(p.mount.holes[pin.id], {id: p.id, endpoint: p.id + ':' + pin.id, kind: 'lead', label: p.name + ' · ' + pin.label});
  for (const w of project.wires) for (const endpoint of [w.from, w.to]) if (endpoint.startsWith('hole:')) add(endpoint.slice(5), {id: w.id, endpoint, kind: 'wire', label: w.label || 'Jumper wire'});
  return occupied;
}
export function assertMountHole(project, partId, hole) {
  if (!findHole(project, hole)) throw new Error('Choose a breadboard hole.');
  const part = project.parts.find(p => p.id === partId);
  // Existing imported overlaps remain inspectable; never block an unchanged lead.
  if (part?.mount && Object.values(part.mount.holes).includes(hole)) return;
  if ((holeOccupants(project).get(hole) || []).some(item => item.id !== partId)) throw new Error(`${holeCode(hole)} is occupied. Choose a free hole on the connected strip.`);
}
// Lead offsets as [pin, rows, columns] from the first lead, before any rotation.
export function footprintOffsets(part) {
  const kind = mountKind(part), n = part.pins.length;
  if (kind === 'button') return [['1a', 0, 0], ['1b', 1, 0], ['2a', 0, 2], ['2b', 1, 2]];
  if (kind === 'inline' || part.footprint?.kind === 'sip') return part.pins.map((pin, i) => [pin.id, 0, i]);
  if (part.footprint?.kind === 'dual') {
    // DIP numbering runs along the lower row, then back along the upper row; module headers run both rows left to right.
    const half = Math.ceil(n / 2), {spread, numbering} = part.footprint;
    return part.pins.map((pin, i) => i < half ? [pin.id, 0, i] : numbering === 'ccw' ? [pin.id, -spread, half - 1 - (i - half)] : [pin.id, spread, i - half]);
  }
  return null;
}
const turn = ([pin, rows, columns], turns) => { for (let i = 0; i < turns; i++) [rows, columns] = [columns, -rows]; return [pin, rows + 0, columns + 0]; };
export function footprintHoles(project, part, anchor, turns = 0) {
  const offsets = footprintOffsets(part);
  if (!offsets) throw new Error('Choose a hole for each lead.');
  if (!findHole(project, anchor)) throw new Error('Choose a breadboard hole.');
  const holes = {};
  for (const offset of offsets) {
    const [pin, rows, columns] = turn(offset, turns), hole = offsetHole(project, anchor, rows, columns);
    if (!hole) throw new Error(`${part.name} needs room for all ${part.pins.length} leads there. Choose another hole or rotate it.`);
    holes[pin] = hole;
  }
  return holes;
}
export function mountPart(project, partId, holes, second) {
  const part = project.parts.find(p => p.id === partId);
  if (!part || !mountKind(part)) throw new Error(part?.type === 'device' ? 'Choose a package in the device maker before inserting this device.' : 'This part connects with wires only.');
  if (typeof holes === 'string') holes = {[part.pins[0].id]: holes, [part.pins[1]?.id]: second};
  const used = part.pins.map(pin => holes[pin.id]);
  if (new Set(used).size !== used.length) throw new Error('Each lead needs its own hole. Choose a different hole.');
  for (const hole of used) assertMountHole(project, partId, hole);
  if (part.mount && part.pins.every(pin => part.mount.holes[pin.id] === holes[pin.id])) return project;
  const attached = w => w.from.startsWith(partId + ':') || w.to.startsWith(partId + ':');
  return validateProject({...project, version: 3, parts: project.parts.map(p => p.id === partId ? {...p, mount: {holes: Object.fromEntries(part.pins.map((pin, i) => [pin.id, used[i]]))}} : p), wires: project.wires.map(w => attached(w) ? {...w, built: false} : w)});
}
export function unmountPart(project, partId) {
  return {...project, parts: project.parts.map(p => { if (p.id !== partId) return p; const {mount, ...part} = p; return part; }), wires: project.wires.map(w => w.from.startsWith(partId + ':') || w.to.startsWith(partId + ':') ? {...w, built: false} : w)};
}
// Shape of an inserted part relative to its first lead, or null when its leads span boards.
function mountedShape(project, part) {
  const first = part.mount.holes[part.pins[0].id];
  const offsets = part.pins.map(pin => [pin.id, ...(holeDelta(project, first, part.mount.holes[pin.id]) || [NaN, NaN])]);
  return offsets.every(o => Number.isFinite(o[1])) ? offsets : null;
}
function relocate(project, part, anchor, shape, turns = 0) {
  const holes = {};
  for (const offset of shape) {
    const [pin, rows, columns] = turn(offset, turns), hole = offsetHole(project, anchor, rows, columns);
    if (!hole) throw new Error('Every lead must stay on a breadboard.');
    holes[pin] = hole;
  }
  return mountPart(project, part.id, holes);
}
export function shiftMountedPart(project, partId, columns, rowOffset) {
  const part = project.parts.find(p => p.id === partId);
  if (!part?.mount || !Number.isInteger(columns) || !Number.isInteger(rowOffset)) throw new Error('Select an inserted part to move.');
  const holes = {};
  for (const pin of part.pins) {
    const hole = offsetHole(project, part.mount.holes[pin.id], rowOffset, columns);
    if (!hole) throw new Error(part.pins.length > 2 ? 'Every lead must stay on the breadboard.' : 'Both leads must stay on the breadboard.');
    holes[pin.id] = hole;
  }
  return mountPart(project, partId, holes);
}
// Quarter-turn about the first lead, for footprint parts. Two-lead parts choose new holes instead.
export function rotateMountedPart(project, partId) {
  const part = project.parts.find(p => p.id === partId), shape = part?.mount && mountedShape(project, part);
  if (!shape) throw new Error('Select an inserted part to rotate.');
  return relocate(project, part, part.mount.holes[part.pins[0].id], shape, 1);
}
const nearestHole = (project, point) => projectHoles(project).reduce((best, h) => (h.x - point.x) ** 2 + (h.y - point.y) ** 2 < (best.x - point.x) ** 2 + (best.y - point.y) ** 2 ? h : best);
export function dragMountedPart(project, partId, delta) {
  const part = project.parts.find(p => p.id === partId), shape = mountedShape(project, part), origin = pinPosition(part, part.pins[0].id, project);
  const target = nearestHole(project, {x: origin.x + delta.x, y: origin.y + delta.y});
  if (shape) return relocate(project, part, target.id, shape);
  // Leads on different boards move by the same distance, each to its nearest hole.
  return mountPart(project, partId, Object.fromEntries(part.pins.map(pin => { const p = pinPosition(part, pin.id, project); return [pin.id, nearestHole(project, {x: p.x + delta.x, y: p.y + delta.y}).id]; })));
}

const usesBoard = (endpoint, id) => endpoint.startsWith('hole:') && findHoleBoard(endpoint.slice(5)) === id;
const findHoleBoard = hole => parseHole(hole)?.board;
export function boardUsage(project, boardId) {
  return {wires: project.wires.filter(w => usesBoard(w.from, boardId) || usesBoard(w.to, boardId)).length, parts: project.parts.filter(p => p.mount && Object.values(p.mount.holes).some(h => findHoleBoard(h) === boardId)).length};
}
export function addBoard(project, size = 'half') {
  const boards = projectBoards(project);
  if (boards.length >= LIMITS.boards) throw new Error(`A circuit can use up to ${LIMITS.boards} breadboards.`);
  const id = ['b2', 'b3', 'b4'].find(b => !boards.some(board => board.id === b));
  const y = Math.max(...boards.map(b => b.y + boardLayout(b).height)) + 60;
  if (y > LIMITS.coordinate) throw new Error('There is no room below the existing breadboards. Move one up first.');
  return {project: validateProject({...project, boards: [...boards, {id, size, x: 153, y, splitRails: false}]}), id};
}
export function updateBoard(project, boardId, changes) {
  const boards = projectBoards(project).map(b => b.id === boardId ? {...b, ...changes} : b), next = {...project, boards};
  if (changes.size) {
    const missing = [...holeOccupants(project).keys()].filter(hole => findHoleBoard(hole) === boardId && !findHole(next, hole));
    if (missing.length) throw new Error(`${BOARD_SIZES[changes.size].name} is too small for ${missing.length} connected hole${missing.length === 1 ? '' : 's'} (${missing.slice(0, 3).map(holeCode).join(', ')}${missing.length > 3 ? '…' : ''}). Move them first.`);
  }
  return validateProject(next);
}
export function removeBoard(project, boardId) {
  if (boardId === 'main') throw new Error('The main breadboard cannot be removed.');
  const lifted = project.parts.filter(p => p.mount && Object.values(p.mount.holes).some(h => findHoleBoard(h) === boardId)).reduce((next, p) => unmountPart(next, p.id), project);
  return validateProject({...lifted, boards: projectBoards(project).filter(b => b.id !== boardId), wires: lifted.wires.filter(w => !usesBoard(w.from, boardId) && !usesBoard(w.to, boardId))});
}
export const boardName = (project, id) => boardLabel(projectBoards(project).find(b => b.id === id) || {id});

export function insertedLedExample() {
  const project = emptyProject(); project.name = 'On the board · Inserted LED';
  project.parts = [{...createPart('supply'), id: 'supply', x: 55, y: 70}, {...createPart('resistor'), id: 'resistor', value: 330, mount: {holes: {a: 'c8', b: 'c14'}}}, {...createPart('led'), id: 'led', mount: {holes: {a: 'e14', b: 'f14'}}}];
  project.wires = [['supply:a', 'hole:tp2', 0], ['supply:b', 'hole:tn2', 1], ['hole:tp8', 'hole:a8', 0], ['hole:j14', 'hole:tn20', 1]].map(([from, to, color], i) => ({id: 'inserted-wire' + i, from, to, color: WIRE_COLORS[color]}));
  return validateProject(project);
}
// Press the button: 1 kΩ of base drive saturates the NPN, which sinks the LED's current to ground.
// Column 4 is fed from the + rail, column 6 carries the pressed signal, 10/11/12 are E/B/C,
// and the LED's cathode shares the collector's column while R2 feeds its anode from the rail.
export function transistorExample() {
  const project = emptyProject(); project.name = 'Press to light · Transistor switch';
  project.parts = [
    {...createPart('supply'), id: 'supply', x: 55, y: 70},
    {...createPart('button'), id: 'button', mount: {holes: {'1a': 'e4', '1b': 'f4', '2a': 'e6', '2b': 'f6'}}},
    {...createPart('resistor'), id: 'base-resistor', name: 'Base resistor', value: 1000, mount: {holes: {a: 'b6', b: 'b11'}}},
    {...createPart('npn'), id: 'npn', mount: {holes: {e: 'c10', b: 'c11', c: 'c12'}}},
    {...createPart('led'), id: 'led', mount: {holes: {a: 'd18', b: 'd12'}}},
    {...createPart('resistor'), id: 'led-resistor', name: 'LED resistor', value: 330, mount: {holes: {a: 'b24', b: 'b18'}}},
  ];
  const links = [['supply:a', 'hole:tp2', 0], ['supply:b', 'hole:tn2', 1], ['hole:tp4', 'hole:a4', 0], ['hole:a10', 'hole:tn10', 1], ['hole:tp24', 'hole:a24', 0]];
  project.wires = links.map(([from, to, color], i) => ({id: 'switch-wire' + i, from, to, color: WIRE_COLORS[color]}));
  return validateProject(project);
}
