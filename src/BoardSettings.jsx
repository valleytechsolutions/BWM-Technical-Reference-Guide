import React from 'react';
import {Plus, Trash2} from 'lucide-react';
import {BOARD_SIZES, MAX_BOARDS, boardLabel, projectBoards} from './breadboard-boards.mjs';
import {boardUsage} from './breadboard-placement.mjs';

export default function BoardSettings({project, boardId, onUpdate, onAdd, onRemove, onSelect}) {
  const boards = projectBoards(project), board = boards.find(b => b.id === boardId) || boards[0], usage = boardUsage(project, board.id);
  return <div className="bb-inspector-body bb-board-settings">
    <div className="bb-board-tabs" role="tablist" aria-label="Breadboards">{boards.map(b => <button key={b.id} role="tab" aria-selected={b.id === board.id} onClick={() => onSelect(b.id)}>{boardLabel(b)}</button>)}</div>
    <h3>{boardLabel(board)}</h3>
    <label className="bb-field">Board size<select aria-label="Board size" value={board.size} onChange={e => onUpdate(board.id, {size: e.target.value})}>{Object.entries(BOARD_SIZES).map(([id, size]) => <option key={id} value={id}>{size.name} · {size.columns} columns</option>)}</select><small>{BOARD_SIZES[board.size].detail}</small></label>
    {BOARD_SIZES[board.size].rails && <label className="bb-image-toggle"><input type="checkbox" checked={board.splitRails} onChange={e => onUpdate(board.id, {splitRails: e.target.checked})}/>Power rails split at the middle<small>Many full-size boards break each rail in two. Check your board and bridge the halves with a jumper if needed.</small></label>}
    <p className="bb-muted">A–E and F–J connect in columns; the center gap separates them. Drag the board body to move it. {usage.wires || usage.parts ? `${usage.parts} inserted part${usage.parts === 1 ? '' : 's'} and ${usage.wires} wire${usage.wires === 1 ? '' : 's'} use this board.` : 'Nothing is connected to this board yet.'}</p>
    <button className="bb-reference" disabled={boards.length >= MAX_BOARDS} onClick={() => onAdd('half')}><Plus size={14}/>Add breadboard</button>
    {boards.length >= MAX_BOARDS && <p className="bb-muted">A circuit can use up to {MAX_BOARDS} breadboards.</p>}
    {board.id !== 'main' && <button className="bb-remove" onClick={() => onRemove(board.id)}><Trash2 size={14}/>Remove board{usage.wires || usage.parts ? ' · lifts its parts and removes its wires' : ''}</button>}
  </div>;
}
