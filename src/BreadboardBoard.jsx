import React from 'react';
import {boardLabel, boardLayout, boardReference} from './breadboard-boards.mjs';

// One physical breadboard: body, trench, rails (optionally split) and hole artwork. Hole click targets live in the view.
export default function BreadboardBoard({board, holes, selected, holeClass, pending, onSelect, onDragStart, onDragMove, onDragEnd}) {
  const l = boardLayout(board), {x, y} = board, columnX = column => x + l.colX(column);
  const railSegments = l.split ? [[x + 42, columnX(l.split) + 13], [columnX(l.split + 1) - 13, x + l.width - 31]] : [[x + 42, x + l.width - 31]];
  return <g className={'bb-physical-board' + (selected ? ' selected' : '')} data-board={board.id} aria-label={`${boardLabel(board)} · ${l.columns} columns`}>
    <rect x={x + 2} y={y + 6} width={l.width} height={l.height} rx="16" className="bb-board-shadow"/>
    <rect x={x} y={y} width={l.width} height={l.height} rx="16" className="bb-board-body" onPointerDown={onDragStart} onPointerMove={onDragMove} onPointerUp={onDragEnd} onPointerCancel={onDragEnd} onClick={onSelect}><title>{boardLabel(board)} · click to edit its size and rails, drag to move</title></rect>
    <rect x={x + 29} y={y + l.trenchY} width={l.width - 58} height="28" rx="8" className="bb-trench" pointerEvents="none"/>
    <text x={x + l.width / 2} y={y + l.trenchY + 19} textAnchor="middle" className="bb-board-brand" pointerEvents="none">BLACK WIRE  /  {boardReference(board)}  /  {l.columns}</text>
    <g pointerEvents="none">
      {l.railLineY.map((offset, i) => <g key={offset}>{railSegments.map(([from, to]) => <path key={from} d={`M${from} ${y + offset} H${to}`} stroke={i % 2 ? '#477b9e' : '#c65552'} strokeWidth="2"/>)}<text x={x + 20} y={y + offset + 16} className="bb-rail-label" fill={i % 2 ? '#477b9e' : '#c65552'}>{i % 2 ? '−' : '+'}</text></g>)}
      {l.split > 0 && <path d={`M${(columnX(l.split) + columnX(l.split + 1)) / 2} ${y + 22} v52 M${(columnX(l.split) + columnX(l.split + 1)) / 2} ${y + 360} v52`} className="bb-rail-split"/>}
      {[...'abcdefghij'].map(r => <text key={r} x={x + 24} y={y + l.rowY[r] + 4} className="bb-hole-label">{r.toUpperCase()}</text>)}
      {Array.from({length: l.columns}, (_, i) => <g key={i}>{l.columnLabelY.map(offset => <text key={offset} x={columnX(i + 1)} y={y + offset} className="bb-column-label">{i + 1}</text>)}</g>)}
      {holes.map(h => <g key={h.id} className={'bb-hole ' + holeClass(h)}><rect x={h.x - 4} y={h.y - 4} width="8" height="8" rx="2"/>{pending === 'hole:' + h.id && <circle cx={h.x} cy={h.y} r="9" className="bb-terminal-ring"/>}</g>)}
    </g>
  </g>;
}
