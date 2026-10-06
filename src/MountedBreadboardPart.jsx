import React from 'react';
import {formatFarads, mountedGeometry} from './breadboard.mjs';
import {holeCode} from './breadboard-boards.mjs';

const ohms = v => v >= 1e6 ? v / 1e6 + ' MΩ' : v >= 1000 ? v / 1000 + ' kΩ' : v + ' Ω';
const pressKeys = new Set(['Enter', ' ']);
function summary(part) {
  if (part.type === 'resistor') return ohms(part.value);
  if (part.type === 'potentiometer') return ohms(part.value);
  if (part.type === 'capacitor') return formatFarads(part.value);
  if (part.type === 'npn' || part.type === 'pnp') return part.type.toUpperCase();
  if (part.type === 'led') return 'LED';
  if (part.type === 'device') return part.name.length > 18 ? part.name.slice(0, 17) + '…' : part.name;
  return part.name;
}
// Two-lead bodies are drawn along the lead axis in local coordinates centred between the leads.
function axialBody(part, length, brightness, reading, onToggle) {
  if (part.type === 'resistor') return <><rect x={-length / 2} y="-9" width={length} height="18" rx="5" className="bb-mounted-resistor"/><text y="4" textAnchor="middle" className="bb-resistor-symbol">Ω</text></>;
  if (part.type === 'led') return <>{brightness > .001 && <circle r="20" fill="#ff524f" opacity={brightness} filter="url(#bb-glow)"/>}<circle r="11" className="bb-mounted-led" style={{fill: `rgb(${Math.round(90 + brightness * 165)}, ${Math.round(40 + brightness * 90)}, ${Math.round(35 + brightness * 75)})`}}/><path d="M7 -8 V8" stroke="#f0b4ad" strokeWidth="2"/></>;
  if (part.type === 'diode') return <><rect x="-15" y="-7" width="30" height="14" rx="3" className="bb-mounted-diode"/><path d="M9 -7 V7" stroke="#d8d8d0" strokeWidth="3"/></>;
  if (part.type === 'capacitor') return part.polarized ? <><rect x="-13" y="-12" width="26" height="24" rx="6" className="bb-mounted-capacitor"/><path d="M9 -10 V10" stroke="#d3dbec" strokeWidth="3"/><text x="-4" y="4" textAnchor="middle" className="bb-cap-mark">−</text></> : <circle r="10" className="bb-mounted-ceramic"/>;
  if (part.type === 'buzzer') return <>{reading?.sounding && <g className="bb-buzz"><path d="M17 -10 A14 14 0 0 1 17 10"/><path d="M22 -15 A21 21 0 0 1 22 15"/></g>}<circle r="13" className="bb-mounted-buzzer"/><circle r="3" fill="#555"/><text x="-7" y="-15" className="bb-mounted-label bb-mounted-pin-label">+</text></>;
  return <><rect x="-16" y="-8" width="32" height="16" rx="3" className="bb-mounted-switch"/><g role="button" tabIndex={0} aria-label={'Toggle ' + part.name} aria-pressed={part.closed} className="bb-switch-control bb-mounted-toggle" onPointerDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); onToggle(); }} onKeyDown={e => { if (pressKeys.has(e.key)) { e.preventDefault(); e.stopPropagation(); onToggle(); } }}><rect x="-11" y="-5" width="22" height="10" rx="5"/><circle cx={part.closed ? 5 : -5} cy="0" r="4"/></g></>;
}
function footprintBody(part, g, onPress) {
  const {x0, y0, x1, y1} = g.box, pad = part.type === 'device' ? 12 : 11, box = {x: x0 - pad, y: y0 - pad, width: x1 - x0 + pad * 2, height: y1 - y0 + pad * 2};
  if (part.type === 'button') {
    const press = down => e => { e.stopPropagation(); e.preventDefault(); if (down) e.currentTarget.setPointerCapture?.(e.pointerId); onPress(down); };
    return <><rect {...box} rx="4" className="bb-mounted-button"/><circle cx={g.x} cy={g.y} r={Math.min(box.width, box.height) / 2 - 7} role="button" tabIndex={0} aria-label={'Press ' + part.name} aria-pressed={part.closed} className={'bb-button-cap' + (part.closed ? ' pressed' : '')} onPointerDown={press(true)} onPointerUp={press(false)} onPointerCancel={press(false)} onClick={e => e.stopPropagation()} onKeyDown={e => { if (pressKeys.has(e.key) && !e.repeat) { e.preventDefault(); e.stopPropagation(); onPress(true); } }} onKeyUp={e => { if (pressKeys.has(e.key)) { e.preventDefault(); onPress(false); } }} onBlur={() => part.closed && onPress(false)}><title>Hold to press {part.name}</title></circle></>;
  }
  if (part.type === 'potentiometer') return <><rect {...box} y={box.y - 14} height={box.height + 14} rx="4" className="bb-mounted-pot"/><circle cx={g.x} cy={g.y - 12} r="12" className="bb-mounted-knob"/><path d={`M${g.x} ${g.y - 12} v-10`} stroke="#e3c381" strokeWidth="3" strokeLinecap="round" transform={`rotate(${-135 + part.position * 2.7} ${g.x} ${g.y - 12})`}/></>;
  if (part.type === 'npn' || part.type === 'pnp') return <path d={`M${box.x} ${box.y + box.height} V${box.y + 10} Q${g.x} ${box.y - 14} ${box.x + box.width} ${box.y + 10} V${box.y + box.height} Z`} className="bb-mounted-transistor"/>;
  const first = g.points[0];
  return <><rect {...box} rx="3" className="bb-mounted-ic"/><circle cx={first.x} cy={first.y + (first.y >= g.y ? -11 : 11)} r="3" className="bb-pin-one"><title>Pin 1</title></circle>{box.width > 90 && box.height > 30 && <text x={g.x} y={g.y + 4} textAnchor="middle" className="bb-ic-name">{summary(part)}</text>}</>;
}
export default function MountedBreadboardPart({project, part, reference, selected, pending, reading, terminalProps, onSelect, onDragStart, onDragMove, onDragEnd, onNudge, onToggle, onPress}) {
  const g = mountedGeometry(project, part), axial = part.pins.length === 2;
  const brightness = part.type === 'led' ? Math.max(0, Math.min(1, (reading?.current || 0) / .01)) : 0;
  const crowded = part.type === 'device' && part.pins.length > 8;
  return <g data-part-id={part.id} className={'bb-component bb-mounted ' + part.type + (selected ? ' selected' : '') + (brightness > .001 ? ' lit' : '') + (reading?.sounding ? ' sounding' : '')}>
    <g role="button" tabIndex={0} aria-label={'Move ' + part.name} className="bb-mounted-handle" onPointerDown={onDragStart} onPointerMove={onDragMove} onPointerUp={onDragEnd} onPointerCancel={onDragEnd} onClick={onSelect} onKeyDown={e => {
      if (e.target !== e.currentTarget) return;
      const delta = {ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1]}[e.key];
      if (delta) { e.preventDefault(); e.stopPropagation(); onNudge(delta); } else if (pressKeys.has(e.key)) { e.preventDefault(); onSelect(); }
    }}><title>{reference} {part.name} · {part.pins.map(pin => holeCode(part.mount.holes[pin.id])).join(', ')} · Drag or use arrow keys to move</title>
      {axial ? <>
        <path d={`M${g.a.x} ${g.a.y} L${g.b.x} ${g.b.y}`} className="bb-mounted-hit"/>
        <path d={`M${g.a.x} ${g.a.y} L${g.b.x} ${g.b.y}`} className="bb-mounted-leads"/>
        <g transform={`translate(${g.x} ${g.y}) rotate(${g.angle})`}>{axialBody(part, g.length, brightness, reading, onToggle)}</g>
      </> : footprintBody(part, g, onPress)}
    </g>
    <text x={g.x} y={axial ? g.y - 24 : g.box.y0 - (part.type === 'potentiometer' ? 32 : part.type === 'device' ? 27 : 19)} textAnchor="middle" className="bb-mounted-label">{reference} · {summary(part)}</text>
    {g.points.map(({pin, x, y}) => { const endpoint = part.id + ':' + pin.id, below = crowded && y > g.y; return <g key={pin.id} {...terminalProps(endpoint)} className={'bb-pin bb-mounted-pin ' + (pending === endpoint ? 'pending' : '')}><title>{pin.label} · inserted at {holeCode(part.mount.holes[pin.id])}</title><circle cx={x} cy={y} r="9" fill="transparent"/><circle cx={x} cy={y} r="5" className="bb-pin-contact"/>{(!crowded || selected) && <text x={crowded ? x : x + 8} y={below ? y + 19 : y - 8} textAnchor={crowded ? 'middle' : 'start'} className="bb-mounted-label bb-mounted-pin-label">{crowded && pin.label.length > 5 ? pin.label.slice(0, 5) : pin.label}</text>}</g>; })}
  </g>;
}
