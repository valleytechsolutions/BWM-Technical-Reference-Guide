import React, {useMemo} from 'react';
import {ArrowUpRight, Check, Download, Info} from 'lucide-react';
import {billOfMaterials, boardMaterials, buildEndpointLabel, buildSheetHtml, holeLabel, inspectWiring, partReferences, wireColorName} from './circuit-bench.mjs';

export default function CircuitBuildGuide({project, onChange, onLocate}) {
  const materials = useMemo(() => billOfMaterials(project), [project]);
  const checks = useMemo(() => inspectWiring(project), [project]);
  const refs = useMemo(() => partReferences(project), [project]);
  const completed = project.wires.filter(w => w.built).length;
  const mounts = project.parts.filter(p => p.mount);
  function download() {
    const url = URL.createObjectURL(new Blob([buildSheetHtml(project)], {type: 'text/html;charset=utf-8'}));
    const a = document.createElement('a'); a.href = url; a.download = `${project.name.replace(/[^a-z\d -]/gi, '').trim() || 'Black-Wire-circuit'}-build-sheet.html`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <div className="bb-build-guide">
    <header className="bb-build-heading"><div><h2>From screen to workbench</h2><p className="bb-muted">Gather the parts, check the layout, and follow each connection.</p></div><button className="bb-reference" onClick={download}><Download size={15}/>Download build sheet</button></header>
    <p className="bb-muted">The build sheet includes a printable diagram, parts list, and wiring checklist. Open the downloaded file to print or save as PDF.</p>
    <h3>1. Gather your parts</h3>
    <div className="bb-materials" role="table" aria-label="Build materials">{boardMaterials(project).map(b => <div role="row" className="bb-material" key={b.reference}><span role="cell" className="bb-quantity">1×</span><span role="cell"><b>{b.name}</b><small>{b.detail}</small></span><span role="cell">{b.reference}</span></div>)}{materials.map(m => <button role="row" className="bb-material" key={m.partIds[0]} onClick={() => onLocate(m.partIds[0])}><span role="cell" className="bb-quantity">{m.quantity}×</span><span role="cell"><b>{m.name}</b><small>{m.detail}</small></span><span role="cell">{m.references.join(', ')}<ArrowUpRight size={12}/></span></button>)}<div role="row" className="bb-material"><span role="cell" className="bb-quantity">{project.wires.length}×</span><span role="cell"><b>Jumper wires</b><small>Choose lengths and connector ends for your physical parts</small></span></div></div>
    <h3>2. Check the connections</h3>
    <div className="bb-layout-checks">{checks.length ? checks.map(c => <button key={c.id} className={c.level} onClick={() => onLocate(c.target)}><Info size={16}/><span>{c.message}</span><ArrowUpRight size={14}/></button>) : <p className="bb-test-success"><Check size={16}/>No shared holes, unwired modeled terminals, bypassed components or device role conflicts found.</p>}</div>
    <p className="bb-muted">Run the DC test for current and voltage checks. Catalog devices still need their exact pinout and electrical limits checked against the reference.</p>
    {!!mounts.length && <><h3>3. Insert the components <span>{mounts.filter(p => p.mount.built).length}/{mounts.length} inserted</span></h3><p className="bb-muted">With power disconnected, insert each lead into its listed hole. Check polarity and pin 1. Positions describe electrical connections; match the footprint to your physical part.</p><div className="bb-mount-steps">{mounts.map(p => <div className={'bb-build-step' + (p.mount.built ? ' complete' : '')} key={p.id}><label><input type="checkbox" aria-label={'Mark ' + refs.get(p.id) + ' inserted'} checked={Boolean(p.mount.built)} onChange={e => onChange({...project, parts: project.parts.map(part => part.id === p.id ? {...part, mount: {...part.mount, built: e.target.checked}} : part)})}/></label><button onClick={() => onLocate(p.id)}><span className="bb-step-title"><b>{refs.get(p.id)} · {p.name}</b><ArrowUpRight size={14}/></span>{p.pins.map(pin => <span key={pin.id}>{pin.label} → {holeLabel(project, p.mount.holes[pin.id])}</span>)}</button></div>)}</div></>}
    <h3>{mounts.length ? '4' : '3'}. Wire your build <span>{completed}/{project.wires.length} installed</span></h3>
    <p className="bb-muted">Assemble with power disconnected. Checkmarks save your progress; they do not verify a physical connection. Reconnecting a wire clears its checkmark.</p>
    {!!project.wires.length && <progress aria-label="Wiring progress" value={completed} max={project.wires.length}/>}
    <div className="bb-build-steps">{project.wires.map((w, i) => <div className={'bb-build-step' + (w.built ? ' complete' : '')} key={w.id}><label><input type="checkbox" checked={Boolean(w.built)} aria-label={'Mark W' + (i + 1) + ' installed'} onChange={e => onChange({...project, wires: project.wires.map(wire => wire.id === w.id ? {...wire, built: e.target.checked} : wire)})}/><span className="sr-only">W{i + 1}</span></label><button onClick={() => onLocate(w.id)}><span className="bb-step-title"><i style={{background: w.color}}/><b>W{i + 1}{w.label ? ' · ' + w.label : ''}</b><small>{wireColorName(w.color)}</small><ArrowUpRight size={14}/></span><span>{buildEndpointLabel(project, w.from, refs)}</span><span className="bb-step-to">→ {buildEndpointLabel(project, w.to, refs)}</span></button></div>)}</div>
    {!project.wires.length && <p className="bb-muted">Add wires to create the assembly checklist.</p>}
    <label className="bb-field bb-build-notes">Build notes<textarea aria-label="Build notes" maxLength={4000} rows={4} placeholder="Part numbers, connector choices, or notes for your bench…" value={project.notes || ''} onChange={e => onChange({...project, notes: e.target.value})}/><small>Saved with this project and included in the build sheet.</small></label>
  </div>;
}
