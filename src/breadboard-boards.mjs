// Physical breadboard geometry. The main board keeps unprefixed hole IDs (a14, tp2)
// so circuits saved before multiple boards keep every endpoint; added boards use b2.a14.
export const BOARD_SIZES = {
  mini: {name: 'Mini breadboard', detail: '17 columns · no power rails', columns: 17, rails: false},
  half: {name: 'Half breadboard', detail: '30 columns · four power rails', columns: 30, rails: true},
  full: {name: 'Full breadboard', detail: '63 columns · four power rails', columns: 63, rails: true},
};
export const MAX_BOARDS = 4;
export const MAX_COORDINATE = 4000;
export const PITCH = 26;
export const RAILS = ['tp', 'tn', 'bp', 'bn'];
export const RAIL_NAMES = {tp: 'Top +', tn: 'Top −', bp: 'Bottom +', bn: 'Bottom −'};
export const mainBoard = () => ({id: 'main', size: 'half', x: 153, y: 307, splitRails: false});
const DEFAULT_BOARDS = Object.freeze([Object.freeze(mainBoard())]);
export const projectBoards = project => project?.boards?.length ? project.boards : DEFAULT_BOARDS;

// Offsets are relative to the board's top-left corner; boards without rails shift up by one rail block.
export function boardLayout(board) {
  const {columns, rails} = BOARD_SIZES[board.size], lift = rails ? 0 : 62;
  const rowY = {a: 105, b: 127, c: 149, d: 171, e: 193, f: 255, g: 277, h: 299, i: 321, j: 343};
  for (const row in rowY) rowY[row] -= lift;
  if (rails) Object.assign(rowY, {tp: 43, tn: 67, bp: 381, bn: 405});
  return {
    columns, rails, rowY, rows: rails ? ['tp', 'tn', ...'abcdefghij', 'bp', 'bn'] : [...'abcdefghij'],
    width: 108 + (columns - 1) * PITCH, height: rails ? 440 : 320, trenchY: 209 - lift,
    columnLabelY: [91 - lift, 363 - lift], railLineY: rails ? [31, 55, 369, 393] : [],
    colX: column => 55 + (column - 1) * PITCH, split: board.splitRails && rails ? Math.ceil(columns / 2) : 0,
  };
}
export const boardLabel = board => board.id === 'main' ? 'Breadboard' : 'Breadboard ' + board.id.slice(1);
export const boardReference = board => board.id === 'main' ? 'BB1' : 'BB' + board.id.slice(1);
export function parseHole(id) {
  const match = /^(?:(b\d)\.)?(tp|tn|bp|bn|[a-j])(\d{1,2})$/.exec(id || '');
  return match ? {board: match[1] || 'main', row: match[2], column: Number(match[3])} : null;
}
export const holeId = (board, row, column) => (board === 'main' ? '' : board + '.') + row + column;
// Compact code for instructions: E14 on the main board, BB2 E14 elsewhere.
export function holeCode(id) {
  const hole = parseHole(id);
  return hole ? (hole.board === 'main' ? '' : 'BB' + hole.board.slice(1) + ' ') + (hole.row + hole.column).toUpperCase() : String(id).toUpperCase();
}

const cache = new WeakMap();
function buildHoles(boards) {
  const holes = [];
  for (const board of boards) {
    const layout = boardLayout(board), prefix = board.id === 'main' ? '' : board.id + '.';
    for (const row of layout.rows) for (let column = 1; column <= layout.columns; column++) {
      const rail = RAILS.includes(row), side = layout.split && column > layout.split ? '-right' : '';
      const net = prefix + (rail ? row + side : `${'abcde'.includes(row) ? 'upper' : 'lower'}-${column}`);
      holes.push({id: prefix + row + column, board: board.id, row, column, rail, x: board.x + layout.colX(column), y: board.y + layout.rowY[row], net});
    }
  }
  return holes;
}
function indexed(project) {
  const boards = projectBoards(project);
  if (!cache.has(boards)) { const holes = buildHoles(boards); cache.set(boards, {holes, map: new Map(holes.map(h => [h.id, h]))}); }
  return cache.get(boards);
}
export const projectHoles = project => indexed(project).holes;
export const findHole = (project, id) => indexed(project).map.get(id);
export const isHoleEndpoint = (project, endpoint) => endpoint.startsWith('hole:') && indexed(project).map.has(endpoint.slice(5));

// Moves a hole by whole rows (within the board's own row list) and columns, or returns null off the board.
export function offsetHole(project, id, rows, columns, boardId) {
  const hole = findHole(project, id), board = projectBoards(project).find(b => b.id === (boardId || hole?.board));
  if (!hole || !board) return null;
  const layout = boardLayout(board), from = layout.rows.indexOf(hole.row);
  const row = layout.rows[from + rows], column = hole.column + columns;
  return row && column >= 1 && column <= layout.columns ? holeId(board.id, row, column) : null;
}
// Grid distance between two holes on the same board, in [row, column] steps.
export function holeDelta(project, fromId, toId) {
  const a = findHole(project, fromId), b = findHole(project, toId);
  if (!a || !b || a.board !== b.board) return null;
  const rows = boardLayout(projectBoards(project).find(board => board.id === a.board)).rows;
  return [rows.indexOf(b.row) - rows.indexOf(a.row), b.column - a.column];
}
export function boardsExtent(project) {
  return projectBoards(project).reduce((extent, board) => { const {width, height} = boardLayout(board); return {x: Math.max(extent.x, board.x + width), y: Math.max(extent.y, board.y + height)}; }, {x: 0, y: 0});
}
export function validateBoards(boards) {
  if (boards == null) return [mainBoard()];
  if (!Array.isArray(boards) || !boards.length || boards.length > MAX_BOARDS) throw new Error(`A circuit needs 1–${MAX_BOARDS} breadboards.`);
  const ids = new Set();
  const result = boards.map(b => {
    if (!b || !/^(main|b[2-9])$/.test(b.id) || ids.has(b.id) || !Object.hasOwn(BOARD_SIZES, b.size) || ![b.x, b.y].every(n => Number.isFinite(n) && n >= 0 && n <= MAX_COORDINATE) || (b.splitRails != null && typeof b.splitRails !== 'boolean')) throw new Error('A breadboard has an invalid ID, size or position.');
    ids.add(b.id);
    return {id: b.id, size: b.size, x: b.x, y: b.y, splitRails: Boolean(b.splitRails)};
  });
  if (!ids.has('main')) throw new Error('The main breadboard is missing.');
  return result;
}
