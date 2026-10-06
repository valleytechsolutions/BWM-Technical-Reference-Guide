import React, {useState} from 'react';
import {Copy, FolderOpen, Trash2, X} from 'lucide-react';

export default function CircuitProjects({workspace, onChoose, onCopy, onDelete, onClose}) {
  const [deleting, setDeleting] = useState(null);
  return <section className="bb-projects-panel" aria-label="Saved circuit projects">
    <header><div><FolderOpen size={18}/><h2>Your circuits</h2><span>{workspace.entries.length}/50 saved locally</span></div><button aria-label="Close saved projects" onClick={onClose}><X size={17}/></button></header>
    <p>Every circuit saves separately. New circuits and imports keep your other projects.</p>
    <div className="bb-project-list">{workspace.entries.map(entry => <article key={entry.id} className={entry.id === workspace.activeId ? 'active' : ''}>
      <button className="bb-project-open" aria-pressed={entry.id === workspace.activeId} onClick={() => { setDeleting(null); onChoose(entry.id); }}><b>{entry.project.name || 'Untitled circuit'}</b><small>{entry.project.parts.length} parts · {entry.project.wires.length} wires{entry.id === workspace.activeId ? ' · Current' : ''}</small></button>
      <button aria-label={'Copy project ' + entry.project.name} title="Save a copy" onClick={() => onCopy(entry.id)}><Copy size={15}/></button>
      <button aria-label={'Delete project ' + entry.project.name} title="Delete project" onClick={() => setDeleting(entry.id)}><Trash2 size={15}/></button>
      {deleting === entry.id && <div className="bb-project-delete"><span>Delete “{entry.project.name}”? Export a copy first if you need it.</span><button onClick={() => setDeleting(null)}>Cancel</button><button onClick={() => { onDelete(entry.id); setDeleting(null); }}>Delete permanently</button></div>}
    </article>)}</div>
  </section>;
}
