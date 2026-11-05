
import * as THREE from "three";

const SAME_FACE_THRESHOLD = 0.999;
const MIN_DIRECTION_DISTANCE = 0.001;

export const EMPTY_PROJECT_NAVIGATION = Object.freeze({
  up: null,
  down: null,
  left: null,
  right: null,
});

/**
 * Find all project sticker objects beneath a root.
 */
function getProjectStickerObjects(root) {
  if (!root) return [];

  root.updateWorldMatrix(true, true);

  const stickers = [];

  root.traverse((object) => {
    const metadata = object.userData?.projectSticker;

    if (!metadata?.id) return;

    stickers.push({
      object,
      metadata,
    });
  });

  return stickers;
}

/**
 * Get the world-space position and orientation of a sticker.
 */
function getStickerTransform(object) {
  return {
    position: object.getWorldPosition(
      new THREE.Vector3()
    ),

    quaternion: object.getWorldQuaternion(
      new THREE.Quaternion()
    ),
  };
}

/**
 * Find the closest project in a particular direction
 * along the focused project's physical cube face.
 *
 * Direction is expressed using the focused sticker's
 * local coordinate system.
 */
function findDirectionalNeighbor({
  candidates,
  currentPosition,
  currentNormal,
  direction,
}) {
  let bestCandidate = null;
  let bestAngle = Infinity;
  let bestDistance = Infinity;

  for (const candidate of candidates) {
    const transform = getStickerTransform(candidate.object);

    const candidateNormal = new THREE.Vector3(0, 0, 1)
      .applyQuaternion(transform.quaternion)
      .normalize();

    // Only consider stickers on the same physical face.
    if (
      candidateNormal.dot(currentNormal) <
      SAME_FACE_THRESHOLD
    ) {
      continue;
    }

    const delta = transform.position
      .clone()
      .sub(currentPosition);

    const forwardDistance = delta.dot(direction);

    // Ignore the current sticker and projects behind us.
    if (
      forwardDistance <= MIN_DIRECTION_DISTANCE
    ) {
      continue;
    }

    // Measure how far the candidate deviates from
    // the requested direction.
    const perpendicularDistance = delta
      .clone()
      .addScaledVector(direction, -forwardDistance)
      .length();

    const angleScore =
      perpendicularDistance / forwardDistance;

    const distance = delta.length();

    const isBetter =
      angleScore < bestAngle - 0.0001 ||
      (
        Math.abs(angleScore - bestAngle) <= 0.0001 &&
        distance < bestDistance
      );

    if (!isBetter) continue;

    bestCandidate = candidate.metadata;
    bestAngle = angleScore;
    bestDistance = distance;
  }

  return bestCandidate;
}

/**
 * Calculate the four directional project neighbors
 * relative to the currently focused project.
 *
 * Returns:
 * {
 *   up: projectMetadata | null,
 *   down: projectMetadata | null,
 *   left: projectMetadata | null,
 *   right: projectMetadata | null
 * }
 */
export function getDirectionalProjectNavigation(
  root,
  currentProjectId
) {
  if (!root || !currentProjectId) {
    return EMPTY_PROJECT_NAVIGATION;
  }

  const stickers = getProjectStickerObjects(root);

  const currentSticker = stickers.find(
    ({ metadata }) => metadata.id === currentProjectId
  );

  if (!currentSticker) {
    return EMPTY_PROJECT_NAVIGATION;
  }

  const { position, quaternion } = getStickerTransform(
    currentSticker.object
  );

  const currentNormal = new THREE.Vector3(0, 0, 1)
    .applyQuaternion(quaternion)
    .normalize();

  // These directions are based on the physical
  // orientation of the currently focused sticker.
  const directions = {
    up: new THREE.Vector3(0, 1, 0),
    down: new THREE.Vector3(0, -1, 0),
    left: new THREE.Vector3(-1, 0, 0),
    right: new THREE.Vector3(1, 0, 0),
  };

  for (const direction of Object.values(directions)) {
    direction.applyQuaternion(quaternion).normalize();
  }

  const candidates = stickers.filter(
    ({ metadata }) => metadata.id !== currentProjectId
  );

  return {
    up: findDirectionalNeighbor({
      candidates,
      currentPosition: position,
      currentNormal,
      direction: directions.up,
    }),

    down: findDirectionalNeighbor({
      candidates,
      currentPosition: position,
      currentNormal,
      direction: directions.down,
    }),

    left: findDirectionalNeighbor({
      candidates,
      currentPosition: position,
      currentNormal,
      direction: directions.left,
    }),

    right: findDirectionalNeighbor({
      candidates,
      currentPosition: position,
      currentNormal,
      direction: directions.right,
    }),
  };
}
