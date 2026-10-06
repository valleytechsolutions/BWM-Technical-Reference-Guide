import {appAsset} from './runtime.mjs';

// Transcribed pin lists ship separately from catalog.json so the guide's first load stays small.
// Fetched once, when the breadboard opens; a missing file leaves catalog boards without pin lists.
let request;
export function loadPinConnectors() {
  request ||= fetch(appAsset('pin-connectors.json')).then(r => r.ok ? r.json() : {}).catch(() => ({}));
  return request;
}
export function withPinConnectors(record, pins) {
  return record && !record.pinConnectors && pins?.[record.id] ? {...record, pinConnectors: pins[record.id]} : record;
}
