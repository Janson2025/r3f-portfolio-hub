
import * as THREE from "three";

/**
 * Local face directions.
 *
 * These match the face conventions in:
 * src/app/project/block/constrants.js
 */
export const FACE_DIRECTIONS = {
  front: new THREE.Vector3(0, 0, 1),
  back: new THREE.Vector3(0, 0, -1),
  right: new THREE.Vector3(1, 0, 0),
  left: new THREE.Vector3(-1, 0, 0),
  top: new THREE.Vector3(0, 1, 0),
  bottom: new THREE.Vector3(0, -1, 0),
};

const WORLD_DIRECTIONS = {
  front: new THREE.Vector3(0, 0, 1),
  back: new THREE.Vector3(0, 0, -1),
  right: new THREE.Vector3(1, 0, 0),
  left: new THREE.Vector3(-1, 0, 0),
  top: new THREE.Vector3(0, 1, 0),
  bottom: new THREE.Vector3(0, -1, 0),
};

const EPSILON = 0.0001;

/**
 * Convert a logical 3x3 orientation matrix into a Three.js Matrix4.
 *
 * The matrix convention matches the CodePen implementation:
 * orientation transforms local directions into world directions.
 */
export function orientationToMatrix4(orientation) {
  if (
    !Array.isArray(orientation) ||
    orientation.length !== 3 ||
    orientation.some((row) => !Array.isArray(row) || row.length !== 3)
  ) {
    throw new Error("Invalid orientation matrix.");
  }

  return new THREE.Matrix4().set(
    orientation[0][0], orientation[0][1], orientation[0][2], 0,
    orientation[1][0], orientation[1][1], orientation[1][2], 0,
    orientation[2][0], orientation[2][1], orientation[2][2], 0,
    0, 0, 0, 1
  );
}

/**
 * Convert a logical orientation matrix into a Three.js quaternion.
 *
 * Use this to orient a rendered cubie.
 */
export function orientationToQuaternion(orientation) {
  return new THREE.Quaternion().setFromRotationMatrix(
    orientationToMatrix4(orientation)
  );
}

/**
 * Get the current world-space direction of an original face.
 *
 * Example:
 * getWorldFaceDirection(orientation, "front")
 *
 * If the cubie has rotated, its original front face might now
 * point upward, downward, or in another direction.
 */
export function getWorldFaceDirection(orientation, face) {
  const localDirection = FACE_DIRECTIONS[face];

  if (!localDirection) {
    throw new Error(`Unknown face: ${face}`);
  }

  return localDirection
    .clone()
    .applyMatrix4(orientationToMatrix4(orientation))
    .normalize();
}

/**
 * Determine which original face currently points in a given
 * world-space direction.
 *
 * Example:
 * getOriginalFaceForWorldDirection(orientation, "top")
 *
 * This tells us which original sticker should appear on top.
 */
export function getOriginalFaceForWorldDirection(
  orientation,
  worldDirection
) {
  const target =
    typeof worldDirection === "string"
      ? WORLD_DIRECTIONS[worldDirection]?.clone()
      : worldDirection?.clone();

  if (!target || target.lengthSq() < EPSILON) {
    throw new Error("Invalid world direction.");
  }

  target.normalize();

  let bestFace = null;
  let bestDot = -Infinity;

  for (const face of Object.keys(FACE_DIRECTIONS)) {
    const direction = getWorldFaceDirection(orientation, face);
    const dot = direction.dot(target);

    if (dot > bestDot) {
      bestDot = dot;
      bestFace = face;
    }
  }

  if (bestDot < 1 - EPSILON) {
    throw new Error("World direction does not match a cubie face.");
  }

  return bestFace;
}

/**
 * Build a mapping of current world-facing sides to original faces.
 *
 * Example result:
 * {
 *   front: "left",
 *   back: "right",
 *   right: "front",
 *   left: "back",
 *   top: "top",
 *   bottom: "bottom"
 * }
 *
 * This is especially useful for preserving original sticker
 * and project-portal identities after cube rotations.
 */
export function getWorldFaceMap(orientation) {
  return Object.fromEntries(
    Object.keys(WORLD_DIRECTIONS).map((worldFace) => [
      worldFace,
      getOriginalFaceForWorldDirection(orientation, worldFace),
    ])
  );
}

/**
 * Compare two orientations using their rotation matrices.
 */
export function orientationsEqual(a, b, tolerance = EPSILON) {
  if (
    !Array.isArray(a) ||
    !Array.isArray(b) ||
    a.length !== 3 ||
    b.length !== 3
  ) {
    return false;
  }

  for (let row = 0; row < 3; row++) {
    if (!Array.isArray(a[row]) || !Array.isArray(b[row])) {
      return false;
    }

    for (let col = 0; col < 3; col++) {
      if (Math.abs(a[row][col] - b[row][col]) > tolerance) {
        return false;
      }
    }
  }

  return true;
}
