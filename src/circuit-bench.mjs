import {PARTS, PIN_ROLES, WIRE_COLORS, circuitNets, formatFarads, holeName, partBounds, partSize, partTransform, localPinPosition, mountedGeometry, wirePath} from './breadboard.mjs';
import {BOARD_SIZES, RAIL_NAMES, boardLayout, boardReference, boardsExtent, holeCode, isHoleEndpoint, parseHole, projectBoards, projectHoles} from './breadboard-boards.mjs';
import {holeOccupants} from './breadboard-placement.mjs';

export function measureCircuit(project, {red, black, mode}, result) {
  const valid = endpoint => typeof endpoint === 'string' && (isHoleEndpoint(project, endpoint) || project.parts.some(p => p.pins.some(pin => p.id + ':' + pin.id === endpoint)));
  if (!valid(red) || !valid(black)) return {state: 'pending', text: 'Place both leads'};
  const nets = circuitNets(project);
  if (mode === 'continuity') {
    if (result) return {state: 'paused', text: 'Stop the DC test first'};
    const connected = nets.find(red) === nets.find(black);
    return {state: connected ? 'connected' : 'open', text: connected ? 'Connected' : 'No direct connection'};
  }
  if (!result) return {state: 'paused', text: 'Run DC test to measure'};
  if (!Number.isFinite(result.voltages[red]) || !Number.isFinite(result.voltages[black])) return {state: 'unknown', text: 'Not powered: no supply reaches this point'};
  if (!result.references[red] || result.references[red] !== result.references[black]) return {state: 'unknown', text: 'Separate floating circuits'};
  const value = result.voltages[red] - result.voltages[black];
  return {state: 'voltage', value, text: `${Math.abs(value) < .0005 ? '0.000' : value.toFixed(3)} V`};
}

const PREFIX = {supply: 'PS', resistor: 'R', led: 'D', diode: 'D', capacitor: 'C', switch: 'SW', button: 'SW', potentiometer: 'RV', npn: 'Q', pnp: 'Q', buzzer: 'BZ', device: 'U'};
export function partReferences(project) {
  const counts = {};
  return new Map(project.parts.map(p => { const prefix = PREFIX[p.type]; return [p.id, prefix + (counts[prefix] = (counts[prefix] || 0) + 1)]; }));
}
export function holeLabel(project, hole) {
  const parsed = parseHole(hole), board = projectBoards(project).find(b => b.id === parsed?.board);
  if (!board) return hole.toUpperCase();
  const prefix = board.id === 'main' ? '' : boardReference(board) + ' ', split = boardLayout(board).split;
  if (!RAIL_NAMES[parsed.row]) return holeName(project, hole);
  return `${prefix}${RAIL_NAMES[parsed.row]} rail${split ? (parsed.column > split ? ' (right)' : ' (left)') : ''} · ${parsed.column}`;
}
export function buildEndpointLabel(project, endpoint, refs = partReferences(project)) {
  if (endpoint.startsWith('hole:')) return holeLabel(project, endpoint.slice(5));
  const [id, pin] = endpoint.split(':'), part = project.parts.find(p => p.id === id), contact = part?.pins.find(p => p.id === pin);
  return part ? `${refs.get(id)} ${part.name} · ${contact?.label || pin}${part.mount ? ' [at ' + holeCode(part.mount.holes[pin]) + ']' : ''}${contact?.reference ? ' (' + contact.reference + ')' : ''}` : endpoint;
}
const ohms = v => v >= 1e6 ? v / 1e6 + ' MΩ' : v >= 1000 ? v / 1000 + ' kΩ' : v + ' Ω';
export function partSpecification(part) {
  if (part.type === 'device') return [part.revision || 'Revision not specified', part.power ? `${part.power.min}–${part.power.max} V · ${part.power.current} mA load` : '', part.pinSource ? 'terminals transcribed from the pinout image; check before wiring' : ''].filter(Boolean).join(' · ');
  if (part.type === 'switch') return 'SPST switch';
  if (part.type === 'button') return 'Momentary tactile switch · 4 legs';
  if (part.type === 'resistor') return ohms(part.value) + ' · model rating ¼ W';
  if (part.type === 'potentiometer') return ohms(part.value) + ' · linear track';
  if (part.type === 'capacitor') return `${formatFarads(part.value)} · ${part.rating} V${part.polarized ? ' · electrolytic' : ''}`;
  if (part.type === 'npn' || part.type === 'pnp') return `${part.type.toUpperCase()} · hFE ${part.value} · model limit 200 mA`;
  if (part.type === 'buzzer') return `${part.value} V · ${part.current} mA · polarized`;
  return `${part.value} ${PARTS[part.type].unit}${part.type === 'led' ? ' · model limit 20 mA' : part.type === 'diode' ? ' · model limit 1 A' : ''}`;
}
export const wireColorName = color => ['Red', 'Blue', 'Gold', 'Green', 'Purple', 'Gray'][WIRE_COLORS.findIndex(c => c.toLowerCase() === color.toLowerCase())] || color.toUpperCase();
export function boardMaterials(project) {
  return projectBoards(project).map(b => ({reference: boardReference(b), name: `${BOARD_SIZES[b.size].name}${b.splitRails ? ' · split rails' : ''}`, detail: BOARD_SIZES[b.size].rails ? `${BOARD_SIZES[b.size].columns} columns · ${b.splitRails ? 'rails split at the middle' : 'continuous power rails'}; match the connections on your actual board.` : `${BOARD_SIZES[b.size].columns} columns · no power rails`}));
}
export function billOfMaterials(project) {
  const refs = partReferences(project), groups = new Map();
  for (const p of project.parts) {
    const key = JSON.stringify([p.type, p.name, p.value, p.rating, p.polarized, p.current, p.recordKind, p.recordId, p.revision]);
    if (!groups.has(key)) groups.set(key, {name: p.name, detail: partSpecification(p), quantity: 0, references: [], partIds: []});
    const row = groups.get(key); row.quantity++; row.references.push(refs.get(p.id)); row.partIds.push(p.id);
  }
  return [...groups.values()];
}

