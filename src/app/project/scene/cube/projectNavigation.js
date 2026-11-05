
import * as THREE from "three";

const SAME_FACE_THRESHOLD = 0.999;
const ADJACENT_FACE_THRESHOLD = 0.999;
const MIN_DIRECTION_DISTANCE = 0.001;

export const EMPTY_PROJECT_NAVIGATION = Object.freeze({
  up: null,
  down: null,
  left: null,
  right: null,
});

// --------------------------------------------------
// Collect project stickers
// --------------------------------------------------

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

// --------------------------------------------------
// Sticker transforms
// --------------------------------------------------

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

function getStickerNormal(quaternion) {
  return new THREE.Vector3(0, 0, 1)
    .applyQuaternion(quaternion)
    .normalize();
}

// --------------------------------------------------
// Directional search on the current face
// --------------------------------------------------

function findSameFaceNeighbor({
  candidates,
  currentPosition,
  currentNormal,
  direction,
}) {
  let bestCandidate = null;
  let bestForwardDistance = Infinity;
  let bestPerpendicularDistance = Infinity;

  for (const candidate of candidates) {
    const transform = getStickerTransform(candidate.object);

    const candidateNormal = getStickerNormal(
      transform.quaternion
    );

    // Only consider stickers on the current face.
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

    if (forwardDistance <= MIN_DIRECTION_DISTANCE) {
      continue;
    }

    const perpendicularDistance = delta
      .clone()
      .addScaledVector(direction, -forwardDistance)
      .length();

    // Prioritize the closest project in the requested
    // direction, then the closest alignment with its lane.
    const isBetter =
      forwardDistance < bestForwardDistance - 0.0001 ||
      (
        Math.abs(
          forwardDistance - bestForwardDistance
        ) <= 0.0001 &&
        perpendicularDistance < bestPerpendicularDistance
      );

    if (!isBetter) continue;

    bestCandidate = candidate.metadata;
    bestForwardDistance = forwardDistance;
    bestPerpendicularDistance = perpendicularDistance;
  }

  return bestCandidate;
}

// --------------------------------------------------
// Directional search across an adjacent face
// --------------------------------------------------

function findAdjacentFaceNeighbor({
  candidates,
  currentPosition,
  currentNormal,
  direction,
}) {
  // The direction of travel identifies the normal
  // of the adjacent face.
  const adjacentNormal = direction.clone().normalize();

  // The shared edge runs perpendicular to both normals.
  const edgeAxis = new THREE.Vector3()
    .crossVectors(currentNormal, adjacentNormal)
    .normalize();

  // Preserve the current position along the shared edge.
  const currentEdgePosition = currentPosition.dot(edgeAxis);

  let bestCandidate = null;
  let bestLaneDifference = Infinity;
  let bestEdgeDepth = Infinity;

  for (const candidate of candidates) {
    const transform = getStickerTransform(candidate.object);

    const candidateNormal = getStickerNormal(
      transform.quaternion
    );

    // Only consider stickers on the adjacent face.
    if (
      candidateNormal.dot(adjacentNormal) <
      ADJACENT_FACE_THRESHOLD
    ) {
      continue;
    }

    // ----------------------------------------------
    // Preserve the row/column across the edge.
    // ----------------------------------------------

    const candidateEdgePosition =
      transform.position.dot(edgeAxis);

    const laneDifference = Math.abs(
      candidateEdgePosition - currentEdgePosition
    );

    // ----------------------------------------------
    // Determine how far along the adjacent face
    // the candidate lies.
    // ----------------------------------------------

    // The old face's normal points toward the face
    // we just left. Therefore, the candidate closest
    // to that edge has the greatest projection onto
    // currentNormal.
    const edgeDepth = -transform.position.dot(
      currentNormal
    );

    const isBetter =
      laneDifference < bestLaneDifference - 0.0001 ||
      (
        Math.abs(
          laneDifference - bestLaneDifference
        ) <= 0.0001 &&
        edgeDepth < bestEdgeDepth
      );

    if (!isBetter) continue;

    bestCandidate = candidate.metadata;
    bestLaneDifference = laneDifference;
    bestEdgeDepth = edgeDepth;
  }

  return bestCandidate;
}

// --------------------------------------------------
// Directional neighbor
// --------------------------------------------------

function findDirectionalNeighbor({
  candidates,
  currentPosition,
  currentNormal,
  direction,
}) {
  // First search along the current face.
  const sameFaceNeighbor = findSameFaceNeighbor({
    candidates,
    currentPosition,
    currentNormal,
    direction,
  });

  if (sameFaceNeighbor) {
    return sameFaceNeighbor;
  }

  // If the current face has no project in that direction,
  // continue across the corresponding cube edge.
  return findAdjacentFaceNeighbor({
    candidates,
    currentPosition,
    currentNormal,
    direction,
  });
}

// --------------------------------------------------
// Public navigation function
// --------------------------------------------------

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

  const {
    position,
    quaternion,
  } = getStickerTransform(currentSticker.object);

  const currentNormal = getStickerNormal(quaternion);

  // Directions are defined relative to the current
  // sticker's physical orientation.
  const directions = {
    up: new THREE.Vector3(0, 1, 0),
    down: new THREE.Vector3(0, -1, 0),
    left: new THREE.Vector3(-1, 0, 0),
    right: new THREE.Vector3(1, 0, 0),
  };

  // Convert local sticker directions into world space.
  for (const direction of Object.values(directions)) {
    direction
      .applyQuaternion(quaternion)
      .normalize();
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
