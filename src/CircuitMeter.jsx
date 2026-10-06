import React from 'react';
import {ArrowLeftRight, X} from 'lucide-react';
import {endpointLabel} from './breadboard.mjs';
import {measureCircuit} from './circuit-bench.mjs';

export const emptyMeter = () => ({red: null, black: null, active: 'red', mode: 'voltage'});
export default function CircuitMeter({project, meter, result, onChange, onPlace}) {
  const measurement = measureCircuit(project, meter, result);
  return <div className="bb-meter">
    <div className="bb-meter-heading"><h2>Multimeter</h2><div className="bb-meter-modes">{[['voltage', 'DC voltage'], ['continuity', 'Continuity']].map(([mode, label]) => <button key={mode} aria-pressed={meter.mode === mode} onClick={() => onChange({...meter, mode})}>{label}</button>)}</div></div>
    <div className={'bb-meter-display ' + measurement.state} role="status"><strong>{measurement.text}</strong><span>{meter.mode === 'voltage' ? 'Red minus black · ideal voltmeter' : 'Direct paths through wires, breadboard strips and closed switches'}</span></div>
    <div className="bb-meter-leads">{['red', 'black'].map(lead => <button className={'bb-meter-lead ' + lead} key={lead} aria-label={'Place ' + lead + ' meter lead'} aria-pressed={meter.active === lead} onClick={() => onPlace(lead)}><i/><span><b>{lead === 'red' ? 'Red · V' : 'Black · COM'}</b><small>{meter[lead] ? endpointLabel(project, meter[lead]) : 'Select a terminal or hole'}</small></span></button>)}</div>
    <div className="bb-meter-actions"><button onClick={() => onChange({...meter, red: meter.black, black: meter.red})}><ArrowLeftRight size={14}/>Swap leads</button><button onClick={() => onChange({...emptyMeter(), mode: meter.mode})}><X size={14}/>Clear leads</button></div>
    <p className="bb-muted">{meter.mode === 'voltage' ? 'Choose a lead, then click a hole or component terminal. Readings update while the DC test runs. Separate floating circuits have no shared voltage reference.' : 'Stop the DC test to check connectivity. Resistors, LEDs and device internals are not treated as direct connections; this mode does not measure resistance.'}</p>
  </div>;
}
