import React, {useState} from 'react';
import {Cable, Pencil, MapPin, Trash2} from 'lucide-react';
import {localPinPosition, partSize} from './breadboard.mjs';

export default function CircuitTerminals({part, wires, pending, onConnect, onUpdate, onRemove, onMap}) {
  const [editing, setEditing] = useState(null), pin = part.pins.find(p => p.id === editing);
  function update(changes) { onUpdate(part.pins.map(p => p.id === editing ? {...p, ...changes} : p)); }
  const pos = pin && localPinPosition(part, pin.id), size = partSize(part);
  const coordinates = pin?.position || (pos ? {x: pos.x / size.width, y: pos.y / size.height} : null);
  const attached = pin ? wires.filter(w => [w.from, w.to].includes(part.id + ':' + pin.id)).length : 0;
  return <>
    <div className="bb-terminal-list">{part.pins.map(p => <div className="bb-terminal-row" key={p.id}><button title={p.reference || p.label} aria-pressed={pending === part.id + ':' + p.id} onClick={() => onConnect(part.id + ':' + p.id)}><span className="bb-terminal-dot"/>{p.label}<Cable size={13}/></button><button aria-label={'Edit terminal ' + p.label} title="Edit terminal" onClick={() => setEditing(p.id)}><Pencil size={13}/></button></div>)}</div>
    {pin && <div className="bb-pin-editor" key={pin.id}>
      {pin.reference && <p className="bb-muted">Recorded contact: {pin.reference}</p>}
      <label className="bb-field">Terminal label<input aria-label="Terminal label" maxLength={160} value={pin.label} onChange={e => update({label: e.target.value})}/></label>
      <button className="bb-reference" onClick={() => onMap(pin.id)}><MapPin size={14}/>Place terminal on device</button>
      <p className="bb-muted">Click the device image to place this contact, or enter percentages of its width and height.</p>
      <div className="bb-pin-coordinates">{['x', 'y'].map(axis => <label className="bb-field" key={axis}>Pin {axis.toUpperCase()} (%)<input aria-label={'Pin ' + axis.toUpperCase() + ' (%)'} type="number" min="0" max="100" step="any" key={coordinates[axis]} defaultValue={Number((coordinates[axis] * 100).toFixed(2))} onBlur={e => {
        const value = Number(e.target.value);
        if (e.target.value.trim() && Number.isFinite(value) && value >= 0 && value <= 100) update({position: {...coordinates, [axis]: value / 100}});
        else e.target.value = Number((coordinates[axis] * 100).toFixed(2));
      }} onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}/></label>)}</div>
      {pin.position && <button className="bb-reference" onClick={() => onUpdate(part.pins.map(p => { if (p.id !== pin.id) return p; const {position, ...rest} = p; return rest; }))}>Reset to logical position</button>}
      <button className="bb-remove" onClick={() => { onRemove(pin.id); setEditing(null); }}><Trash2 size={14}/>Remove terminal{attached ? ` & ${attached} wire${attached === 1 ? '' : 's'}` : ''}</button>
    </div>}
  </>;
}
