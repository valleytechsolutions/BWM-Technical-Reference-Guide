// Whether a catalog record arrives on the breadboard with terminals, and how they were produced.
// Mirrors the order createPart() uses: sourced pin references, then transcribed connectors, then a label list.
const LEVELS = {
  sourced: 'Sourced pin list', labels: 'Pin label list', reviewed: 'Reviewed', 'double-entry': 'Read twice',
  'ocr-arbitrated': 'Read twice · OCR-settled', 'ocr-checked': 'OCR-checked', 'single-entry': 'Single reading', partial: 'Partly read',
};
export function pinStatus(record) {
  const references = record?.pinReferences?.reduce((n, r) => n + (r.pins?.length || 0), 0) || 0;
  if (references) return {ready: true, count: references, level: 'sourced', text: LEVELS.sourced};
  // The split catalog keeps only pinCount; full pin lists load with the breadboard.
  const transcribed = record?.pinConnectors?.connectors?.reduce((n, c) => n + c.pins.length, 0) || record?.pinCount || 0;
  if (transcribed) { const level = record.pinConnectors?.review || 'transcribed'; return {ready: true, count: transcribed, level, text: LEVELS[level] || 'Transcribed'}; }
  const labels = record?.pinLabels?.length || 0;
  if (labels) return {ready: true, count: labels, level: 'labels', text: LEVELS.labels};
  return {ready: false, count: 0, level: 'none', text: 'No pin list yet'};
}
export function splitByPins(entries) {
  const ready = [], missing = [];
  for (const entry of entries) (pinStatus(entry.record).ready ? ready : missing).push(entry);
  return {ready, missing};
}
