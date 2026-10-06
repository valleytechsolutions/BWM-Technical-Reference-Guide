// The guide's first load fetches catalog.json; transcribed pin lists are only needed by the breadboard.
// Split them into pin-connectors.json (loaded on demand) and leave a small pinCount on each record so
// the catalog can still say which boards arrive with pins.
export const PIN_FILE = 'pin-connectors.json';
export function splitCatalog(catalog) {
  const pins = {};
  const strip = record => {
    if (!record.pinConnectors) return record;
    const {pinConnectors, ...rest} = record;
    pins[record.id] = pinConnectors;
    return {...rest, pinCount: pinConnectors.connectors.reduce((n, c) => n + c.pins.length, 0)};
  };
  return {catalog: {...catalog, ...(Array.isArray(catalog.boards) ? {boards: catalog.boards.map(strip)} : {}), ...(Array.isArray(catalog.makerParts) ? {makerParts: catalog.makerParts.map(strip)} : {})}, pins};
}
