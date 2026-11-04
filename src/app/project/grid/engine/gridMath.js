
/**
 * Grid and world-coordinate utilities for the cube engine.
 *
 * Logical coordinates are zero-based integers.
 * World coordinates are centered around the origin.
 */

/**
 * Convert logical grid coordinates into centered world coordinates.
 */
export function gridToWorld(position, size, spacing = 1.03) {
  const offset = (size - 1) / 2;

  return {
    x: (position.x - offset) * spacing,
    y: (position.y - offset) * spacing,
    z: (position.z - offset) * spacing,
  };
}

/**
 * Convert world coordinates back into logical grid coordinates.
 */
export function worldToGrid(position, size, spacing = 1.03) {
  const offset = (size - 1) / 2;

  return {
    x: Math.round(position.x / spacing + offset),
    y: Math.round(position.y / spacing + offset),
    z: Math.round(position.z / spacing + offset),
  };
}

/**
 * Return all cubies belonging to a given slice.
 */
export function getSliceCubies(state, axis, layer) {
  if (!["x", "y", "z"].includes(axis)) {
    throw new Error(`Invalid slice axis: ${axis}`);
  }

  if (!Number.isInteger(layer) || layer < 0 || layer >= state.size) {
    throw new Error(`Invalid slice layer: ${layer}`);
  }

  return state.cubies.filter(
    (cubie) => cubie.position[axis] === layer
  );
}

/**
 * Return the world-space center of a slice.
 */
export function getSliceWorldPosition(
  axis,
  layer,
  size,
  spacing = 1.03
) {
  if (!["x", "y", "z"].includes(axis)) {
    throw new Error(`Invalid slice axis: ${axis}`);
  }

  const offset = (size - 1) / 2;
  const coordinate = (layer - offset) * spacing;

  return {
    x: axis === "x" ? coordinate : 0,
    y: axis === "y" ? coordinate : 0,
    z: axis === "z" ? coordinate : 0,
  };
}

/**
 * Convert an axis and layer index into a readable label.
 *
 * Example: x, 0, 3 => X Left
 */
export function getSliceLabel(axis, layer, size) {
  if (!["x", "y", "z"].includes(axis)) {
    throw new Error(`Invalid slice axis: ${axis}`);
  }

  if (!Number.isInteger(layer) || layer < 0 || layer >= size) {
    throw new Error(`Invalid slice layer: ${layer}`);
  }

  const names = {
    x: ["Left", "Middle", "Right"],
    y: ["Bottom", "Middle", "Top"],
    z: ["Back", "Middle", "Front"],
  };

  if (size === 3) {
    return `${axis.toUpperCase()} ${names[axis][layer]}`;
  }

  return `${axis.toUpperCase()} ${layer}`;
}
