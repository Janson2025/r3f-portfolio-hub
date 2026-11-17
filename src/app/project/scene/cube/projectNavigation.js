import * as THREE from 'three';

export const EMPTY_PROJECT_NAVIGATION = Object.freeze({ up: null, down: null, left: null, right: null });

/** Walk a physical surface lane, unfolding the four faces around that lane.
 * Coordinates are computed from current transforms, so slice turns do not
 * invalidate the mapping. Empty/noneligible slots are skipped, never diagonals.
 */
export function getDirectionalProjectNavigation(root, currentProjectId, eligibleIds) {
  if (!root || !currentProjectId) return EMPTY_PROJECT_NAVIGATION;
  root.updateWorldMatrix(true, true);
  const center = root.getWorldPosition(new THREE.Vector3());
  const stickers = [];
  root.traverse(object => {
    const metadata = object.userData?.projectSticker;
    if (!metadata) return;
    const quaternion = object.getWorldQuaternion(new THREE.Quaternion());
    stickers.push({ metadata, position: object.getWorldPosition(new THREE.Vector3()).sub(center), quaternion,
      normal: new THREE.Vector3(0, 0, 1).applyQuaternion(quaternion) });
  });
  const current = stickers.find(item => item.metadata.id === currentProjectId);
  if (!current) return EMPTY_PROJECT_NAVIGATION;
  const allowed = eligibleIds ? new Set(eligibleIds) : null;
  const directions = { up: [0, 1, 0], down: [0, -1, 0], left: [-1, 0, 0], right: [1, 0, 0] };

  return Object.fromEntries(Object.entries(directions).map(([name, vector]) => {
    const direction = new THREE.Vector3(...vector).applyQuaternion(current.quaternion).normalize();
    const normal = current.normal.clone().normalize();
    const edge = new THREE.Vector3().crossVectors(normal, direction).normalize();
    const configuredExtent = root.userData.halfExtent;
    const extentN = configuredExtent || Math.max(...stickers.map(item => Math.abs(item.position.dot(normal))), 0.5);
    const extentD = configuredExtent || Math.max(...stickers.map(item => Math.abs(item.position.dot(direction))), 0.5);
    const laneTolerance = Math.min(extentN, extentD) * 0.18;
    const start = current.position.dot(direction);
    const cycle = 4 * (extentN + extentD);
    const results = [];
    for (const candidate of stickers) {
      if (candidate === current || (allowed && !allowed.has(candidate.metadata.id))) continue;
      if (Math.abs(candidate.position.clone().sub(current.position).dot(edge)) > laneTolerance) continue;
      const n = candidate.normal;
      const pN = candidate.position.dot(normal), pD = candidate.position.dot(direction);
      let distance;
      if (n.dot(normal) > 0.999) distance = pD - start;
      else if (n.dot(direction) > 0.999) distance = extentD - start + extentN - pN;
      else if (n.dot(normal) < -0.999) distance = extentD - start + 2 * extentN + extentD - pD;
      else if (n.dot(direction) < -0.999) distance = extentD - start + 2 * extentN + 2 * extentD + pN + extentN;
      else continue;
      if (distance <= 0.001) distance += cycle;
      results.push({ distance, metadata: candidate.metadata });
    }
    results.sort((a, b) => a.distance - b.distance);
    return [name, results[0]?.metadata ?? null];
  }));
}
