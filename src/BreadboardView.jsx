import React, {useEffect, useMemo, useRef, useState} from 'react';
import {CircuitBoard, Plus, Search, Play, Square, Undo2, Redo2, Download, Upload, Trash2, Minus, Maximize2, MousePointer2, Cable, Lightbulb, Zap, ToggleLeft, Cpu, X, Check, Info, ArrowUpRight, RotateCw, Copy, FolderOpen, SlidersHorizontal, Hand, Gauge, CornerDownRight, ArrowRightToLine, Battery, CircleDot, Triangle, Volume2, LayoutGrid, Wrench} from 'lucide-react';
import {Kicker} from './Theme.jsx';
import {normalize} from './domain.mjs';
import {WIRE_COLORS, LIMITS, PARTS, uid, emptyProject, createPart, validateProject, ledExample, dimmerExample, partSize, partBounds, mountedGeometry, mountKind, worldToLocal, endpointPosition, endpointLabel, circuitNets, simulateCircuit, duplicatePart, removeTerminal, reconnectWire, wirePath, insertWireBend} from './breadboard.mjs';
import {boardLayout, boardsExtent, findHole, holeCode, offsetHole, projectBoards, projectHoles} from './breadboard-boards.mjs';
import {holeOccupants, assertMountHole, footprintHoles, mountPart, unmountPart, shiftMountedPart, rotateMountedPart, dragMountedPart, insertedLedExample, transistorExample, addBoard, updateBoard, removeBoard} from './breadboard-placement.mjs';
import {PROJECTS_KEY, loadWorkspace, activeProject, updateActiveProject, addProject, deleteProject} from './circuit-projects.mjs';
import {LIBRARY_KEY, loadLibrary, saveTemplate, removeTemplate, partFromTemplate, mergeLibrary} from './device-library.mjs';
import BreadboardPart, {referenceArtwork} from './BreadboardPart.jsx';
import BreadboardBoard from './BreadboardBoard.jsx';
import BoardSettings from './BoardSettings.jsx';
import DeviceMaker from './DeviceMaker.jsx';
import {pinStatus, splitByPins} from './catalog-pins.mjs';
import {loadPinConnectors, withPinConnectors} from './pin-data.mjs';
import PinSourceNote from './PinSourceNote.jsx';
import PowerOutputToggle from './PowerOutputToggle.jsx';
import CircuitProjects from './CircuitProjects.jsx';
import CircuitTerminals from './CircuitTerminals.jsx';
import CircuitMeter, {emptyMeter} from './CircuitMeter.jsx';
import CircuitBuildGuide from './CircuitBuildGuide.jsx';
import {measureCircuit, partReferences, partSpecification} from './circuit-bench.mjs';
import './breadboard.css';

