import React, {useState} from 'react';
import {formatFarads, partSize, partTransform, localPinPosition} from './breadboard.mjs';
import {libraryURL} from './runtime.mjs';
import MountedBreadboardPart from './MountedBreadboardPart.jsx';

export function referenceArtwork(record) {
  const images = (record?.assets || []).filter(a => ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(a.extension) && !a.previewError);
  const asset = images.find(a => a.type === 'pinout image') || images[0];
  return asset?.display || asset?.file || record?.preview || null;
}
const activate = action => e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); action(); } };

function subtitle(part) {
  if (part.type === 'device') return part.power?.current > 0 ? `MODELED LOAD · ${part.power.current} mA` : 'REFERENCE · WIRING ONLY';
  if (part.type === 'switch') return part.closed ? 'CLOSED' : 'OPEN';
  if (part.type === 'button') return part.closed ? 'PRESSED' : 'RELEASED · HOLD TO PRESS';
  if (part.type === 'potentiometer') return `${part.value / 1000} kΩ · ${part.position}%`;
  if (part.type === 'capacitor') return `${formatFarads(part.value)} · ${part.rating} V`;
  if (part.type === 'npn' || part.type === 'pnp') return `${part.type.toUpperCase()} · hFE ${part.value}`;
  if (part.type === 'buzzer') return `${part.value} V · ${part.current} mA`;
  return `${part.value} ${part.type === 'resistor' ? 'Ω' : 'V'}`;
}
export default function BreadboardPart({project, part, reference, record, selected, pending, reading, mapping, terminalProps, onSelect, onDragStart, onDragMove, onDragEnd, onNudge, onToggle, onPress, onMap}) {
  const {width, height} = partSize(part), artwork = referenceArtwork(record), [failedImage, setFailedImage] = useState(null);
  const bottomPins = ['potentiometer', 'npn', 'pnp'].includes(part.type);
  const brightness = part.type === 'led' ? Math.max(0, Math.min(1, (reading?.current || 0) / .01)) : 0;
  const name = reference ? `${reference} · ${part.name}` : part.name;
  if (part.mount) return <MountedBreadboardPart {...{project, part, reference, selected, pending, reading, terminalProps, onSelect, onDragStart, onDragMove, onDragEnd, onNudge, onToggle, onPress}}/>;
  return <g data-part-id={part.id} className={'bb-component ' + part.type + (selected ? ' selected' : '') + (brightness > .001 ? ' lit' : '')} transform={partTransform(part)}>
    <rect width={width} height={height} rx="10" className="bb-component-body" onClick={onSelect}/>
    <g className="bb-drag-handle" role="button" tabIndex={0} aria-label={'Move ' + part.name} onPointerDown={onDragStart} onPointerMove={onDragMove} onPointerUp={onDragEnd} onPointerCancel={onDragEnd} onClick={onSelect} onKeyDown={e => {
      const delta = {ArrowLeft: [-10, 0], ArrowRight: [10, 0], ArrowUp: [0, -10], ArrowDown: [0, 10]}[e.key];
      if (delta) { e.preventDefault(); onNudge(delta); } else activate(onSelect)(e);
    }}><title>{name} · Drag to move; arrow keys to nudge</title><rect width={width} height="58" rx="10" fill="transparent"/><text x="13" y="23" className="bb-component-name">{name.length > (width > 200 ? 36 : 20) ? name.slice(0, width > 200 ? 34 : 18) + '…' : name}</text><text x="13" y="43" className="bb-component-value">{subtitle(part)}</text></g>
    {part.type === 'device' && <>
      {part.referenceImage && artwork && failedImage !== artwork ? <image href={libraryURL(artwork)} x="10" y="58" width={width - 20} height={height - 68} preserveAspectRatio="xMidYMid meet" onError={() => setFailedImage(artwork)} pointerEvents="none"/> : <g pointerEvents="none" opacity=".65"><rect x={width / 2 - 23} y={height / 2 - 2} width="46" height="40" rx="3" fill="#193b35" stroke="#689589"/>{Array.from({length: 6}, (_, i) => <path key={i} d={`M${width / 2 - 29} ${height / 2 + 4 + i * 5} h6 M${width / 2 + 23} ${height / 2 + 4 + i * 5} h6`} stroke="#c2b889" strokeWidth="2"/>)}<text x={width / 2} y={height - 14} textAnchor="middle" className="bb-pin-label">{part.referenceImage && artwork ? 'Image unavailable' : 'Logical terminal layout'}</text></g>}
      {mapping && <rect className="bb-map-surface" x="0" y="58" width={width} height={height - 58} fill="#d9b87222" stroke="#d9b872" strokeDasharray="4 4" onClick={onMap}><title>Click to place the selected terminal</title></rect>}
    </>}
    {part.type === 'resistor' && <g pointerEvents="none"><path d="M8 91 H158" stroke="#aeb7b5" strokeWidth="3"/><rect x="48" y="81" width="70" height="20" rx="7" fill="#d0b58e"/><path d="M62 82 v18 M77 82 v18 M93 82 v18 M108 82 v18" stroke="#8b5333" strokeWidth="5"/></g>}
    {part.type === 'supply' && <g pointerEvents="none"><rect x="47" y="80" width="72" height="24" rx="3" fill="#0b1d1a"/><text x="83" y="97" textAnchor="middle" fill="#8ee2b1" fontFamily="monospace" fontSize="14">{part.value.toFixed(1)} V</text></g>}
    {part.type === 'led' && <g pointerEvents="none">{brightness > .001 && <circle cx="140" cy="36" r="17" fill="#ff524f" opacity={brightness} filter="url(#bb-glow)"/>}<circle cx="140" cy="36" r="9" className="bb-led-bulb" style={{fill: `rgb(${Math.round(85 + brightness * 170)}, ${Math.round(35 + brightness * 90)}, ${Math.round(30 + brightness * 70)})`}}/><path d="M68 95 h30 M75 84 l20 11 -20 11 Z M98 84 v22" stroke="#d59183" strokeWidth="2" fill="none"/></g>}
    {part.type === 'switch' && <g className="bb-switch-control" role="button" tabIndex={0} aria-label={'Toggle ' + part.name} aria-pressed={part.closed} onClick={onToggle} onKeyDown={activate(onToggle)}><rect x="112" y="28" width="40" height="24" rx="12"/><circle cx={part.closed ? 140 : 124} cy="40" r="8"/></g>}
    {part.type === 'diode' && <g pointerEvents="none"><path d="M8 91 H158" stroke="#aeb7b5" strokeWidth="3"/><rect x="58" y="81" width="50" height="20" rx="4" fill="#26292b"/><path d="M98 81 v20" stroke="#d8d8d0" strokeWidth="5"/></g>}
    {part.type === 'capacitor' && <g pointerEvents="none"><path d="M8 72 H60 M106 96 H158" stroke="#aeb7b5" strokeWidth="3" fill="none"/>{part.polarized ? <><rect x="60" y="62" width="46" height="44" rx="9" fill="#3f5f96" stroke="#9bb0d6"/><path d="M96 64 v40" stroke="#d3dbec" strokeWidth="4"/></> : <circle cx="83" cy="84" r="20" fill="#c9a053" stroke="#8a6a2c"/>}</g>}
    {part.type === 'buzzer' && <g pointerEvents="none">{reading?.sounding && <g className="bb-buzz"><path d="M118 70 A20 20 0 0 1 118 98"/><path d="M126 62 A30 30 0 0 1 126 106"/></g>}<circle cx="83" cy="84" r="24" fill="#202325" stroke="#5d6467" strokeWidth="2"/><circle cx="83" cy="84" r="4" fill="#5d6467"/><text x="66" y="66" fill="#e3c381" fontSize="12">+</text></g>}
    {(part.type === 'npn' || part.type === 'pnp') && <g pointerEvents="none"><path d="M48 128 V82 Q83 50 118 82 V128 Z" fill="#26292b" stroke="#5d6467" strokeWidth="2"/><text x="83" y="110" textAnchor="middle" fill="#c9cfd1" fontSize="11" fontFamily="monospace">{part.type.toUpperCase()}</text><path d="M30 128 V150 M83 128 V150 M136 128 V150" stroke="#aab3b0" strokeWidth="3"/></g>}
    {part.type === 'button' && <g className="bb-switch-control bb-button-press" role="button" tabIndex={0} aria-label={'Press ' + part.name} aria-pressed={part.closed} onPointerDown={e => { e.stopPropagation(); e.currentTarget.setPointerCapture?.(e.pointerId); onPress(true); }} onPointerUp={() => onPress(false)} onPointerCancel={() => onPress(false)} onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); onPress(true); } }} onKeyUp={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPress(false); } }} onBlur={() => part.closed && onPress(false)}><title>Hold to press</title><rect x="58" y="62" width="50" height="44" rx="5"/><circle cx="83" cy="84" r={part.closed ? 13 : 15}/></g>}
    {part.type === 'potentiometer' && <g pointerEvents="none"><circle cx="83" cy="98" r="32" fill="#30383b" stroke="#828b8b" strokeWidth="3"/><circle cx="83" cy="98" r="23" fill="#171c1e" stroke="#515b5f"/><path d="M83 98 V77" stroke="#e3c381" strokeWidth="4" strokeLinecap="round" transform={`rotate(${-135 + part.position * 2.7} 83 98)`}/><path d="M30 140 V165 M83 140 V165 M136 140 V165" stroke="#aab3b0" strokeWidth="3"/></g>}
    {part.pins.map((pin, i) => { const endpoint = part.id + ':' + pin.id, pos = localPinPosition(part, pin.id), bottom = bottomPins; return <g key={pin.id} {...terminalProps(endpoint)} className={'bb-pin ' + (pending === endpoint ? 'pending' : '')}><title>{pin.label}{pin.position ? ' · manually placed' : ''}</title><circle cx={pos.x} cy={pos.y} r="12" fill="transparent"/><circle cx={pos.x} cy={pos.y} r="6" className="bb-pin-contact"/><text x={pos.x + (bottom || pin.position ? 0 : i % 2 ? -12 : 12)} y={pos.y + (bottom || pin.position ? -12 : 4)} textAnchor={bottom || pin.position ? 'middle' : i % 2 ? 'end' : 'start'} className={'bb-pin-label ' + (pin.position ? 'mapped' : '')}>{pin.label.length > 16 ? pin.label.slice(0, 14) + '…' : pin.label}</text></g>; })}
  </g>;
}