export function inspectWiring(project) {
  const checks = [], attached = new Map(), nets = circuitNets(project);
  for (const w of project.wires) for (const endpoint of [w.from, w.to]) {
    if (!attached.has(endpoint)) attached.set(endpoint, []);
    attached.get(endpoint).push(w.id);
  }
  for (const [hole, items] of holeOccupants(project)) if (items.length > 1) checks.push({id: 'crowded:hole:' + hole, level: 'warning', target: items[0].id, message: `${hole.toUpperCase()} has ${items.length} wire ends or component leads in one hole. Move each to its own hole on the same connected strip.`});
  const supplyNets = project.parts.filter(p => p.type === 'supply').map(p => ({part: p, positive: nets.find(p.id + ':a'), negative: nets.find(p.id + ':b')}));
  const connected = (p, pin) => Boolean(p.mount) || attached.has(p.id + ':' + pin.id);
  for (const p of project.parts) {
    const missing = p.pins.filter(pin => !connected(p, pin));
    if (p.type !== 'device' && missing.length) checks.push({id: 'unwired:' + p.id, level: 'note', target: p.id, message: `${p.name}: ${missing.map(pin => pin.label).join(', ')} ${missing.length === 1 ? 'has' : 'have'} no wire. Position alone does not connect a component.`});
    if (['resistor', 'led', 'diode', 'buzzer', 'supply'].includes(p.type) && nets.find(p.id + ':a') === nets.find(p.id + ':b')) checks.push({id: 'bypassed:' + p.id, level: p.type === 'supply' ? 'error' : 'warning', target: p.id, message: `${p.name}: both terminals are on the same net. ${p.type === 'supply' ? 'This shorts the supply.' : 'The wiring bypasses this component.'}`});
    if (p.type === 'button' && !p.closed && nets.find(p.id + ':1a') === nets.find(p.id + ':2a')) checks.push({id: 'always-closed:' + p.id, level: 'warning', target: p.id, message: `${p.name}: its two sides are already connected, so pressing it changes nothing. Rotate it so the paired legs straddle the center gap.`});
    if (['npn', 'pnp'].includes(p.type) && new Set(['e', 'b', 'c'].map(pin => nets.find(p.id + ':' + pin))).size < 3) checks.push({id: 'transistor-short:' + p.id, level: 'warning', target: p.id, message: `${p.name}: two of its E, B and C leads share a net. Give each lead its own column.`});
    if (p.type === 'device') checks.push(...deviceRoleChecks(p, nets, supplyNets, connected, attached));
  }
  return checks;
}
// Static checks from the roles the builder assigned; nothing is inferred from labels.
function deviceRoleChecks(p, nets, supplyNets, connected, attached) {
  const checks = [], net = pin => nets.find(p.id + ':' + pin.id), byRole = role => p.pins.filter(pin => pin.role === role);
  for (const power of byRole('power')) for (const ground of byRole('ground')) if (net(power) === net(ground)) checks.push({id: `role-short:${p.id}:${power.id}:${ground.id}`, level: 'error', target: p.id, message: `${p.name}: ${power.label} (power) and ${ground.label} (ground) are connected together.`});
  for (const ground of byRole('ground')) for (const s of supplyNets) if (net(ground) === s.positive) checks.push({id: `role-reversed:${p.id}:${ground.id}`, level: 'error', target: p.id, message: `${p.name}: ground terminal ${ground.label} is wired to ${s.part.name} +. Check power polarity.`});
  for (const power of byRole('power')) for (const s of supplyNets) if (net(power) === s.negative) checks.push({id: `role-reversed:${p.id}:${power.id}`, level: 'error', target: p.id, message: `${p.name}: power terminal ${power.label} is wired to ${s.part.name} −. Check power polarity.`});
  const loose = [...byRole('power'), ...byRole('ground')].filter(pin => !connected(p, pin));
  if (loose.length) checks.push({id: 'role-unpowered:' + p.id, level: 'note', target: p.id, message: `${p.name}: ${loose.map(pin => pin.label).join(', ')} ${loose.length === 1 ? 'has' : 'have'} no connection.`});
  const nc = byRole('nc').filter(pin => attached.has(p.id + ':' + pin.id));
  if (nc.length) checks.push({id: 'role-nc:' + p.id, level: 'note', target: p.id, message: `${p.name}: ${nc.map(pin => pin.label).join(', ')} ${nc.length === 1 ? 'is' : 'are'} marked ${PIN_ROLES.nc.toLowerCase()} but wired.`});
  return checks;
}

