
import * as THREE from "three";

const AXIS_NAMES = ["x", "y", "z"];

const MIN_ALIGNMENT = 0.15;
const PROJECTION_EPSILON = 0.01;

/**
 * Convert a grid coordinate into cube-local world coordinates.
 *
 * This follows the same positioning convention used by
 * the cube engine and the original CodePen.
 */
function gridToLocal(grid, size, spacing) {
  const center = (size - 1) / 2;

  return new THREE.Vector3(
    (grid.x - center) * spacing,
    (grid.y - center) * spacing,
    (grid.z - center) * spacing
  );
}

/**
 * Project a point from cube-local space into screen coordinates.
 *
 * Screen Y increases downward, matching pointer event coordinates.
 */
function projectCubeLocalPoint(point, cubeRoot, camera, canvas) {
  const rect = canvas.getBoundingClientRect();

  if (!rect.width || !rect.height) {
    return null;
  }

  const worldPoint = cubeRoot.localToWorld(point.clone());

  worldPoint.project(camera);

  return new THREE.Vector2(
    ((worldPoint.x + 1) * 0.5) * rect.width,
    ((1 - worldPoint.y) * 0.5) * rect.height
  );
}

/**
 * Determine the screen direction produced by a small positive
 * rotation around a particular cube-local axis.
 *
 * This is adapted from the CodePen implementation.
 */
export function getProjectedRotationDirection({
  axis,
  localPoint,
  gridPosition,
  size,
  spacing,
  cubeRoot,
  camera,
  canvas,
}) {
  if (!AXIS_NAMES.includes(axis)) return null;

  if (!cubeRoot || !camera || !canvas) {
    return null;
  }

  // Find the center of the selected slice.
  const centerGrid = {
    x: (size - 1) / 2,
    y: (size - 1) / 2,
    z: (size - 1) / 2,
  };

  centerGrid[axis] = gridPosition[axis];

  const sliceCenter = gridToLocal(
    centerGrid,
    size,
    spacing
  );

  // Determine the hit point relative to the slice's rotation axis.
  const relativePoint = localPoint
    .clone()
    .sub(sliceCenter);

  // Project the original point.
  const before = projectCubeLocalPoint(
    localPoint,
    cubeRoot,
    camera,
    canvas
  );

  if (!before) return null;

  // Apply a tiny positive rotation around the candidate axis.
  const axisVector = new THREE.Vector3(
    axis === "x" ? 1 : 0,
    axis === "y" ? 1 : 0,
    axis === "z" ? 1 : 0
  );

  const rotation = new THREE.Quaternion().setFromAxisAngle(
    axisVector,
    PROJECTION_EPSILON
  );

  const rotatedPoint = relativePoint
    .applyQuaternion(rotation)
    .add(sliceCenter);

  // Project the rotated point.
  const after = projectCubeLocalPoint(
    rotatedPoint,
    cubeRoot,
    camera,
    canvas
  );

  if (!after) return null;

  const direction = after.sub(before);

  if (direction.lengthSq() < 1e-8) {
    return null;
  }

  return direction.normalize();
}

/**
 * Determine which slice rotation best matches a screen-space swipe.
 *
 * Returns:
 * {
 *   axis: "x" | "y" | "z",
 *   layer: number,
 *   direction: 1 | -1,
 *   score: number,
 *   screenDirection: { x, y }
 * }
 *
 * Returns null when the swipe cannot be mapped confidently.
 */
export function chooseGestureRotation({
  faceNormal,
  hitPoint,
  gridPosition,
  deltaX,
  deltaY,
  size,
  spacing,
  cubeRoot,
  camera,
  canvas,
}) {
  const swipe = new THREE.Vector2(deltaX, deltaY);

  if (swipe.lengthSq() < 1e-8) {
    return null;
  }

  swipe.normalize();

  // Identify the axis perpendicular to the selected face.
  // We exclude this axis because rotating around it would
  // rotate the sticker directly toward or away from the user.
  const normalAxis =
    Math.abs(faceNormal.x) > 0.5
      ? "x"
      : Math.abs(faceNormal.y) > 0.5
        ? "y"
        : "z";

  let best = null;

  for (const axis of AXIS_NAMES) {
    if (axis === normalAxis) {
      continue;
    }

    const positiveDirection = getProjectedRotationDirection({
      axis,
      localPoint: hitPoint,
      gridPosition,
      size,
      spacing,
      cubeRoot,
      camera,
      canvas,
    });

    if (!positiveDirection) {
      continue;
    }

    // Compare the user's swipe with the projected positive rotation.
    const alignment = positiveDirection.dot(swipe);

    // Absolute alignment determines which axis best matches.
    const score = Math.abs(alignment);

    if (!best || score > best.score) {
      best = {
        axis,
        layer: gridPosition[axis],
        direction: alignment >= 0 ? 1 : -1,
        score,
        screenDirection: {
          x: positiveDirection.x,
          y: positiveDirection.y,
        },
      };
    }
  }

  if (!best || best.score < MIN_ALIGNMENT) {
    return null;
  }

  return best;
}
