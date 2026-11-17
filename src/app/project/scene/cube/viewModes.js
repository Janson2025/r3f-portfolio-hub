export const transitionDuration = reduced => reduced ? 0.24 : 0.75;
export const easeTransition = value => { const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t); };
export function cubePermissions(mode, transitioning, disabled, selectedId) {
  const ready = !transitioning && !disabled;
  return { manipulate: ready && mode === 'cube', activate: ready && mode === 'project' && Boolean(selectedId) };
}