const escape = value => String(value).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const short = (value, length = 25) => value.length > length ? value.slice(0, length - 1) + '…' : value;
function boardSvg(board) {
  const l = boardLayout(board), {x, y} = board, columnX = column => x + l.colX(column);
  const body = `<rect x="${x}" y="${y}" width="${l.width}" height="${l.height}" rx="12" fill="#f4f1e8" stroke="#999"/><rect x="${x + 29}" y="${y + l.trenchY}" width="${l.width - 58}" height="28" rx="6" fill="#d1cdc3"/>`;
  const rails = l.railLineY.map((offset, i) => {
    const segments = l.split ? [[x + 42, columnX(l.split) + 13], [columnX(l.split + 1) - 13, x + l.width - 31]] : [[x + 42, x + l.width - 31]];
    return segments.map(([from, to]) => `<path d="M${from} ${y + offset} H${to}" stroke="${i % 2 ? '#267bb8' : '#c52c2c'}" stroke-width="2"/>`).join('') + `<text x="${x + 19}" y="${y + offset + 15}" font-size="18">${i % 2 ? '−' : '+'}</text>`;
  }).join('');
  const labels = Array.from({length: l.columns}, (_, i) => l.columnLabelY.map(offset => `<text x="${columnX(i + 1)}" y="${y + offset}" text-anchor="middle">${i + 1}</text>`).join('')).join('') + [...'abcdefghij'].map(row => `<text x="${x + 20}" y="${y + l.rowY[row] + 4}">${row.toUpperCase()}</text>`).join('');
  return body + rails + labels + `<text x="${x + l.width - 12}" y="${y + 18}" text-anchor="end" font-size="11" fill="#777">${boardReference(board)}</text>`;
}
function mountedSvg(project, p, ref) {
  const g = mountedGeometry(project, p), label = `<text x="${g.x}" y="${g.box.y0 - 16}" text-anchor="middle" font-weight="bold">${ref} · ${escape(short(p.type === 'resistor' ? ohms(p.value) : p.type === 'capacitor' ? formatFarads(p.value) : p.name, 22))}</text>`;
  const pins = g.points.map(({pin, x, y}) => `<circle cx="${x}" cy="${y}" r="4" fill="#b08a4b"/><text x="${x + 7}" y="${y - 7}" font-size="10">${escape(short(pin.label, 8))}</text>`).join('');
  if (p.pins.length === 2) {
    const body = p.type === 'resistor' ? `<rect x="${-g.length / 2}" y="-9" width="${g.length}" height="18" rx="4" fill="#ddc49b" stroke="#745b32"/>` : p.type === 'led' ? '<circle r="11" fill="#ef958d" stroke="#922"/><path d="M7 -8 V8" stroke="#922"/>' : p.type === 'diode' ? '<rect x="-14" y="-7" width="28" height="14" rx="3" fill="#333"/><path d="M8 -7 V7" stroke="#ccc" stroke-width="3"/>' : p.type === 'capacitor' ? '<rect x="-12" y="-11" width="24" height="22" rx="5" fill="#4c6ea8" stroke="#223"/><path d="M8 -9 V9" stroke="#ccd" stroke-width="2"/>' : '<circle r="12" fill="#333" stroke="#111"/>';
    return `<g><path d="M${g.a.x} ${g.a.y} L${g.b.x} ${g.b.y}" stroke="#777" stroke-width="3"/><g transform="translate(${g.x} ${g.y}) rotate(${g.angle})">${body}</g>${label}${pins}</g>`;
  }
  const fill = p.type === 'device' ? '#24453f' : p.type === 'button' ? '#333' : p.type === 'potentiometer' ? '#3c5c88' : '#2b2b2b';
  return `<g><rect x="${g.box.x0 - 11}" y="${g.box.y0 - 11}" width="${g.box.x1 - g.box.x0 + 22}" height="${g.box.y1 - g.box.y0 + 22}" rx="5" fill="${fill}" opacity=".8"/>${label}${pins}</g>`;
}
// A self-contained vector diagram: no external catalog images, fonts or scripts.
export function buildDiagramSvg(project) {
  const refs = partReferences(project), extent = boardsExtent(project), free = project.parts.filter(p => !p.mount), main = projectBoards(project).find(b => b.id === 'main');
  const width = Math.max(1200, extent.x + 35, ...free.map(p => p.x + partBounds(p).width + 35), ...project.wires.flatMap(w => (w.points || []).map(p => p.x + 35)));
  const height = Math.max(840, extent.y + 60, ...free.map(p => p.y + partBounds(p).height + 35), ...project.wires.flatMap(w => (w.points || []).map(p => p.y + 35)));
  const boards = projectBoards(project).map(boardSvg).join('');
  const holes = projectHoles(project).map(h => `<circle cx="${h.x}" cy="${h.y}" r="3.5" fill="#777"/>`).join('');
  const wires = project.wires.map(w => `<path d="${wirePath(project, w)}" stroke="${w.color}" stroke-width="4" fill="none"/>`).join('');
  const parts = project.parts.map(p => {
    if (p.mount) return mountedSvg(project, p, refs.get(p.id));
    const {width: w, height: h} = partSize(p);
    return `<g transform="${partTransform(p)}"><rect width="${w}" height="${h}" rx="8" fill="white" stroke="#555" stroke-width="2"/><text x="12" y="22" font-weight="bold">${refs.get(p.id)} · ${escape(short(p.name, w > 200 ? 32 : 17))}</text><text x="12" y="43" font-size="10">${escape(short(partSpecification(p), w > 200 ? 42 : 23))}</text>${p.pins.map(pin => { const pos = localPinPosition(p, pin.id), anchor = pos.x > w * .66 ? 'end' : pos.x < w * .33 ? 'start' : 'middle'; return `<circle cx="${pos.x}" cy="${pos.y}" r="5" fill="#f1dba9" stroke="#725214"/><text x="${pos.x + (anchor === 'start' ? 10 : anchor === 'end' ? -10 : 0)}" y="${pos.y - 9}" text-anchor="${anchor}" font-size="10">${escape(short(pin.label, 15))}</text>`; }).join('')}</g>`;
  }).join('');
  const captionX = main.x + boardLayout(main).width / 2, captionY = main.y + boardLayout(main).height;
  return `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Circuit layout" viewBox="0 0 ${width} ${height}" font-family="Arial, sans-serif" font-size="12" fill="#222"><rect width="100%" height="100%" fill="white"/>${boards}${holes}${wires}${parts}<text x="${captionX}" y="${captionY + 42}" text-anchor="middle">A–E and F–J connect separately in columns. Power rails run along each board${projectBoards(project).some(b => b.splitRails) ? ' (split boards break at the middle)' : ''}.</text><text x="${captionX}" y="${captionY + 66}" text-anchor="middle">Layout is illustrative. Use the wiring checklist for exact terminals.</text></svg>`;
}
export function buildSheetHtml(project) {
  const refs = partReferences(project), checks = inspectWiring(project), materials = billOfMaterials(project), built = project.wires.filter(w => w.built).length;
  const mounts = project.parts.filter(p => p.mount);
  const mountingTable = mounts.length ? `<h2>Insert the components</h2><p>Leads connect directly to their breadboard strips. Match polarity and pin 1; footprints are illustrative, not dimensional models.</p><table class="mounting"><thead><tr><th>Inserted</th><th>Part</th><th>Leads</th></tr></thead><tbody>${mounts.map(p => `<tr><td>${p.mount.built ? '☑' : '☐'}</td><td>${refs.get(p.id)} ${escape(p.name)}</td><td>${p.pins.map(pin => `${escape(pin.label)} → ${escape(holeCode(p.mount.holes[pin.id]))}`).join('<br>')}</td></tr>`).join('')}</tbody></table>` : '';
  const boards = boardMaterials(project).map(b => `<tr><td>1</td><td>${escape(b.name)}<small>${escape(b.detail)}</small></td><td>${b.reference}</td></tr>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(project.name)} · Build sheet</title><style>
  *{box-sizing:border-box}body{font:14px/1.5 system-ui,sans-serif;color:#222;max-width:1120px;margin:32px auto;padding:0 24px}h1{font-size:28px;margin-bottom:4px}h2{font-size:20px;margin-top:30px}p{color:#555}table{width:100%;border-collapse:collapse;text-align:left}th,td{padding:9px;border-bottom:1px solid #ddd;vertical-align:top;overflow-wrap:anywhere}th{background:#f1f1ed}td:first-child{white-space:nowrap}small{display:block;color:#555}.diagram{border:1px solid #ddd;page-break-inside:avoid}.diagram svg{display:block;width:100%}button{padding:10px 18px;cursor:pointer}.note{white-space:pre-wrap;overflow-wrap:anywhere}.swatch{display:inline-block;width:12px;height:12px;border:1px solid #555;margin-right:6px}.status{font-weight:bold}@page{size:A4 landscape;margin:12mm}@media print{body{max-width:none;margin:0;padding:0;font-size:10pt;line-height:1.35}button{display:none}h1{font-size:24px;line-height:1.2;margin:4px 0}h2{break-after:avoid;margin:18px 0 8px}p{margin:6px 0}th,td{padding:6px 8px}tr{break-inside:avoid}thead{display:table-header-group}.diagram{break-after:page}.diagram svg{max-height:150mm}.wiring{break-before:page}}
  </style></head><body><button onclick="window.print()">Print / Save as PDF</button><p>BLACK WIRE · BUILD SHEET</p><h1>${escape(project.name)}</h1><p>${project.parts.length} components · ${project.wires.length} jumper wires · ${built} marked installed</p><div class="diagram">${buildDiagramSvg(project)}</div>
  <h2>Gather your parts</h2><table><thead><tr><th>Qty</th><th>Part / specification</th><th>References</th></tr></thead><tbody>${boards}${materials.map(m => `<tr><td>${m.quantity}</td><td>${escape(m.name)}<small>${escape(m.detail)}</small></td><td>${m.references.join(', ')}</td></tr>`).join('')}<tr><td>${project.wires.length}</td><td>Jumper wires<small>Choose lengths and connector ends for your physical parts.</small></td><td>${project.wires.length ? 'W1–W' + project.wires.length : '—'}</td></tr></tbody></table>
  <h2>Wiring checks</h2>${checks.length ? `<ul>${checks.map(c => `<li>${escape(c.message)}</li>`).join('')}</ul>` : '<p>No connection-layout issues found by these checks.</p>'}<p>Checks cover shared holes, unwired modeled terminals, bypassed components and the device terminal roles you assigned. Catalog devices are wiring references only; their firmware and electrical behavior are not simulated. A checkmark records your assembly progress, not a verified connection.</p>${project.notes ? `<h2>Build notes</h2><p class="note">${escape(project.notes)}</p>` : ''}
  <section class="wiring">${mountingTable}<h2>Wire one connection at a time</h2><p>Assemble with power disconnected. A wire crossing another wire is not a junction.</p><table><thead><tr><th>Installed</th><th>Wire</th><th>From</th><th>To</th></tr></thead><tbody>${project.wires.map((w, i) => `<tr><td>${w.built ? '☑' : '☐'}</td><td><b>W${i + 1}</b> ${escape(w.label || '')}<small><span class="swatch" style="background:${w.color}"></span>${escape(wireColorName(w.color))}</small></td><td>${escape(buildEndpointLabel(project, w.from, refs))}</td><td>${escape(buildEndpointLabel(project, w.to, refs))}</td></tr>`).join('')}</tbody></table></section></body></html>`;
}
