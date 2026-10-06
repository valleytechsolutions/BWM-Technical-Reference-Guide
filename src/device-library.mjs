import {LIMITS, createPart, uid, validateDeviceProfile, validatePins} from './breadboard.mjs';

// Reusable device definitions saved by the builder. Parts copy a template; editing a part
// never changes the library until the builder saves it again.
export const LIBRARY_KEY = 'blackwire-device-library-v1';
export const LIBRARY_LIMIT = 100;
export const emptyLibrary = () => ({format: 'black-wire-device-library', version: 1, devices: []});
const text = (s, max = 200) => typeof s === 'string' && s.length <= max;

export function validateTemplate(t) {
  const fail = message => { throw new Error(message); };
  if (!t || !text(t.id, 100) || !/^[\w-]+$/.test(t.id) || !text(t.name) || !t.name.trim() || !text(t.revision || '', 2000) || !text(t.recordId || '') || !['board', 'maker'].includes(t.recordKind || 'board') || !Array.isArray(t.pins) || t.pins.length > LIMITS.pins || (t.updatedAt != null && !Number.isFinite(Date.parse(t.updatedAt)))) fail('A saved device has an invalid name, reference or terminal list.');
  const pins = validatePins(t.pins.map(({position, ...pin}) => pin), true, fail);
  return {id: t.id, name: t.name, revision: t.revision || '', recordId: t.recordId || '', recordKind: t.recordKind || 'board', pins, ...validateDeviceProfile(t, pins.map(p => p.id), fail), updatedAt: t.updatedAt || new Date().toISOString()};
}
export function validateLibrary(data) {
  if (!data || data.format !== 'black-wire-device-library' || data.version !== 1 || !Array.isArray(data.devices) || data.devices.length > LIBRARY_LIMIT) throw new Error('This is not a supported Black Wire device library.');
  const ids = new Set();
  const devices = data.devices.map(d => { const t = validateTemplate(d); if (ids.has(t.id)) throw new Error('The device library contains a duplicate device.'); ids.add(t.id); return t; });
  return {format: data.format, version: 1, devices};
}
export function loadLibrary(storage) {
  try { const saved = storage.getItem(LIBRARY_KEY); return {library: saved === null ? emptyLibrary() : validateLibrary(JSON.parse(saved)), blocked: false}; }
  catch { return {library: emptyLibrary(), blocked: true}; }
}
// Saves the part's definition (not its position, wiring or artwork placement) as a new or updated template.
export function saveTemplate(library, part) {
  const existing = library.devices.find(d => d.id === part.templateId);
  if (!existing && library.devices.length >= LIBRARY_LIMIT) throw new Error(`Your device library holds up to ${LIBRARY_LIMIT} devices. Delete one first.`);
  const template = validateTemplate({id: existing?.id || uid(), name: part.name, revision: part.revision, recordId: part.recordId, recordKind: part.recordKind, pins: part.pins, footprint: part.footprint, power: part.power, powerOut: part.powerOut, pinSource: part.pinSource, updatedAt: new Date().toISOString()});
  return {library: {...library, devices: existing ? library.devices.map(d => d.id === template.id ? template : d) : [...library.devices, template]}, id: template.id};
}
export const removeTemplate = (library, id) => ({...library, devices: library.devices.filter(d => d.id !== id)});
export function partFromTemplate(template, index = 0) {
  const {id, updatedAt, ...definition} = structuredClone(template);
  return {...createPart('device', index), ...definition, templateId: id};
}
// Imported devices replace saved devices with the same ID and are otherwise added.
export function mergeLibrary(library, imported) {
  const incoming = validateLibrary(imported).devices, ids = new Set(incoming.map(d => d.id));
  const devices = [...library.devices.filter(d => !ids.has(d.id)), ...incoming];
  if (devices.length > LIBRARY_LIMIT) throw new Error(`Importing would exceed the ${LIBRARY_LIMIT}-device library limit.`);
  return {...library, devices};
}

export function parsePinLabels(value) {
  return value.split(/[\n,;\t]+/).map(label => label.trim().slice(0, 160)).filter(Boolean);
}
// Suggestions only fill unassigned roles and are shown for the builder to confirm against the reference.
const ROLE_PATTERNS = [
  ['nc', /^(nc|n\/c|dnc|no connect)$/i],
  ['ground', /^(gnd|vss|ground|0v|agnd|dgnd|pgnd|v-|vee)\b/i],
  ['power', /^(\+?vcc|\+?vdd|vin|v\+|vbat|vbus|vs|avcc|avdd|vddio|vlogic|\+?3v3|\+?3\.3 ?v|\+?5 ?v|\+?12 ?v)\b/i],
  ['bus', /^(sda|scl|mosi|miso|sck|sclk|copi|cipo|cs|ss|nss|tx|rx|txd|rxd|can[hl]?|d[+-]|usb)/i],
  ['analog', /^(a\d+|adc\d*|ain\d*|aout|dac\d*)$/i],
  ['io', /^(gpio ?\d*|io ?\d+|d\d+|p[a-h]?\d+(\.\d+)?|int|irq|en|rst|reset)$/i],
];
export function suggestRole(label) {
  const clean = String(label).split(/[\s/(]/)[0];
  return ROLE_PATTERNS.find(([, pattern]) => pattern.test(clean) || pattern.test(label))?.[0] || '';
}
export function suggestRoles(pins) {
  return pins.map(pin => pin.role ? pin : (role => role ? {...pin, role} : pin)(suggestRole(pin.label)));
}

// USB power output from pin labels or roles: every ground pin, 3V3 pins at 3.3 V and 5V/VBUS pins at 5 V.
// A suggestion only: the builder confirms it against the board, and can edit it in the device maker.
const RAIL_LABELS = [[3.3, /^\+?(3V3|3\.3 ?V|3V3_OUT|3V3\(OUT\))$/i], [5, /^\+?(5V|5V0|VBUS|VUSB|USB 5V)$/i]];
export function suggestPowerOut(pins) {
  const ground = pins.filter(p => p.role === 'ground' || /^(GND|G|VSS|AGND|DGND)$/i.test(p.label.trim())).map(p => p.id);
  const rails = RAIL_LABELS.map(([voltage, pattern]) => ({voltage, pins: pins.filter(p => pattern.test(p.label.trim()) && !ground.includes(p.id)).map(p => p.id)})).filter(r => r.pins.length);
  return ground.length && rails.length ? {ground, rails} : null;
}