const icons = {supply: Zap, resistor: Cable, led: Lightbulb, diode: ArrowRightToLine, capacitor: Battery, switch: ToggleLeft, button: CircleDot, device: Cpu, potentiometer: SlidersHorizontal, npn: Triangle, pnp: Triangle, buzzer: Volume2};
const display = (value, digits = 2) => Number.isFinite(value) ? Number(value.toFixed(digits)).toString() : '—';
const activate = action => event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); action(); } };
function download(name, data) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'}));
  const a = document.createElement('a'); a.href = url; a.download = `${name.replace(/[^a-z\d -]/gi, '').trim() || 'Black-Wire-circuit'}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const storage = {getItem: key => localStorage.getItem(key)};

export default function BreadboardView({catalog, requestedDevice, onDeviceHandled, onOpenReference}) {
  const [initial] = useState(() => loadWorkspace(storage)), [workspace, setWorkspace] = useState(initial.workspace);
  const project = activeProject(workspace);
  const setProject = next => setWorkspace(current => updateActiveProject(current, next));
  const [saveState, setSaveState] = useState(initial.blocked ? 'blocked' : 'saved');
  const saveBlocked = useRef(initial.blocked), lastSaved = useRef(initial.baseline), undo = useRef([]), redo = useRef([]);
  const [initialLibrary] = useState(() => loadLibrary(storage)), [library, setLibrary] = useState(initialLibrary.library), libraryBlocked = useRef(initialLibrary.blocked), [librarySaved, setLibrarySaved] = useState('');
  const [historyTick, setHistoryTick] = useState(0), [selection, setSelection] = useState(null), [pending, setPending] = useState(null);
  const [running, setRunning] = useState(false), [color, setColor] = useState(WIRE_COLORS[0]), [zoom, setZoom] = useState(() => window.innerWidth < 700 ? 2 : 1);
  const [query, setQuery] = useState(''), [showCatalog, setShowCatalog] = useState(false), [message, setMessage] = useState('');
  const [hover, setHover] = useState(null), [probe, setProbe] = useState(null), [tool, setTool] = useState('wire'), [focusedHole, setFocusedHole] = useState('a1');
  const [stageWidth, setStageWidth] = useState(800), [stageHeight, setStageHeight] = useState(600), [newPin, setNewPin] = useState('');
  const [showProjects, setShowProjects] = useState(false), [reconnecting, setReconnecting] = useState(null), [mapping, setMapping] = useState(null), [expanded, setExpanded] = useState(false), [bottomTab, setBottomTab] = useState('test');
  const [meter, setMeter] = useState(emptyMeter);
  const [mounting, setMounting] = useState(null);
  const input = useRef(null), libraryInput = useRef(null), stage = useRef(null), svg = useRef(null), drag = useRef(null), lastRequest = useRef(null);
  const selectedPart = project.parts.find(p => p.id === selection), selectedWire = project.wires.find(w => w.id === selection);
  const selectedBoard = selection?.startsWith('board:') ? selection.slice(6) : null;
  const result = useMemo(() => running ? simulateCircuit(project) : null, [project, running]);
  const nets = useMemo(() => circuitNets(project), [project]);
  const occupied = useMemo(() => holeOccupants(project), [project]);
  const references = useMemo(() => partReferences(project), [project]);
  const holes = projectHoles(project), boards = projectBoards(project);
  const measurement = tool === 'meter' ? measureCircuit(project, meter, result) : null;
  const highlighted = hover || pending || selectedWire?.from || (tool === 'meter' && meter[meter.active]);
  const highlightedNet = highlighted ? nets.find(highlighted) : null;
  const mountingPart = mounting && project.parts.find(p => p.id === mounting.partId), footprintMode = mountingPart && mountKind(mountingPart) !== 'pair';
  const records = useMemo(() => [
    ...catalog.boards.map(record => ({record, kind: 'board'})),
    ...(catalog.makerParts || []).map(record => ({record, kind: 'maker'})),
  ], [catalog]);
  const recordMap = useMemo(() => new Map(records.map(({record, kind}) => [kind + ':' + record.id, record])), [records]);
  const selectedRecord = selectedPart && recordMap.get(selectedPart.recordKind + ':' + selectedPart.recordId);
  // Catalog records split into those that arrive with terminals and those that need them added by hand.
  const catalogGroups = useMemo(() => {
    const words = query.split(/\s+/).map(normalize).filter(Boolean);
    return splitByPins(records.filter(({record}) => { const text = normalize([record.name, record.brand, record.processor, ...(record.aliases || [])].join(' ')); return words.every(w => text.includes(w)); }));
  }, [records, query]);
  const [pinFilter, setPinFilter] = useState('ready');
  const matches = (pinFilter === 'ready' ? catalogGroups.ready : catalogGroups.missing).slice(0, 30);
  const savedDevices = useMemo(() => { const words = query.split(/\s+/).map(normalize).filter(Boolean); return library.devices.filter(d => words.every(w => normalize(d.name + ' ' + d.revision).includes(w))); }, [library, query]);
  // While inserting a footprint part, the hovered hole previews every lead at the current rotation.
  const preview = useMemo(() => {
    if (!footprintMode || !hover?.startsWith('hole:')) return null;
    try { const placed = footprintHoles(project, mountingPart, hover.slice(5), mounting.turns || 0); return {holes: Object.values(placed), blocked: Object.values(placed).some(h => (occupied.get(h) || []).some(item => item.id !== mountingPart.id))}; }
    catch { return {holes: [hover.slice(5)], blocked: true}; }
  }, [footprintMode, hover, project, mounting, occupied]);

  useEffect(() => {
    if (saveBlocked.current) return;
    try {
      if (localStorage.getItem(PROJECTS_KEY) !== lastSaved.current) { saveBlocked.current = true; setSaveState('conflict'); return; }
      const data = JSON.stringify(workspace); localStorage.setItem(PROJECTS_KEY, data); lastSaved.current = data; setSaveState('saved');
    }
    catch { setSaveState('failed'); }
  }, [workspace]);
  useEffect(() => { if (!libraryBlocked.current) try { localStorage.setItem(LIBRARY_KEY, JSON.stringify(library)); } catch { /* the library stays usable for this session */ } }, [library]);
  useEffect(() => {
    const handler = e => { if ((e.key === PROJECTS_KEY || e.key === null) && e.newValue !== lastSaved.current) { saveBlocked.current = true; setSaveState('conflict'); } };
    window.addEventListener('storage', handler); return () => window.removeEventListener('storage', handler);
  }, []);
  useEffect(() => {
    const observer = new ResizeObserver(entries => { setStageWidth(entries[0].contentRect.width); setStageHeight(entries[0].contentRect.height); });
    observer.observe(stage.current); return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!requestedDevice || lastRequest.current === requestedDevice) return;
    lastRequest.current = requestedDevice; addPart('device', requestedDevice.record, requestedDevice.kind); onDeviceHandled();
  }, [requestedDevice]);
  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') { setPending(null); setReconnecting(null); setMapping(null); setMounting(null); setSelection(null); }
      if (e.target.closest('input, textarea, select, dialog')) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); travel(e.shiftKey ? 'redo' : 'undo'); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd' && selectedPart) { e.preventDefault(); copyPart(); }
      if (e.key.toLowerCase() === 'r' && !e.ctrlKey && !e.metaKey) {
        if (footprintMode) { e.preventDefault(); setMounting(m => ({...m, turns: ((m.turns || 0) + 1) % 4})); }
        else if (selectedPart) { e.preventDefault(); rotatePart(); }
      }
      if (e.key === 'Delete' || e.key === 'Backspace') { if (selection) { e.preventDefault(); removeSelected(); } }
    };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [project, selection, historyTick, workspace.activeId, mounting]);
  function remember(previous) { undo.current = [...undo.current.slice(-39), previous]; redo.current = []; setHistoryTick(t => t + 1); }
  function change(next, {keepRunning = false} = {}) {
    remember(project); setProject(typeof next === 'function' ? next(project) : next); if (!keepRunning) setRunning(false); setMessage(''); setMounting(null);
  }
  const attempt = action => { try { action(); } catch (error) { setMessage(error.message); } };
  function travel(direction) {
    const source = direction === 'undo' ? undo : redo, target = direction === 'undo' ? redo : undo;
    if (!source.current.length) return;
    target.current.push(project); setProject(source.current.pop()); setHistoryTick(t => t + 1); setRunning(false); resetTools(); setMessage('');
  }
  function resetTools() { setSelection(null); setPending(null); setProbe(null); setReconnecting(null); setMapping(null); setHover(null); setMeter(emptyMeter()); setMounting(null); }
  function resetHistory() { undo.current = []; redo.current = []; setHistoryTick(t => t + 1); setRunning(false); resetTools(); }
  function replace(next) { try { const updated = addProject(workspace, next); setWorkspace(updated); resetHistory(); setMessage(''); } catch (error) { setMessage(error.message); } }
  function chooseProject(id) { if (workspace.activeId === id) return; setWorkspace({...workspace, activeId: id}); resetHistory(); setMessage(''); }
  function copyProject(id) { const entry = workspace.entries.find(e => e.id === id); replace({...structuredClone(entry.project), name: (entry.project.name + ' copy').slice(0, 200)}); }
  function removeProject(id) { setWorkspace(deleteProject(workspace, id)); if (id === workspace.activeId) resetHistory(); }
  function copyPart() { attempt(() => { const next = duplicatePart(project, selection); change(next.project); setSelection(next.id); setPending(null); setMapping(null); }); }
  function rotatePart() {
    if (!selectedPart.mount) { updatePart(selectedPart.id, {rotation: ((selectedPart.rotation || 0) + 90) % 360}, true); return; }
    if (mountKind(selectedPart) === 'pair') beginMount(selectedPart);
    else attempt(() => change(rotateMountedPart(project, selectedPart.id)));
  }
  function beginMount(part) {
    if (!mountKind(part)) { setSelection(part.id); setBottomTab('device'); setMessage('Choose a breadboard package for this device in the device maker, then insert it.'); return; }
    setMounting({partId: part.id, first: null, turns: 0}); setSelection(part.id); setTool('wire'); setPending(null); setReconnecting(null); setMapping(null); setMessage(''); stage.current.scrollIntoView({block: 'center'});
  }
  function nudgePart(part, delta) {
    if (part.mount) attempt(() => change(shiftMountedPart(project, part.id, delta[0], delta[1])));
    else updatePart(part.id, {x: Math.max(0, Math.min(LIMITS.coordinate, part.x + delta[0])), y: Math.max(0, Math.min(LIMITS.coordinate, part.y + delta[1]))}, true);
  }
  function insertPart(part) {
    if (project.parts.length >= LIMITS.parts) { setMessage('This circuit has reached the 60-part limit.'); return; }
    change({...project, parts: [...project.parts, part]}); setSelection(part.id); setPending(null); setNewPin('');
  }
  useEffect(() => { loadPinConnectors(); }, []);
  function addPart(type, record, kind) {
    // Catalog boards with transcribed pins get their full pin list before the part is created.
    if (type === 'device' && record?.pinCount && !record.pinConnectors) { loadPinConnectors().then(pins => addPart(type, withPinConnectors(record, pins), kind)); return; }
    attempt(() => {
      const part = createPart(type, project.parts.length, record, kind);
      if (type === 'device') part.referenceImage = Boolean(referenceArtwork(record));
      insertPart(part);
    });
  }
  function updatePart(id, changes, keepRunning = false) { change({...project, parts: project.parts.map(p => p.id === id ? {...p, ...changes} : p)}, {keepRunning}); }
  // Momentary presses update the live test without entering undo history.
  function pressButton(id, down) { setProject(current => ({...current, parts: current.parts.map(p => p.id === id && p.closed !== down ? {...p, closed: down} : p)})); }
  function removeSelected() {
    if (selectedBoard) { if (selectedBoard !== 'main') removeBoardById(selectedBoard); return; }
    change({...project, parts: project.parts.filter(p => p.id !== selection), wires: project.wires.filter(w => w.id !== selection && !w.from.startsWith(selection + ':') && !w.to.startsWith(selection + ':'))});
    resetTools();
  }
  function selectBoard(id) { setSelection('board:' + id); setPending(null); setMounting(null); setReconnecting(null); setMapping(null); }
  function addBoardOfSize(size) { attempt(() => { const next = addBoard(project, size); change(next.project); selectBoard(next.id); }); }
  function removeBoardById(id) { attempt(() => { change(removeBoard(project, id)); selectBoard('main'); }); }
  function saveDevice(part) {
    attempt(() => {
      const saved = saveTemplate(library, part); setLibrary(saved.library);
      if (part.templateId !== saved.id) updatePart(part.id, {templateId: saved.id}, true);
      setLibrarySaved(`${part.name} saved to My devices.`); setTimeout(() => setLibrarySaved(''), 4000);
    });
  }
  function holeForEndpoint(endpoint) { const [id, pin] = endpoint.split(':'); return id === 'hole' ? endpoint.slice(5) : project.parts.find(p => p.id === id)?.mount?.holes[pin]; }
  function terminal(endpoint) {
    if (mounting) {
      const hole = holeForEndpoint(endpoint);
      try {
        if (footprintMode) { change(mountPart(project, mounting.partId, footprintHoles(project, mountingPart, hole, mounting.turns))); setSelection(mounting.partId); setMounting(null); setHover(null); return; }
        assertMountHole(project, mounting.partId, hole);
        if (!mounting.first) { setMounting({...mounting, first: hole}); setMessage(''); }
        else { const next = mountPart(project, mounting.partId, mounting.first, hole); change(next); setSelection(mounting.partId); setMounting(null); setHover(null); }
      } catch (error) { setMessage(error.message); }
      return;
    }
    if (reconnecting) {
      try { change(reconnectWire(project, reconnecting.wireId, reconnecting.end, endpoint)); setSelection(reconnecting.wireId); setReconnecting(null); }
      catch { setMessage('That endpoint would create a duplicate or self-connected wire. Choose another terminal.'); }
      return;
    }
    if (tool === 'meter') { setMeter(current => ({...current, [current.active]: endpoint, active: current.active === 'red' ? 'black' : 'red'})); return; }
    if (tool === 'probe') { setProbe(endpoint); return; }
    if (!pending) { setPending(endpoint); setSelection(null); return; }
    if (pending === endpoint) { setPending(null); return; }
    if (project.wires.some(w => w.from === pending && w.to === endpoint || w.to === pending && w.from === endpoint)) { setMessage('Those terminals are already connected by a wire.'); setPending(null); return; }
    if (project.wires.length >= LIMITS.wires) { setMessage('This circuit has reached the 400-wire limit.'); setPending(null); return; }
    const wire = {id: uid(), from: pending, to: endpoint, color, points: [], label: ''};
    change({...project, wires: [...project.wires, wire]}); setPending(null); setSelection(wire.id);
  }
  async function readJson(event, limit) {
    const file = event.target.files?.[0]; event.target.value = ''; if (!file) return null;
    if (file.size > limit) throw new Error(`Files must be smaller than ${limit / 1024 / 1024} MB.`);
    return JSON.parse(await file.text());
  }
  async function importFile(event) {
    try { const data = await readJson(event, 2 * 1024 * 1024); if (!data) return; const next = validateProject(data); const updated = addProject(workspace, next); setWorkspace(updated); resetHistory(); setMessage('Circuit imported as a separate project. Your previous circuits are still saved.'); }
    catch (error) { setMessage(`Import failed: ${error.message} Your current circuit is unchanged.`); }
  }
  async function importLibrary(event) {
    try { const data = await readJson(event, 2 * 1024 * 1024); if (!data) return; const merged = mergeLibrary(library, data); setLibrary(merged); setMessage(`Imported ${data.devices.length} device${data.devices.length === 1 ? '' : 's'} into My devices.`); }
    catch (error) { setMessage(`Device import failed: ${error.message} My devices is unchanged.`); }
  }
  function point(event) {
    const p = svg.current.createSVGPoint(); p.x = event.clientX; p.y = event.clientY;
    return p.matrixTransform(svg.current.getScreenCTM().inverse());
  }
  function startDrag(event, part) {
    if (event.button !== 0) return;
    event.preventDefault(); setSelection(part.id); setPending(null); setReconnecting(null); setMounting(null);
    const p = point(event); drag.current = {kind: part.mount ? 'mount' : 'part', id: part.id, origin: p, dx: p.x - part.x, dy: p.y - part.y, snapshot: project, width: worldWidth, height: canvasHeight};
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function startBoardDrag(event, board) {
    if (event.button !== 0 || mounting || tool !== 'wire') return;
    event.preventDefault(); selectBoard(board.id);
    const p = point(event); drag.current = {kind: 'board', id: board.id, dx: p.x - board.x, dy: p.y - board.y, snapshot: project, width: worldWidth, height: canvasHeight};
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function moveDrag(event) {
    if (!drag.current) return;
    const d = drag.current;
    if (d.kind === 'pan') { stage.current.scrollLeft = d.left - (event.clientX - d.x); stage.current.scrollTop = d.top - (event.clientY - d.y); return; }
    const p = point(event), x = Math.max(0, Math.min(d.kind === 'bend' ? 4000 : LIMITS.coordinate, Math.round((p.x - (d.dx || 0)) / 5) * 5)), y = Math.max(0, Math.min(d.kind === 'bend' ? 4000 : LIMITS.coordinate, Math.round((p.y - (d.dy || 0)) / 5) * 5));
    if (d.kind === 'mount') { try { const next = dragMountedPart(d.snapshot, d.id, {x: p.x - d.origin.x, y: p.y - d.origin.y}); setProject(next); if (next !== d.snapshot) setRunning(false); setMessage(''); } catch (error) { setMessage(error.message); } return; }
    if (d.kind === 'board') setProject(current => ({...current, boards: projectBoards(current).map(b => b.id === d.id ? {...b, x, y} : b)}));
    else if (d.kind === 'bend') setProject(current => ({...current, wires: current.wires.map(w => w.id === d.id ? {...w, points: w.points.map((p, i) => i === d.index ? {x, y} : p)} : w)}));
    else setProject(current => ({...current, parts: current.parts.map(part => part.id === d.id ? {...part, x, y} : part)}));
  }
  function endDrag() { if (!drag.current) return; const previous = drag.current.snapshot; drag.current = null; if (previous && JSON.stringify(project) !== JSON.stringify(previous)) remember(previous); }
  function startBend(event, wire, index) { event.preventDefault(); event.stopPropagation(); drag.current = {kind: 'bend', id: wire.id, index, snapshot: project, width: worldWidth, height: canvasHeight}; event.currentTarget.setPointerCapture(event.pointerId); }
  function addBend(wire, position) { attempt(() => change(insertWireBend(project, wire.id, position), {keepRunning: true})); }
  function mapTerminal(event, part) {
    const local = worldToLocal(part, point(event)), size = partSize(part);
    updatePart(part.id, {pins: part.pins.map(pin => pin.id === mapping.pinId ? {...pin, position: {x: Math.max(0, Math.min(1, local.x / size.width)), y: Math.max(0, Math.min(1, local.y / size.height))}} : pin)}, true);
    setMapping(null);
  }
  function placeMeterLead(lead) { setMeter(current => ({...current, active: lead})); setTool('meter'); setPending(null); setReconnecting(null); setMapping(null); setSelection(null); setMounting(null); }
  function locateItem(id) {
    setSelection(id); setPending(null); setReconnecting(null); setMapping(null); setMounting(null); setTool('wire');
    const part = project.parts.find(p => p.id === id), wire = project.wires.find(w => w.id === id);
    const center = part ? part.mount ? mountedGeometry(project, part) : {x: part.x + partBounds(part).width / 2, y: part.y + partBounds(part).height / 2} : wire ? endpointPosition(project, wire.from) : null;
    stage.current.scrollIntoView({block: 'center'});
    if (center) { const scale = unit; stage.current.scrollTo({left: Math.max(0, center.x * scale - stageWidth / 2), top: Math.max(0, center.y * scale - stage.current.clientHeight / 2)}); }
  }
  const free = project.parts.filter(p => !p.mount), extent = boardsExtent(project), main = boards.find(b => b.id === 'main'), mainLayout = boardLayout(main);
  // 1200 world units span the stage at 100%. The world is at least as large as what is visible, so zooming
  // out reveals more workspace instead of shrinking a fixed drawing; content can extend it further.
  const unit = Math.max(1, stageWidth) * zoom / 1200;
  const canvasHeight = drag.current?.height || Math.min(LIMITS.coordinate + 1000, Math.max(880, Math.ceil(stageHeight / unit), extent.y + 35, ...free.map(p => p.y + partBounds(p).height + 35), ...project.wires.flatMap(w => (w.points || []).map(p => p.y + 35))));
  const worldWidth = drag.current?.width || Math.min(LIMITS.coordinate + 1000, Math.max(1200, Math.ceil(stageWidth / unit), extent.x + 35, ...free.map(p => p.x + partBounds(p).width + 35), ...project.wires.flatMap(w => (w.points || []).map(p => p.x + 35))));
  const canvasWidth = worldWidth * unit;
  function terminalProps(endpoint) {
    return {role: 'button', tabIndex: 0, 'aria-label': endpointLabel(project, endpoint), 'aria-pressed': pending === endpoint, 'data-net-active': Boolean(highlightedNet && nets.find(endpoint) === highlightedNet),
      onClick: e => { e.stopPropagation(); terminal(endpoint); }, onKeyDown: activate(() => terminal(endpoint)),
      onPointerEnter: () => setHover(endpoint), onPointerLeave: () => setHover(null)};
  }
  function holeKey(event, hole) {
    const delta = {ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0]}[event.key];
    if (!delta) { activate(() => terminal('hole:' + hole.id))(event); return; }
    event.preventDefault(); event.stopPropagation();
    const next = offsetHole(project, hole.id, delta[0], delta[1]) || hole.id;
    const target = svg.current.querySelector(`[data-hole="${next}"]`); target?.focus();
    target?.scrollIntoView({block: 'nearest', inline: 'nearest'});
  }
  const holeClass = h => (highlightedNet && nets.find('hole:' + h.id) === highlightedNet ? 'connected ' : '') + (occupied.has(h.id) ? 'occupied' : '');
  const strip = h => h.rail ? 'continuous rail' + (boardLayout(boards.find(b => b.id === h.board)).split ? ' half' : '') : 'abcde'.includes(h.row) ? 'A–E' : 'F–J';
  const holeTargets = <g className="bb-hole-targets">{holes.map(h => <circle key={h.id} {...terminalProps('hole:' + h.id)} tabIndex={focusedHole === h.id ? 0 : -1} data-hole={h.id} data-occupied={occupied.has(h.id)} onFocus={() => { setFocusedHole(h.id); setHover('hole:' + h.id); }} onBlur={() => setHover(null)} onKeyDown={e => holeKey(e, h)} className="bb-hole-target" cx={h.x} cy={h.y} r="10" fill="transparent"><title>{holeCode(h.id)}{occupied.has(h.id) ? ' · Occupied: ' + occupied.get(h.id).map(item => item.label).join(', ') : ' · Free hole'} · {strip(h)} connected{result?.voltages['hole:' + h.id] != null ? ` · ${display(result.voltages['hole:' + h.id])} V` : ''}</title></circle>)}</g>;
  const mountBanner = !mountingPart ? '' : footprintMode ? `Choose the hole for pin 1 (${mountingPart.pins[0]?.label}). The preview shows all ${mountingPart.pins.length} leads; press R to rotate it.` : mounting.first ? `First lead: ${holeCode(mounting.first)}. Choose the second hole.` : `Choose the first hole for lead 1 (${mountingPart.pins[0].label}${mountingPart.type === 'led' ? ', anode +' : ''}), then the second for lead 2 (${mountingPart.pins[1].label}${mountingPart.type === 'led' ? ', cathode −' : ''}).`;
  const def = selectedPart && PARTS[selectedPart.type];
  return <div className={'bb-page' + (expanded ? ' bb-expanded' : '')}>
    <header className="page-header bb-header"><div><Kicker>Build & test</Kicker><h1>Breadboard & device maker</h1><p>Lay out an idea on one or more breadboards, define your own devices, and test a DC circuit before taking it to your bench.</p></div><span className="bb-preview"><span/>DC lab · Preview</span></header>
    <div className="bb-project-bar">
      <div className="bb-project-name"><CircuitBoard size={20}/><label><span className="sr-only">Circuit name</span><input aria-label="Circuit name" maxLength={200} value={project.name} onChange={e => change({...project, name: e.target.value})}/></label><span className={'bb-save ' + saveState}>{saveState === 'saved' ? <><Check size={12}/>Saved locally</> : 'Export to keep changes'}</span></div>
      <div className="bb-actions"><button aria-expanded={showProjects} onClick={() => setShowProjects(!showProjects)}><FolderOpen size={15}/>Projects <span>{workspace.entries.length}</span></button><button onClick={() => replace(emptyProject())}><Plus size={15}/>New</button><button onClick={() => input.current.click()}><Upload size={15}/>Import</button><button onClick={() => download(project.name, project)}><Download size={15}/>Export</button><input type="file" ref={input} accept="application/json,.json" hidden aria-label="Import circuit file" onChange={importFile}/></div>
    </div>
    {showProjects && <CircuitProjects workspace={workspace} onChoose={chooseProject} onCopy={copyProject} onDelete={removeProject} onClose={() => setShowProjects(false)}/>}
    {saveState !== 'saved' && <p className="bb-notice" role="alert">{saveState === 'blocked' ? 'Saved circuit data could not be read. Automatic saving is paused to preserve it.' : saveState === 'conflict' ? 'Another tab changed the saved projects. Automatic saving is paused to preserve both versions. Export this circuit before reloading.' : 'Local storage is unavailable.'} Export your circuit to keep this work.</p>}
    {libraryBlocked.current && <p className="bb-notice" role="alert">Saved devices could not be read. My devices is not being saved, to preserve the original data.</p>}
    {message && <div className="bb-notice" role="status"><Info size={16}/>{message}<button aria-label="Dismiss circuit message" onClick={() => setMessage('')}><X size={15}/></button></div>}
    <div className="bb-layout">
      <aside className="bb-palette" aria-label="Component library">
        <div className="bb-panel-title"><span>COMPONENTS</span><span>{project.parts.length}/{LIMITS.parts}</span></div>
        <div className="bb-palette-tabs"><button aria-pressed={!showCatalog} onClick={() => setShowCatalog(false)}>Simulated</button><button aria-pressed={showCatalog} onClick={() => setShowCatalog(true)}>Your catalog</button></div>
        {!showCatalog ? <>
          <p className="bb-muted">Start with a part. Connect any two terminals to add a wire.</p>
          <div className="bb-parts">{Object.entries(PARTS).map(([type, part]) => { const Icon = icons[type]; return <button key={type} aria-label={'Add ' + part.name} title={part.detail} onClick={() => addPart(type)}><span className={'bb-part-icon ' + type}><Icon size={20}/></span><span><b>{part.name}</b><small>{part.detail}</small></span><Plus size={14}/></button>; })}</div>
          <button className="bb-custom" onClick={() => { addPart('device'); setBottomTab('device'); }}><Cpu size={17}/>Custom device<Plus size={14}/></button>
          <div className="bb-example"><span className="bb-example-icon"><Lightbulb size={23}/></span><h3>Start with a working build</h3><p>Open an example as its own project. Your other circuits stay saved.</p><button onClick={() => replace(ledExample())}>Load LED example<ArrowUpRight size={15}/></button><button onClick={() => replace(dimmerExample())}>Load dimmer example<ArrowUpRight size={15}/></button><button onClick={() => replace(insertedLedExample())}>Load inserted LED<ArrowUpRight size={15}/></button><button onClick={() => replace(transistorExample())}>Load transistor switch<ArrowUpRight size={15}/></button></div>
        </> : <>
          <label className="bb-search"><Search size={16}/><input aria-label="Find catalog components" placeholder="Board, sensor, display…" value={query} onChange={e => setQuery(e.target.value)}/></label>
          <div className="bb-library-heading"><b>My devices <span>{library.devices.length}</span></b><span><button aria-label="Import device library" title="Import devices" onClick={() => libraryInput.current.click()}><Upload size={13}/></button><button aria-label="Export device library" title="Export devices" disabled={!library.devices.length} onClick={() => download('Black Wire devices', library)}><Download size={13}/></button></span><input type="file" ref={libraryInput} accept="application/json,.json" hidden aria-label="Import device library file" onChange={importLibrary}/></div>
          <div className="bb-catalog-results bb-saved-devices">{savedDevices.map(d => <div key={d.id} className="bb-saved-device"><button onClick={() => { insertPart(partFromTemplate(d, project.parts.length)); }} aria-label={'Add saved device ' + d.name}><span><b>{d.name}</b><small>{d.pins.length} terminals{d.footprint ? ' · ' + (d.footprint.kind === 'sip' ? 'SIP' : 'dual row') : ''}{d.power ? ` · ${d.power.current} mA` : ''}</small></span><Plus size={15}/></button><button aria-label={'Delete saved device ' + d.name} title="Delete from My devices" onClick={() => setLibrary(removeTemplate(library, d.id))}><Trash2 size={13}/></button></div>)}{!library.devices.length && <p className="bb-muted">Save a device from the device maker to reuse it in any circuit.</p>}</div>
          <p className="bb-muted">Wire boards and modules from your reference library. Catalog devices are not simulated.</p>
          <div className="bb-pin-filter" role="tablist" aria-label="Catalog pin availability">{[['ready', 'With pins', catalogGroups.ready.length], ['missing', 'Without pins', catalogGroups.missing.length]].map(([id, label, count]) => <button key={id} role="tab" aria-selected={pinFilter === id} onClick={() => setPinFilter(id)}>{label}<span>{count.toLocaleString()}</span></button>)}</div>
          <p className="bb-muted">{pinFilter === 'ready' ? 'These arrive with their terminals listed. Check them against the reference before wiring.' : 'These have no pin list yet. Add terminals from the device reference in the device maker.'}</p>
          <div className="bb-catalog-results">{matches.map(({record, kind}) => { const status = pinStatus(record); return <button key={kind + record.id} onClick={() => addPart('device', record, kind)} aria-label={'Add ' + record.name + ' to circuit'}><span><b>{record.name}</b><small>{record.brand} · {status.ready ? <span className="bb-pin-badge">{status.count} pins</span> : 'No pin list · add terminals from the reference'}</small></span><Plus size={15}/></button>; })}{!matches.length && <p className="bb-muted">{pinFilter === 'ready' && catalogGroups.missing.length ? `No matching devices with pins. ${catalogGroups.missing.length} match without pins.` : 'No matching devices. Try a model or manufacturer.'}</p>}</div>
          {(pinFilter === 'ready' ? catalogGroups.ready : catalogGroups.missing).length > 30 && <p className="bb-muted">First 30 results. Search to narrow the list.</p>}
        </>}
      </aside>
      <section className="bb-workspace" aria-label="Circuit workspace">
        <div className="bb-toolbar">
          <div className="bb-tools"><button title="Undo" aria-label="Undo circuit change" disabled={!undo.current.length} onClick={() => travel('undo')}><Undo2 size={17}/></button><button title="Redo" aria-label="Redo circuit change" disabled={!redo.current.length} onClick={() => travel('redo')}><Redo2 size={17}/></button><i/>{[['wire', 'Wire', Cable], ['probe', 'Probe', MousePointer2], ['meter', 'Meter', Gauge], ['pan', 'Pan', Hand]].map(([id, label, Icon]) => <button key={id} className={tool === id ? 'active' : ''} aria-pressed={tool === id} onClick={() => { if (id === 'meter') { placeMeterLead(meter.red && !meter.black ? 'black' : 'red'); return; } setTool(id); setProbe(null); setPending(null); setReconnecting(null); setMapping(null); setMounting(null); }}><Icon size={16}/>{label}</button>)}<i/><button aria-pressed={Boolean(selectedBoard)} className={selectedBoard ? 'active' : ''} onClick={() => selectBoard(selectedBoard || 'main')}><LayoutGrid size={16}/>Boards</button></div>
          <button className={'bb-run ' + (running ? 'running' : '')} onClick={() => { setRunning(!running); setPending(null); setMounting(null); }}>{running ? <Square size={14}/> : <Play size={14}/>} {running ? 'Stop test' : 'Run DC test'}</button>
        </div>
        {measurement && <div className="bb-live-meter">
          <span className="bb-live-modes">{[['voltage', 'DC V'], ['continuity', 'Continuity']].map(([mode, label]) => <button key={mode} aria-label={'Meter mode: ' + (mode === 'voltage' ? 'DC voltage' : 'continuity')} aria-pressed={meter.mode === mode} onClick={() => setMeter(current => ({...current, mode}))}>{label}</button>)}</span>
          <strong role="status" className={measurement.state}>{measurement.text}</strong>
          {measurement.state === 'paused' && <button className="bb-live-action" aria-label={meter.mode === 'voltage' ? 'Run the DC test to read the meter' : 'Stop the DC test to check continuity'} onClick={() => setRunning(meter.mode === 'voltage')}>{meter.mode === 'voltage' ? <><Play size={12}/>Run DC test</> : <><Square size={12}/>Stop test</>}</button>}
          <span className="bb-live-hint">{measurement.state === 'pending' ? `Click a hole or terminal for the ${meter.active} ${meter.active === 'red' ? '(V)' : '(COM)'} lead` : 'Click a hole or terminal to move the highlighted lead'}</span>
          <div>{['red', 'black'].map(lead => <button key={lead} aria-label={'Select ' + lead + ' lead'} aria-pressed={meter.active === lead} onClick={() => placeMeterLead(lead)}>{lead === 'red' ? 'V' : 'COM'}</button>)}</div>
        </div>}
        {mounting && <div className="bb-insert-banner" role="status"><CircuitBoard size={17}/><span>{mountBanner} Occupied holes have a copper outline.</span>{footprintMode && <button onClick={() => setMounting(m => ({...m, turns: ((m.turns || 0) + 1) % 4}))}>Rotate preview</button>}<button onClick={() => setMounting(null)}>Cancel insertion</button></div>}
        <div className="bb-wire-bar"><span>Wire color</span>{WIRE_COLORS.map((c, i) => <button key={c} className="bb-swatch" style={{'--wire-color': c}} aria-label={['Red', 'Blue', 'Gold', 'Green', 'Purple', 'Gray'][i] + ' wire'} aria-pressed={color === c} onClick={() => { setColor(c); if (selectedWire) change({...project, wires: project.wires.map(w => w.id === selection ? {...w, color: c, built: false} : w)}, {keepRunning: true}); }}/>) }<span className="bb-scale"><button aria-label="Zoom out circuit" disabled={zoom <= .25} onClick={() => setZoom(z => Math.max(.25, z - .25))}><Minus size={14}/></button><span>{Math.round(zoom * 100)}%</span><button aria-label="Zoom in circuit" disabled={zoom >= 3} onClick={() => setZoom(z => Math.min(3, z + .25))}><Plus size={14}/></button><button aria-label="Fit circuit" onClick={() => { setZoom(1); stage.current.scrollTo(0, 0); }}><Maximize2 size={14}/></button></span></div>
        <div className="bb-edit-tools"><span>{selectedPart ? selectedPart.name : selectedWire ? 'Jumper wire' : selectedBoard ? 'Breadboard settings' : 'Select a part or wire to edit'}</span>{selectedPart && <><button onClick={rotatePart} title="Rotate (R)"><RotateCw size={14}/>{selectedPart.mount && mountKind(selectedPart) === 'pair' ? 'Move leads' : 'Rotate'}</button><button onClick={copyPart} title="Duplicate (Ctrl/⌘ D)"><Copy size={14}/>Duplicate</button></>}{selectedWire && <button onClick={() => addBend(selectedWire)}><CornerDownRight size={14}/>Add bend</button>}{selection && (!selectedBoard || selectedBoard !== 'main') && <button aria-label="Delete selected item" onClick={removeSelected}><Trash2 size={14}/></button>}<button className="bb-expand" aria-label={expanded ? 'Exit expanded workspace' : 'Expand workspace'} onClick={() => setExpanded(!expanded)}>{expanded ? <X size={15}/> : <Maximize2 size={15}/>}</button></div>
        <div className={'bb-canvas ' + (tool === 'pan' ? 'panning' : '')} ref={stage} style={{height: expanded ? '65vh' : Math.min(650, Math.max(430, stageWidth * 880 / 1200))}} onPointerDownCapture={e => { if (tool !== 'pan' || e.button !== 0) return; e.preventDefault(); e.stopPropagation(); drag.current = {kind: 'pan', x: e.clientX, y: e.clientY, left: stage.current.scrollLeft, top: stage.current.scrollTop}; e.currentTarget.setPointerCapture(e.pointerId); }} onPointerMove={e => { if (drag.current?.kind === 'pan') moveDrag(e); }} onPointerUp={() => { if (drag.current?.kind === 'pan') endDrag(); }} onPointerCancel={() => { if (drag.current?.kind === 'pan') endDrag(); }}>
          <svg ref={svg} width={canvasWidth} height={canvasHeight * unit} viewBox={`0 0 ${worldWidth} ${canvasHeight}`} aria-label="Interactive breadboard" onClick={e => { if (e.target === e.currentTarget && !mapping) { setSelection(null); setPending(null); } }}>
            <defs><pattern id="bb-dot-grid" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="currentColor"/></pattern><filter id="bb-glow"><feGaussianBlur stdDeviation="5"/></filter></defs>
            <rect width={worldWidth} height={canvasHeight} fill="url(#bb-dot-grid)" className="bb-grid" pointerEvents="none"/>
            {boards.map(b => <BreadboardBoard key={b.id} board={b} holes={holes.filter(h => h.board === b.id)} selected={selectedBoard === b.id} holeClass={holeClass} pending={pending} onSelect={e => { e.stopPropagation(); selectBoard(b.id); }} onDragStart={e => startBoardDrag(e, b)} onDragMove={moveDrag} onDragEnd={endDrag}/>)}
            {project.wires.map(w => {
              const a = endpointPosition(project, w.from), b = endpointPosition(project, w.to), path = wirePath(project, w);
              const connected = highlightedNet && nets.find(w.from) === highlightedNet;
              return <g key={w.id} className={'bb-wire ' + (selection === w.id ? 'selected ' : '') + (connected ? 'net-highlight' : '')} role="button" tabIndex={0} aria-label={'Wire from ' + endpointLabel(project, w.from) + ' to ' + endpointLabel(project, w.to)} onClick={() => { setSelection(w.id); setPending(null); setMapping(null); setMounting(null); }} onDoubleClick={e => { e.preventDefault(); addBend(w, point(e)); }} onKeyDown={activate(() => { setSelection(w.id); setPending(null); setMounting(null); })}><title>{w.label ? w.label + ' · ' : ''}{endpointLabel(project, w.from)} → {endpointLabel(project, w.to)}</title><path d={path} className="bb-wire-hit"/><path d={path} stroke={w.color} className="bb-wire-line" pointerEvents="none"/><circle cx={a.x} cy={a.y} r="4" fill={w.color} pointerEvents="none"/><circle cx={b.x} cy={b.y} r="4" fill={w.color} pointerEvents="none"/>{w.label && <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 10} className="bb-wire-label" pointerEvents="none">{w.label}</text>}</g>;
            })}
            {!mounting && holeTargets}
            {project.parts.map(part => <BreadboardPart key={part.id} project={project} part={part} reference={references.get(part.id)} record={recordMap.get(part.recordKind + ':' + part.recordId)} selected={selection === part.id} pending={pending} reading={result?.readings[part.id]} mapping={mapping?.partId === part.id} terminalProps={terminalProps} onSelect={() => { setSelection(part.id); setNewPin(''); setMounting(null); }} onDragStart={e => startDrag(e, part)} onDragMove={moveDrag} onDragEnd={endDrag} onNudge={delta => nudgePart(part, delta)} onToggle={() => updatePart(part.id, {closed: !part.closed}, true)} onPress={down => pressButton(part.id, down)} onMap={e => mapTerminal(e, part)}/>)}
            {selectedWire?.points?.map((p, i) => <circle key={i} role="button" tabIndex={0} aria-label={'Move wire bend ' + (i + 1)} className="bb-bend" cx={p.x} cy={p.y} r="8" onPointerDown={e => startBend(e, selectedWire, i)} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} onKeyDown={e => {
              const delta = {ArrowLeft: [-5, 0], ArrowRight: [5, 0], ArrowUp: [0, -5], ArrowDown: [0, 5]}[e.key];
              if (delta) { e.preventDefault(); change({...project, wires: project.wires.map(w => w.id === selectedWire.id ? {...w, points: w.points.map((point, index) => index === i ? {x: Math.max(0, Math.min(4000, point.x + delta[0])), y: Math.max(0, Math.min(4000, point.y + delta[1]))} : point)} : w)}, {keepRunning: true}); }
            }}><title>Drag bend {i + 1}; arrow keys to nudge</title></circle>)}
            {tool === 'meter' && ['red', 'black'].map(lead => { const pos = meter[lead] && endpointPosition(project, meter[lead]); return pos && <g key={lead} className={'bb-meter-marker ' + lead} transform={`translate(${pos.x} ${pos.y})`} pointerEvents="none"><circle r="10"/><path d={`M0 -10 v${lead === 'red' ? -21 : -47}`}/><rect x="-11" y={lead === 'red' ? -51 : -77} width="22" height="22" rx="4"/><text y={lead === 'red' ? -36 : -62} textAnchor="middle">{lead === 'red' ? 'V' : 'COM'}</text></g>; })}
            {mounting && holeTargets}
            {mounting?.first && (() => { const first = endpointPosition(project, 'hole:' + mounting.first), second = hover && endpointPosition(project, hover); return <g className="bb-mount-preview" pointerEvents="none"><circle cx={first.x} cy={first.y} r="10"/>{second && <path d={`M${first.x} ${first.y} L${second.x} ${second.y}`}/>}</g>; })()}
            {preview && <g className={'bb-footprint-ghost' + (preview.blocked ? ' blocked' : '')} pointerEvents="none">{preview.holes.map((id, i) => { const h = findHole(project, id); return h && <g key={id}><circle cx={h.x} cy={h.y} r="9"/>{i === 0 && <text x={h.x} y={h.y - 13} textAnchor="middle">1</text>}</g>; })}</g>}
          </svg>
          {!project.parts.length && <div className="bb-canvas-empty"><CircuitBoard size={23}/><b>A little space for your next idea.</b><span>Add a component, or start with the LED example.</span><button onClick={() => replace(ledExample())}>Try the LED circuit<ArrowUpRight size={14}/></button></div>}
        </div>
        <div className="bb-canvas-status" role="status"><span>{mounting ? `Insert ${mountingPart?.name} · ${footprintMode ? 'choose the hole for pin 1' : 'choose ' + (mounting.first ? 'second lead hole (first: ' + holeCode(mounting.first) + ')' : 'first lead hole')}` : reconnecting ? `Reconnect ${reconnecting.end} · select a terminal or hole` : mapping ? 'Click the reference image to place the selected terminal.' : pending ? `From ${endpointLabel(project, pending)} · choose another terminal` : tool === 'meter' ? `Place ${meter.active} meter lead · select a terminal or hole` : tool === 'probe' ? 'Select a terminal or hole to read its voltage.' : tool === 'pan' ? 'Drag the canvas to pan. Use zoom for smaller terminals.' : 'Click two terminals to wire · Double-click a wire to add a bend'}{(pending || reconnecting || mapping || mounting) && <button onClick={() => { setPending(null); setReconnecting(null); setMapping(null); setMounting(null); }}>Cancel</button>}</span><span>{boards.length > 1 ? boards.length + ' boards · ' : ''}{project.parts.length} parts · {project.wires.length} wires</span></div>
      </section>
      <section className="bb-inspector" aria-label="Circuit inspector">
        <div className="bb-panel-title"><span>{selectedPart ? 'COMPONENT' : selectedWire ? 'CONNECTION' : selectedBoard ? 'BREADBOARD' : 'INSPECTOR'}</span>{selection && <button aria-label="Clear selection" onClick={() => { setSelection(null); setMounting(null); }}><X size={14}/></button>}</div>
        {selectedPart ? <div className="bb-inspector-body" key={selectedPart.id}>
          <label className="bb-field">Part name<input value={selectedPart.name} maxLength={200} onChange={e => updatePart(selectedPart.id, {name: e.target.value})}/></label>
          {def?.unit && <ValueField label={def.label} value={selectedPart.value} min={def.min} max={def.max} onChange={value => updatePart(selectedPart.id, {value})}/>}
          {Object.entries(def?.fields || {}).map(([key, field]) => <ValueField key={key} label={field.label} value={selectedPart[key]} min={field.min} max={field.max} onChange={value => updatePart(selectedPart.id, {[key]: value})}/>)}
          {Object.entries(def?.flags || {}).map(([key, flag]) => <label key={key} className="bb-image-toggle"><input type="checkbox" checked={Boolean(selectedPart[key])} onChange={e => updatePart(selectedPart.id, {[key]: e.target.checked})}/>{flag.label}</label>)}
          {selectedPart.type === 'switch' && <button className="bb-switch-button" aria-pressed={selectedPart.closed} onClick={() => updatePart(selectedPart.id, {closed: !selectedPart.closed}, true)}><ToggleLeft size={18}/>{selectedPart.closed ? 'Closed · click to open' : 'Open · click to close'}</button>}
          {selectedPart.type === 'button' && <p className="bb-muted">Hold the button cap on the canvas to press it. Legs 1A–1B and 2A–2B are always connected; pressing joins the two pairs. Straddle the center gap so each pair spans it.</p>}
          {selectedPart.type === 'potentiometer' && <label className="bb-field bb-knob-field">Wiper position · {selectedPart.position}%<input aria-label="Wiper position" type="range" min="0" max="100" value={selectedPart.position} onChange={e => updatePart(selectedPart.id, {position: Number(e.target.value)}, true)}/><small>A–B is the full track. Wiper moves from B (0%) to A (100%).</small></label>}
          {selectedPart.type === 'led' && <p className="bb-muted">A is the anode (+), K is the cathode (−). This example LED uses a 20 mA current limit.</p>}
          {selectedPart.type === 'diode' && <p className="bb-muted">Current flows from A (anode) to K (cathode, the banded end). Forward voltage sets the knee; the example rating is 1 A.</p>}
          {selectedPart.type === 'capacitor' && <p className="bb-muted">In a steady DC test a capacitor is fully charged: it blocks current and holds the voltage across it. The test checks its voltage rating{selectedPart.polarized ? ' and polarity (+ lead to the higher voltage)' : ''}. Charging time is not modeled.</p>}
          {['npn', 'pnp'].includes(selectedPart.type) && <p className="bb-muted">TO-92 leads E, B, C from left with the flat side facing you; check your part's datasheet, as pin orders vary. {selectedPart.type === 'npn' ? 'Base current into B lets collector current flow from C to E.' : 'Base current out of B lets current flow from E to C.'} Use a base resistor.</p>}
          {selectedPart.type === 'buzzer' && <p className="bb-muted">An active buzzer sounds when powered with + toward the higher voltage. It is modeled as a polarized load drawing its rated current at its rated voltage.</p>}
          {mountKind(selectedPart) && <div className="bb-mount-controls"><h3>{selectedPart.mount ? 'Inserted in breadboard' : 'Place on the breadboard'}</h3>{selectedPart.mount ? <><p>{selectedPart.pins.map(pin => <span key={pin.id}>{pin.label} → <b>{holeCode(selectedPart.mount.holes[pin.id])}</b></span>)}</p><p className="bb-muted">Drag or use arrow keys to move by holes{mountKind(selectedPart) === 'pair' ? '' : '; R rotates around pin 1'}. Leads connect electrically to their strips.</p><button className="bb-reference" onClick={() => { change(unmountPart(project, selectedPart.id)); setSelection(selectedPart.id); }}>Lift from breadboard</button></> : <><p className="bb-muted">{mountKind(selectedPart) === 'pair' ? 'Choose two holes to insert the leads directly.' : `Choose the hole for pin 1; all ${selectedPart.pins.length} leads follow the package.`} Existing wires stay attached.</p><button className="bb-reference" onClick={() => beginMount(selectedPart)}><CircuitBoard size={16}/>Insert into breadboard</button></>}</div>}
          {selectedPart.type === 'device' && <>
            <PinSourceNote source={selectedPart.pinSource}/>
            <PowerOutputToggle part={selectedPart} onChange={powerOut => updatePart(selectedPart.id, {powerOut})} onMissing={() => { setBottomTab('device'); setMessage('Mark the board\'s GND and 3V3 or 5V terminals (labels or roles) in the device maker, then turn on USB power.'); }}/>
            <div className="bb-model-note">{selectedPart.power?.current > 0 ? `Modeled as a ${selectedPart.power.current} mA load · no logic simulation` : 'Wiring only · no simulation model'}</div>
            <button className="bb-reference bb-open-maker" onClick={() => setBottomTab('device')}><Wrench size={14}/>Open in device maker</button>
            {!selectedPart.footprint && <p className="bb-muted">Choose a package in the device maker to insert it into the breadboard.</p>}
            <p className="bb-muted">Unplaced terminals use a logical layout. Labels and manually placed contacts are project notes; match them to the exact reference. {selectedPart.revision && `Revision: ${selectedPart.revision}.`}</p>
            {referenceArtwork(selectedRecord) && <label className="bb-image-toggle"><input type="checkbox" checked={Boolean(selectedPart.referenceImage)} onChange={e => updatePart(selectedPart.id, {referenceImage: e.target.checked}, true)}/>Show original reference artwork</label>}
            {selectedPart.recordId && <button className="bb-reference" onClick={() => onOpenReference(selectedPart.recordId, selectedPart.recordKind)}>Open device reference<ArrowUpRight size={14}/></button>}
            {!selectedPart.pins.length && <p className="bb-muted">No structured pin list is available. Add terminal labels from the device’s reference.</p>}
            <form className="bb-add-pin" onSubmit={e => { e.preventDefault(); if (!newPin.trim() || selectedPart.pins.length >= LIMITS.pins || selectedPart.mount) return; updatePart(selectedPart.id, {pins: [...selectedPart.pins, {id: 'p' + uid(), label: newPin.trim()}]}); setNewPin(''); }}><label className="bb-field">New terminal<input maxLength={160} value={newPin} disabled={Boolean(selectedPart.mount)} onChange={e => setNewPin(e.target.value)} placeholder="e.g. GND, SDA, GPIO4"/></label><button aria-label="Add terminal" disabled={!newPin.trim() || selectedPart.pins.length >= LIMITS.pins || Boolean(selectedPart.mount)}><Plus size={16}/></button></form>
          </>}
          {selectedPart.type === 'device' ? <CircuitTerminals part={selectedPart} wires={project.wires} pending={pending} onConnect={terminal} onUpdate={pins => updatePart(selectedPart.id, {pins}, true)} onRemove={pinId => attempt(() => { change(removeTerminal(project, selectedPart.id, pinId)); setPending(null); setReconnecting(null); setMapping(null); setProbe(null); })} onMap={pinId => { setMapping({partId: selectedPart.id, pinId}); setPending(null); setReconnecting(null); setTool('wire'); stage.current.scrollIntoView({block: 'center'}); }}/> : <div className="bb-terminal-list">{selectedPart.pins.map(pin => <button key={pin.id} aria-pressed={pending === selectedPart.id + ':' + pin.id} onClick={() => terminal(selectedPart.id + ':' + pin.id)}><span className="bb-terminal-dot"/>{pin.label}<Cable size={13}/></button>)}</div>}
          <div className="bb-part-actions"><button onClick={rotatePart}><RotateCw size={14}/>{selectedPart.mount ? mountKind(selectedPart) === 'pair' ? 'Move leads' : 'Rotate on board' : `Rotate ${selectedPart.rotation || 0}°`}</button><button onClick={copyPart}><Copy size={14}/>Duplicate part</button></div>
          {result?.readings[selectedPart.id] && <div className="bb-reading"><span>{display(result.readings[selectedPart.id].voltage)} V</span><span>{display(result.readings[selectedPart.id].current * 1000)} mA</span>{result.readings[selectedPart.id].region && <span>{result.readings[selectedPart.id].region}</span>}</div>}
          <button className="bb-remove" onClick={removeSelected}><Trash2 size={15}/>Remove part & its wires</button>
        </div> : selectedWire ? <div className="bb-inspector-body"><h3>Jumper wire</h3><label className="bb-field">Wire label<input maxLength={100} value={selectedWire.label || ''} onChange={e => change({...project, wires: project.wires.map(w => w.id === selection ? {...w, label: e.target.value} : w)}, {keepRunning: true})}/></label>{['from', 'to'].map(end => <div className="bb-wire-end" key={end}><span>{end.toUpperCase()}</span><p>{endpointLabel(project, selectedWire[end])}</p><button aria-pressed={reconnecting?.end === end} onClick={() => { setReconnecting({wireId: selectedWire.id, end}); setPending(null); setMounting(null); setTool('wire'); }}>Reconnect {end}</button></div>)}<p className="bb-muted">Double-click the wire to add a bend; drag its handles to shape the route.</p><button className="bb-reference" onClick={() => addBend(selectedWire)}><CornerDownRight size={14}/>Add wire bend</button>{selectedWire.points?.length > 0 && <><div className="bb-bend-list">{selectedWire.points.map((p, i) => <div key={i}><span>Bend {i + 1} · {p.x}, {p.y}</span><button aria-label={'Remove bend ' + (i + 1)} onClick={() => change({...project, wires: project.wires.map(w => w.id === selection ? {...w, points: w.points.filter((_, index) => index !== i)} : w)}, {keepRunning: true})}><X size={13}/></button></div>)}</div><button className="bb-reference" onClick={() => change({...project, wires: project.wires.map(w => w.id === selection ? {...w, points: []} : w)}, {keepRunning: true})}>Reset wire route</button></>}<button className="bb-remove" onClick={removeSelected}><Trash2 size={15}/>Remove wire</button></div>
        : selectedBoard ? <BoardSettings project={project} boardId={selectedBoard} onSelect={selectBoard} onUpdate={(id, changes) => attempt(() => change(updateBoard(project, id, changes)))} onAdd={addBoardOfSize} onRemove={removeBoardById}/>
        : <div className="bb-inspector-body"><MousePointer2 size={23}/><h3>Make it your own</h3><p className="bb-muted">Select a part to change its values or add terminals. Select a wire to inspect or remove it. Click a breadboard to change its size or add another.</p><p className="bb-muted">Use Probe during a DC test to check voltage at a breadboard hole.</p></div>}
      </section>
      <section className="bb-test-panel" aria-label="Circuit details">
        <div className="bb-detail-tabs" role="tablist" aria-label="Circuit details">{[['test', 'DC test bench'], ['meter', 'Multimeter'], ['build', 'Build guide'], ['device', 'Device maker'], ['connections', 'Connections'], ['parts', 'Parts list']].map(([id, label]) => <button key={id} role="tab" aria-selected={bottomTab === id} onClick={() => { setBottomTab(id); if (id === 'meter') placeMeterLead(meter.active); else if (tool === 'meter') setTool('wire'); }}>{label}</button>)}</div>
        {bottomTab === 'meter' && <CircuitMeter project={project} meter={meter} result={result} onChange={setMeter} onPlace={placeMeterLead}/>}
        {bottomTab === 'build' && <CircuitBuildGuide project={project} onChange={next => change(next, {keepRunning: true})} onLocate={locateItem}/>}
        {bottomTab === 'device' && <DeviceMaker part={selectedPart} library={library} librarySaved={librarySaved} onChange={changes => updatePart(selectedPart.id, changes)} onRemovePin={pinId => attempt(() => change(removeTerminal(project, selectedPart.id, pinId)))} onSave={() => saveDevice(selectedPart)} onCreate={() => addPart('device')} onLocate={locateItem}/>}
        {bottomTab === 'connections' && <div className="bb-connections"><p className="bb-muted">Select a connection to inspect, reroute, or reconnect it. Crossing wires do not connect unless they share a terminal or breadboard strip.</p>{project.wires.map(w => <button key={w.id} onClick={() => { setSelection(w.id); setPending(null); setMounting(null); }}><span className="bb-connection-color" style={{background: w.color}}/><span><b>{w.label || 'Jumper wire'}</b><small>{endpointLabel(project, w.from)} → {endpointLabel(project, w.to)}</small></span><ArrowUpRight size={14}/></button>)}{!project.wires.length && <p className="bb-muted">No wires yet. Select two terminals to make a connection.</p>}</div>}
        {bottomTab === 'parts' && <div className="bb-parts-list"><p className="bb-muted">Your build has {project.parts.length} components and {project.wires.length} jumper wires on {boards.length} breadboard{boards.length === 1 ? '' : 's'}. Select a component to edit it.</p>{project.parts.map(p => <button key={p.id} onClick={() => { setSelection(p.id); setMounting(null); }}><span><b>{p.name}</b><small>{partSpecification(p)}</small></span><span>{p.type === 'device' ? p.power?.current > 0 ? 'Load model' : 'Wiring only' : 'DC model'}</span></button>)}</div>}
        {bottomTab === 'test' && <><div className="bb-test-heading"><div><FlaskIcon/><h2>DC test bench</h2></div><span className={'bb-result-state ' + (result?.status || '')}>{!result ? 'Ready when you are' : result.status === 'ok' ? 'Model solved' : result.status === 'error' ? 'Circuit needs attention' : 'Review test notes'}</span></div>
        {!result ? <p className="bb-muted">Run a test to see component voltages, current, LED activity and wiring issues.</p> : <>
          <div className="bb-results-grid">{project.parts.filter(p => result.readings[p.id]).map(p => { const r = result.readings[p.id]; return <button key={p.id} className="bb-result-card" onClick={() => { setSelection(p.id); setMounting(null); }}><b>{p.name}</b><strong>{display(r.current * 1000)}<small> mA{r.region ? ' Ic' : ''}</small></strong><span>{display(r.voltage)} V{r.region ? ' Vce · ' + r.region : ` · ${display(Math.abs(r.power) * 1000)} mW`}{p.type === 'supply' ? ' net output' : ''}{r.sounding ? ' · sounding' : ''}</span></button>; })}</div>
          {result.diagnostics.length > 0 && <ul className="bb-diagnostics">{result.diagnostics.map((d, i) => <li key={i} className={d.level}><Info size={15}/><span>{d.message}</span>{project.parts.some(p => p.id === d.partId) && <button aria-label={'Locate issue: ' + d.message} onClick={() => locateItem(d.partId)}><ArrowUpRight size={15}/></button>}</li>)}</ul>}
          {!result.diagnostics.some(d => d.level !== 'note') && <p className="bb-test-success"><Check size={16}/>DC equations solved. No issues detected in the supported component models.</p>}
        </>}
        {probe && <div className="bb-probe-reading"><MousePointer2 size={16}/><span>{endpointLabel(project, probe)}</span><b>{!result ? 'Run test to measure' : result.voltages[probe] != null ? `${display(result.voltages[probe], 3)} V` : 'Not powered'}</b><button aria-label="Clear probe" onClick={() => setProbe(null)}><X size={14}/></button></div>}
        <details className="bb-model-details"><summary>What this test models</summary><p>Steady DC with ideal wires, power rails, resistors, ideal switches and voltage supplies. LEDs and diodes use a smooth forward-voltage model (20 Ω and 1 Ω on resistance); example limits are 20 mA for LEDs, 1 A for diodes and ¼ W for resistors. Probe voltages are relative to the first supply’s negative terminal in each connected circuit.</p><p>Capacitors are fully charged: they pass no DC current, and the test checks their voltage rating and polarity. Transistors use a simplified current-gain model with smooth saturation and a 200 mA example limit. Push buttons conduct only while held. Active buzzers are polarized loads.</p><p>Catalog devices are connection plans only. A device with a power profile you entered is modeled as a resistive load at its nominal voltage, with your voltage limits checked; its firmware, GPIO behavior, sensors and buses are not. Timing, AC, reverse breakdown, heat and real breadboard parasitics are not modeled. A solved circuit is an estimate, not verification of physical hardware.</p><p>The potentiometer is a generic linear resistive track, modeled as A–W and W–B resistors with a minimum 1 mΩ contact resistance. Move its wiper while the test runs to see loaded divider behavior. LED brightness is proportional to the calculated current, scaled to 10 mA.</p></details></>}
      </section>
    </div>
  </div>;
}
function FlaskIcon() { return <Zap size={18}/>; }
function ValueField({label, value, min, max, onChange}) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  const valid = draft.trim() !== '' && Number.isFinite(Number(draft)) && Number(draft) >= min && Number(draft) <= max;
  return <label className="bb-field">{label}<input type="number" step="any" min={min} max={max} value={draft} aria-invalid={!valid} onChange={e => setDraft(e.target.value)} onBlur={() => { if (valid && Number(draft) !== value) onChange(Number(draft)); }} onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}/>{!valid ? <small className="bb-invalid">Enter {min}–{max}. Last valid value remains in use.</small> : Number(draft) !== value && <small>Press Enter or leave the field to apply.</small>}</label>;
}
