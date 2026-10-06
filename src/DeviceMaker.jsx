import React, {useEffect, useState} from 'react';
import {ArrowDown, ArrowUp, BookmarkPlus, Cpu, Plus, Sparkles, Trash2, Zap} from 'lucide-react';
import {FOOTPRINT_SPREADS, LIMITS, PIN_ROLES, uid} from './breadboard.mjs';
import {footprintOffsets} from './breadboard-placement.mjs';
import {parsePinLabels, suggestRoles} from './device-library.mjs';
import PinSourceNote from './PinSourceNote.jsx';
import PowerOutputToggle from './PowerOutputToggle.jsx';

function NumberField({label, value, min, max, step = 'any', onCommit, hint}) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  const valid = draft.trim() !== '' && Number.isFinite(Number(draft)) && Number(draft) >= min && Number(draft) <= max;
  return <label className="bb-field">{label}<input type="number" aria-label={label} step={step} min={min} max={max} value={draft} aria-invalid={!valid} onChange={e => setDraft(e.target.value)} onBlur={() => { if (valid && Number(draft) !== value) onCommit(Number(draft)); else if (!valid) setDraft(String(value)); }} onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}/>{!valid ? <small className="bb-invalid">Enter {min}–{max}.</small> : hint && <small>{hint}</small>}</label>;
}
// A small grid showing where each numbered lead lands, relative to pin 1.
function FootprintPreview({part}) {
  const offsets = footprintOffsets(part);
  if (!offsets?.length) return null;
  const rows = offsets.map(o => o[1]), columns = offsets.map(o => o[2]), r0 = Math.min(...rows), c0 = Math.min(...columns);
  const width = (Math.max(...columns) - c0 + 1) * 24 + 8, height = (Math.max(...rows) - r0 + 1) * 24 + 8;
  return <div className="bb-footprint-preview"><svg viewBox={`0 0 ${width} ${height}`} width={Math.min(width, 520)} role="img" aria-label="Package lead layout">{offsets.map(([pin, r, c], i) => { const x = (c - c0) * 24 + 16, y = (r - r0) * 24 + 16; return <g key={pin}><rect x={x - 10} y={y - 10} width="20" height="20" rx="4" className={i ? '' : 'first'}/><text x={x} y={y + 4} textAnchor="middle">{i + 1}</text></g>; })}</svg><small>Numbers follow your terminal order. Pin 1 is highlighted; choose its hole when inserting.</small></div>;
}
export default function DeviceMaker({part, library, librarySaved, onChange, onRemovePin, onSave, onCreate, onLocate}) {
  const [bulk, setBulk] = useState(''), [powerError, setPowerError] = useState('');
  useEffect(() => { setBulk(''); setPowerError(''); }, [part?.id]);
  if (!part || part.type !== 'device') return <div className="bb-device-maker empty"><Cpu size={23}/><h2>Device maker</h2><p className="bb-muted">Define a module or chip once: its terminals, what each one does, how it sits on a breadboard, and how much power it draws. Save it to <b>My devices</b> to reuse it in any circuit.</p><button className="bb-reference" onClick={onCreate}><Plus size={14}/>New custom device</button><p className="bb-muted">Or select a catalog or custom device on the canvas to edit it here.</p></div>;
  const locked = Boolean(part.mount), pins = part.pins, saved = library.devices.find(d => d.id === part.templateId);
  const setPins = next => onChange({pins: next});
  const move = (index, delta) => { const next = [...pins]; [next[index], next[index + delta]] = [next[index + delta], next[index]]; setPins(next); };
  function addBulk() {
    const labels = parsePinLabels(bulk).slice(0, LIMITS.pins - pins.length);
    if (labels.length) { setPins([...pins, ...labels.map(label => ({id: 'p' + uid(), label}))]); setBulk(''); }
  }
  function setPackage(kind) { onChange({footprint: kind === 'none' ? undefined : kind === 'sip' ? {kind: 'sip'} : {kind: 'dual', spread: 1, numbering: 'ccw', ...(part.footprint?.kind === 'dual' ? part.footprint : {})}}); }
  function setPower(changes) {
    const next = {...part.power, ...changes};
    if (next.min > next.max || next.voltage < next.min || next.voltage > next.max) { setPowerError('Keep minimum ≤ nominal ≤ maximum voltage.'); return; }
    if (next.vcc === next.gnd) { setPowerError('Choose different supply and ground terminals.'); return; }
    setPowerError(''); onChange({power: next});
  }
  function enablePower(enabled) {
    if (!enabled) { onChange({power: undefined}); return; }
    const vcc = pins.find(p => p.role === 'power') || pins[0], gnd = pins.find(p => p.role === 'ground' && p !== vcc) || pins.find(p => p !== vcc);
    onChange({power: {vcc: vcc.id, gnd: gnd.id, voltage: 3.3, min: 3, max: 3.6, current: 50}});
  }
  return <div className="bb-device-maker">
    <header className="bb-build-heading"><div><h2>Device maker</h2><p className="bb-muted">Editing <button className="bb-link" onClick={() => onLocate(part.id)}>{part.name}</button>. Changes apply to this circuit; save to reuse them elsewhere.</p></div><button className="bb-reference" onClick={onSave}><BookmarkPlus size={15}/>{saved ? 'Update in My devices' : 'Save to My devices'}</button></header>
    {librarySaved && <p className="bb-test-success" role="status">{librarySaved}</p>}
    <PinSourceNote source={part.pinSource}/>
    <div className="bb-device-grid">
      <section>
        <h3>Identity</h3>
        <label className="bb-field">Device name<input aria-label="Device name" maxLength={200} value={part.name} onChange={e => onChange({name: e.target.value})}/></label>
        <label className="bb-field">Revision / part number<input aria-label="Revision / part number" maxLength={2000} value={part.revision || ''} placeholder="e.g. ESP32-DevKitC V4" onChange={e => onChange({revision: e.target.value})}/></label>
        <h3>Breadboard package</h3>
        {locked && <p className="bb-muted">Lift the device from the breadboard to change its package or terminal order.</p>}
        <label className="bb-field">Package<select aria-label="Package" disabled={locked} value={part.footprint?.kind || 'none'} onChange={e => setPackage(e.target.value)}><option value="none">Off-board · connect with wires</option><option value="sip">Single row header (SIP)</option><option value="dual">Dual row · DIP chip or module</option></select></label>
        {part.footprint?.kind === 'dual' && <div className="bb-pin-coordinates">
          <label className="bb-field">Rows<select aria-label="Package rows" disabled={locked} value={part.footprint.spread} onChange={e => onChange({footprint: {...part.footprint, spread: Number(e.target.value)}})}>{Object.entries(FOOTPRINT_SPREADS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="bb-field">Numbering<select aria-label="Pin numbering" disabled={locked} value={part.footprint.numbering} onChange={e => onChange({footprint: {...part.footprint, numbering: e.target.value}})}><option value="ccw">Around the chip (DIP)</option><option value="rows">Row by row (headers)</option></select></label>
        </div>}
        {!part.footprint && /^(\S+) \((\d+)\), (\S+) \(\2\)$/.test(part.pinSource?.connectors || '') && <p className="bb-muted">Two equal headers were loaded in order. For a breadboard, choose <b>Dual row</b> with <b>Row by row</b> numbering and the row spacing that matches your board.</p>}
        {part.footprint && pins.length > 0 && <FootprintPreview part={part}/>}
        {part.footprint && !pins.length && <p className="bb-muted">Add terminals to define the package.</p>}
        <h3>USB power output</h3>
        <PowerOutputToggle part={part} onChange={powerOut => onChange({powerOut})} onMissing={() => setPowerError('Give the board terminals labelled GND and 3V3 or 5V, or set their roles to Ground and Power in, first.')}/>
        {part.powerOut && <div className="bb-pin-coordinates">{part.powerOut.rails.map((rail, i) => <NumberField key={rail.pins[0]} label={`${pins.find(p => p.id === rail.pins[0])?.label || 'Rail'} output (V)`} value={rail.voltage} min={.1} max={48} onCommit={voltage => onChange({powerOut: {...part.powerOut, rails: part.powerOut.rails.map((r, j) => j === i ? {...r, voltage} : r)}})}/>)}</div>}
        <h3>Power profile</h3>
        <label className="bb-image-toggle"><input type="checkbox" disabled={pins.length < 2} checked={Boolean(part.power)} onChange={e => enablePower(e.target.checked)}/>Model its supply current and voltage limits</label>
        {part.power ? <>
          <div className="bb-pin-coordinates">
            <label className="bb-field">Supply terminal<select aria-label="Supply terminal" value={part.power.vcc} onChange={e => setPower({vcc: e.target.value})}>{pins.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}</select></label>
            <label className="bb-field">Ground terminal<select aria-label="Ground terminal" value={part.power.gnd} onChange={e => setPower({gnd: e.target.value})}>{pins.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}</select></label>
            <NumberField label="Minimum (V)" value={part.power.min} min={0} max={48} onCommit={min => setPower({min})}/>
            <NumberField label="Maximum (V)" value={part.power.max} min={0} max={48} onCommit={max => setPower({max})}/>
            <NumberField label="Nominal (V)" value={part.power.voltage} min={0} max={48} onCommit={voltage => setPower({voltage})}/>
            <NumberField label="Current draw (mA)" value={part.power.current} min={0} max={2000} onCommit={current => setPower({current})}/>
          </div>
          {powerError && <small className="bb-invalid" role="alert">{powerError}</small>}
          <p className="bb-muted"><Zap size={12}/> The DC test draws this current as a resistor at the nominal voltage, flags supply voltage outside your range, and warns when an input, GPIO, analog or bus terminal sees more than the maximum. Use the exact datasheet values; nothing is inferred.</p>
        </> : <p className="bb-muted">Off: the device is a wiring plan only and draws no current in the DC test.</p>}
      </section>
      <section>
        <h3>Terminals <span>{pins.length}/{LIMITS.pins}</span></h3>
        <div className="bb-pin-table" role="table" aria-label="Device terminals">
          {pins.map((pin, i) => <div role="row" key={pin.id} className="bb-pin-row">
            <span role="cell" className="bb-pin-number">{i + 1}</span>
            <input role="cell" aria-label={`Terminal ${i + 1} label`} maxLength={160} value={pin.label} onChange={e => setPins(pins.map(p => p.id === pin.id ? {...p, label: e.target.value} : p))}/>
            <select role="cell" aria-label={`Terminal ${i + 1} role`} value={pin.role || ''} onChange={e => setPins(pins.map(p => { if (p.id !== pin.id) return p; const {role, ...rest} = p; return e.target.value ? {...rest, role: e.target.value} : rest; }))}>{Object.entries(PIN_ROLES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
            <span role="cell" className="bb-pin-actions"><button aria-label={`Move terminal ${i + 1} up`} disabled={locked || !i} onClick={() => move(i, -1)}><ArrowUp size={13}/></button><button aria-label={`Move terminal ${i + 1} down`} disabled={locked || i === pins.length - 1} onClick={() => move(i, 1)}><ArrowDown size={13}/></button><button aria-label={`Remove terminal ${pin.label}`} disabled={locked} onClick={() => onRemovePin(pin.id)}><Trash2 size={13}/></button></span>
          </div>)}
          {!pins.length && <p className="bb-muted">No terminals yet. Paste the labels from the device's pinout, in pin order.</p>}
        </div>
        <button className="bb-reference" disabled={!pins.some(p => !p.role)} onClick={() => setPins(suggestRoles(pins))}><Sparkles size={14}/>Suggest roles from labels</button>
        <p className="bb-muted">Suggestions only fill unassigned roles from common names such as GND, VCC, SDA or GPIO4. Check each one against the exact reference.</p>
        <label className="bb-field bb-build-notes">Add terminals<textarea aria-label="Add terminals" rows={3} disabled={locked || pins.length >= LIMITS.pins} placeholder={'One per line or comma-separated, in pin order:\nVCC, GND, SCL, SDA'} value={bulk} onChange={e => setBulk(e.target.value)}/></label>
        <button className="bb-reference" disabled={locked || !parsePinLabels(bulk).length || pins.length >= LIMITS.pins} onClick={addBulk}><Plus size={14}/>Add {parsePinLabels(bulk).length || ''} terminal{parsePinLabels(bulk).length === 1 ? '' : 's'}</button>
      </section>
    </div>
  </div>;
}
