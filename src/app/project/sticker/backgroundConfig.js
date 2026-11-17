export const fallbackBackground = '/images/backgrounds/portal-fallback.svg';

export function resolvePortalBackground(defaults = {}, override = {}, image = null) {
  const values = { ...defaults, ...override };
  return {
    type: 'hemisphere',
    coverage: Number.isFinite(values.coverage) ? Math.max(0.2, Math.min(1, values.coverage)) : 0.72,
    image: values.image || image || fallbackBackground,
    radius: Number.isFinite(values.radius) && values.radius >= 2 ? values.radius : 4.5,
    position: Array.isArray(values.position) && values.position.length === 3 && values.position.every(Number.isFinite) ? values.position : [0, 0, 0],
    rotation: Array.isArray(values.rotation) && values.rotation.length === 3 && values.rotation.every(Number.isFinite) ? values.rotation : [0, 0, 0],
    opacity: Number.isFinite(values.opacity) ? Math.max(0, Math.min(1, values.opacity)) : 0.5,
  };
}
