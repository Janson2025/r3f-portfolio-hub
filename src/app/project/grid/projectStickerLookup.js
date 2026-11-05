
import * as THREE from "three";

/**
 * Returns all currently rendered project portal stickers.
 *
 * Each result contains:
 * - Project identity
 * - Original assignment identity
 * - Current world position
 * - Current world orientation
 * - Current outward-facing direction
 *
 * Because world transforms are calculated at lookup time,
 * this works after slice rotations and whole-cube rotations.
 */
export function getProjectStickers(blockRefs = []) {
  const results = [];

  const worldPosition = new THREE.Vector3();
  const worldQuaternion = new THREE.Quaternion();

  const localNormal = new THREE.Vector3(0, 0, 1);
  const localRight = new THREE.Vector3(1, 0, 0);
  const localUp = new THREE.Vector3(0, 1, 0);

  for (const block of blockRefs) {
    const root = block?.ref?.current;

    if (!root) continue;

    root.updateWorldMatrix(true, true);

    root.traverse((object) => {
      const metadata = object.userData?.projectSticker;

      if (!metadata) return;

      object.updateWorldMatrix(true, false);

      object.getWorldPosition(worldPosition);
      object.getWorldQuaternion(worldQuaternion);

      const quaternion = worldQuaternion.clone();

      results.push({
        ...metadata,

        // Actual Three.js object.
        object,

        // World-space transform.
        position: worldPosition.clone(),
        quaternion,

        // Local sticker directions transformed into world space.
        normal: localNormal
          .clone()
          .applyQuaternion(quaternion)
          .normalize(),

        right: localRight
          .clone()
          .applyQuaternion(quaternion)
          .normalize(),

        up: localUp
          .clone()
          .applyQuaternion(quaternion)
          .normalize(),
      });
    });
  }

  return results;
}

/**
 * Find a project portal using its unique project ID.
 */
export function getProjectStickerById(blockRefs, projectId) {
  if (!projectId) return null;

  return (
    getProjectStickers(blockRefs).find(
      (sticker) => sticker.id === projectId
    ) ?? null
  );
}
