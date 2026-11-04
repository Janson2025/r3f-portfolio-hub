// src/app/project/grid/engine/cubeState.js

/**
 * Creates a logical Rubik's cube state.
 *
 * Each cubie has:
 * - id: persistent identity
 * - position: integer grid coordinates
 * - orientation: a 3x3 rotation matrix
 *
 * This module is intentionally independent of React and Three.js.
 */

const IDENTITY_MATRIX = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
];

function cloneMatrix(matrix) {
  return matrix.map((row) => [...row]);
}

function cloneCubie(cubie) {
  return {
    id: cubie.id,
    originalPosition: { ...cubie.originalPosition },
    position: { ...cubie.position },
    orientation: cloneMatrix(cubie.orientation),
  };
}
/**
 * Create a solved cube.
 *
 * size = 3 creates 27 cubies.
 */
export function createCubeState(size = 3) {
  if (!Number.isInteger(size) || size < 1) {
    throw new Error("Cube size must be a positive integer.");
  }

  const cubies = [];
  let id = 0;

  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      for (let z = 0; z < size; z++) {
        const position = { x, y, z };

        cubies.push({
        id: id++,
        originalPosition: { ...position },
        position,
        orientation: cloneMatrix(IDENTITY_MATRIX),
        });
      }
    }
  }

  return {
    size,
    cubies,
  };
}

/**
 * Multiply two 3x3 matrices.
 */
function multiplyMatrices3(a, b) {
  const result = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      for (let k = 0; k < 3; k++) {
        result[row][col] += a[row][k] * b[k][col];
      }
    }
  }

  return result;
}

/**
 * Get the integer rotation matrix for a quarter turn.
 *
 * Direction:
 *  1 = positive quarter turn
 * -1 = negative quarter turn
 *
 * These conventions match the existing CodePen prototype.
 */
function getRotationMatrix3(axis, direction) {
  if (axis === "x") {
    return direction === 1
      ? [
          [1, 0, 0],
          [0, 0, -1],
          [0, 1, 0],
        ]
      : [
          [1, 0, 0],
          [0, 0, 1],
          [0, -1, 0],
        ];
  }

  if (axis === "y") {
    return direction === 1
      ? [
          [0, 0, 1],
          [0, 1, 0],
          [-1, 0, 0],
        ]
      : [
          [0, 0, -1],
          [0, 1, 0],
          [1, 0, 0],
        ];
  }

  if (axis === "z") {
    return direction === 1
      ? [
          [0, -1, 0],
          [1, 0, 0],
          [0, 0, 1],
        ]
      : [
          [0, 1, 0],
          [-1, 0, 0],
          [0, 0, 1],
        ];
  }

  throw new Error(`Unknown rotation axis: ${axis}`);
}

/**
 * Rotate a cubie's integer grid position by 90 degrees.
 */
function rotateGridPosition(position, axis, direction, size) {
  const { x, y, z } = position;
  const max = size - 1;

  if (axis === "x") {
    return direction === 1
      ? { x, y: max - z, z: y }
      : { x, y: z, z: max - y };
  }

  if (axis === "y") {
    return direction === 1
      ? { x: z, y, z: max - x }
      : { x: max - z, y, z: x };
  }

  if (axis === "z") {
    return direction === 1
      ? { x: max - y, y: x, z }
      : { x: y, y: max - x, z };
  }

  throw new Error(`Unknown rotation axis: ${axis}`);
}

/**
 * Create a normalized move description.
 *
 * layer is a zero-based grid index.
 * quarterTurns can be positive or negative.
 */
export function createMove(axis, layer, quarterTurns = 1) {
  if (!["x", "y", "z"].includes(axis)) {
    throw new Error(`Invalid rotation axis: ${axis}`);
  }

  if (!Number.isInteger(layer) || layer < 0) {
    throw new Error("Layer must be a non-negative integer.");
  }

  if (!Number.isInteger(quarterTurns)) {
    throw new Error("quarterTurns must be an integer.");
  }

  return {
    axis,
    layer,
    quarterTurns,
  };
}

/**
 * Apply a slice rotation to a cube state.
 *
 * Returns a new state rather than modifying the original.
 * This makes the engine easier to test and gives us a reliable
 * foundation for undo, redo, and move history.
 */
export function applySliceMove(state, move) {
  const { axis, layer, quarterTurns } = move;

  if (!["x", "y", "z"].includes(axis)) {
    throw new Error(`Invalid rotation axis: ${axis}`);
  }

  if (layer < 0 || layer >= state.size) {
    throw new Error(`Layer ${layer} is outside the cube.`);
  }

  if (!Number.isInteger(quarterTurns)) {
    throw new Error("quarterTurns must be an integer.");
  }

  const nextState = {
    size: state.size,
    cubies: state.cubies.map(cloneCubie),
  };

  const direction = Math.sign(quarterTurns);
  const repetitions = Math.abs(quarterTurns);

  if (repetitions === 0) {
    return nextState;
  }

  const selectedCubies = nextState.cubies.filter(
    (cubie) => cubie.position[axis] === layer
  );

  for (const cubie of selectedCubies) {
    for (let turn = 0; turn < repetitions; turn++) {
      cubie.position = rotateGridPosition(
        cubie.position,
        axis,
        direction,
        state.size
      );

      cubie.orientation = multiplyMatrices3(
        getRotationMatrix3(axis, direction),
        cubie.orientation
      );
    }
  }

  return nextState;
}