import {PROJECT_KEY, LIMITS, emptyProject, validateProject, uid} from './breadboard.mjs';

export const PROJECTS_KEY = 'blackwire-circuit-projects-v1';
export function createWorkspace(project = emptyProject()) {
  const id = uid();
  return {format: 'black-wire-circuit-projects', version: 1, activeId: id, entries: [{id, updatedAt: new Date().toISOString(), project: validateProject(project)}]};
}
export function validateWorkspace(data) {
  if (!data || data.format !== 'black-wire-circuit-projects' || data.version !== 1 || !Array.isArray(data.entries) || !data.entries.length || data.entries.length > LIMITS.projects) throw new Error('Saved projects have an unsupported format.');
  const ids = new Set();
  const entries = data.entries.map(entry => {
    if (!entry || typeof entry.id !== 'string' || !/^[\w-]{1,100}$/.test(entry.id) || ids.has(entry.id) || typeof entry.updatedAt !== 'string' || !Number.isFinite(Date.parse(entry.updatedAt))) throw new Error('Saved projects have an invalid identity or date.');
    ids.add(entry.id);
    return {id: entry.id, updatedAt: entry.updatedAt, project: validateProject(entry.project)};
  });
  if (!ids.has(data.activeId)) throw new Error('The active circuit is missing.');
  return {format: data.format, version: 1, activeId: data.activeId, entries};
}
export function loadWorkspace(storage) {
  try {
    const saved = storage.getItem(PROJECTS_KEY);
    if (saved !== null) return {workspace: validateWorkspace(JSON.parse(saved)), blocked: false, baseline: saved};
    const legacy = storage.getItem(PROJECT_KEY);
    return {workspace: createWorkspace(legacy === null ? emptyProject() : validateProject(JSON.parse(legacy))), blocked: false, baseline: null};
  } catch { return {workspace: createWorkspace(), blocked: true, baseline: null}; }
}
export function activeProject(workspace) { return workspace.entries.find(e => e.id === workspace.activeId).project; }
export function updateActiveProject(workspace, next) {
  const project = typeof next === 'function' ? next(activeProject(workspace)) : next;
  return {...workspace, entries: workspace.entries.map(e => e.id === workspace.activeId ? {...e, project, updatedAt: new Date().toISOString()} : e)};
}
export function addProject(workspace, project) {
  if (workspace.entries.length >= LIMITS.projects) throw new Error('You have 50 saved projects. Export and delete one before creating another.');
  const entry = {id: uid(), updatedAt: new Date().toISOString(), project: validateProject(project)};
  return {...workspace, activeId: entry.id, entries: [...workspace.entries, entry]};
}
export function deleteProject(workspace, id) {
  const entries = workspace.entries.filter(e => e.id !== id);
  if (!entries.length) return createWorkspace();
  return {...workspace, entries, activeId: workspace.activeId === id ? entries[0].id : workspace.activeId};
}
