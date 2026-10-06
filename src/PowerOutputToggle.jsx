import React from 'react';
import {suggestPowerOut} from './device-library.mjs';

export function powerOutSummary(part) {
  if (!part.powerOut) return '';
  const label = id => part.pins.find(p => p.id === id)?.label || id;
  return [`${label(part.powerOut.ground[0])}${part.powerOut.ground.length > 1 ? ' ×' + part.powerOut.ground.length : ''}`, ...part.powerOut.rails.map(r => `${label(r.pins[0])} ${r.voltage} V`)].join(' · ');
}
// One checkbox: a board on USB supplies its 3V3/5V pins to the circuit, suggested from pin labels and roles.
export default function PowerOutputToggle({part, onChange, onMissing}) {
  return <label className="bb-image-toggle bb-power-out">
    <input type="checkbox" checked={Boolean(part.powerOut)} onChange={e => {
      if (!e.target.checked) { onChange(undefined); return; }
      const suggested = suggestPowerOut(part.pins);
      if (suggested) onChange(suggested); else onMissing();
    }}/>
    <span>Powered over USB<small>{part.powerOut ? `Supplies ${powerOutSummary(part)} to your circuit in the DC test. Check the voltages on your board.` : 'Use the board as the power source: its 3V3 and 5V pins supply your circuit in the DC test.'}</small></span>
  </label>;
}
