import * as THREE from 'three';

export const DEFAULT_ZOOM_PERCENT = 0;
export const zoomToFov = percent => 18 + THREE.MathUtils.clamp(Number(percent) || 0, 0, 100) / 100 * 57;

export function focusedDistance(width, height, viewport, fov) {
  const vertical = THREE.MathUtils.degToRad(fov) / 2;
  const aspect = viewport.width / Math.max(1, viewport.height);
  const horizontal = Math.atan(Math.tan(vertical) * aspect);
  const fill = viewport.width < 600 ? 0.84 : 0.76;
  const fillW = fill * Math.max(0.35, (viewport.width - 80) / viewport.width);
  const fillH = (viewport.width<600?.9:fill) * Math.max(0.35, (viewport.height - (viewport.width<600?100:110)) / viewport.height);
  return Math.max(width / (2 * Math.tan(horizontal) * fillW), height / (2 * Math.tan(vertical) * fillH));
}

export function focusedPose(group, sticker, viewport, fov = 18) {
  const world = group.getWorldQuaternion(new THREE.Quaternion());
  const center = group.getWorldPosition(new THREE.Vector3());
  const delta = sticker.quaternion.clone().invert(); // selected sticker: normal +Z, up +Y
  const parent = group.parent?.getWorldQuaternion(new THREE.Quaternion()) ?? new THREE.Quaternion();
  const quaternion = parent.invert().multiply(delta.clone().multiply(world));
  const target = sticker.position.clone().sub(center).applyQuaternion(delta).add(center);
  const distance = focusedDistance(sticker.width ?? 1.5, sticker.height ?? 1.5, viewport, fov);
  return { quaternion, target, cameraPosition: target.clone().add(new THREE.Vector3(0, 0, distance)) };
}

export function projectedStickerFrame(sticker, camera, viewport) {
  const right = sticker.right.clone().multiplyScalar((sticker.width ?? 1.5) / 2);
  const up = sticker.up.clone().multiplyScalar((sticker.height ?? 1.5) / 2);
  const points = [-1, 1].flatMap(x => [-1, 1].map(y => sticker.position.clone().addScaledVector(right, x).addScaledVector(up, y).project(camera)));
  return { left: Math.min(...points.map(p => (p.x + 1) * viewport.width / 2)),
    right: Math.max(...points.map(p => (p.x + 1) * viewport.width / 2)),
    top: Math.min(...points.map(p => (1 - p.y) * viewport.height / 2)),
    bottom: Math.max(...points.map(p => (1 - p.y) * viewport.height / 2)), width: viewport.width, height: viewport.height };
}
