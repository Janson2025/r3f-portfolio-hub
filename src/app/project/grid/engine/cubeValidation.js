
/**
 * Validates the logical structure of a cube state.
 *
 * Returns:
 * {
 *   valid: boolean,
 *   errors: string[]
 * }
 */

function isIntegerVector(position) {
  return (
    position &&
    Number.isInteger(position.x) &&
    Number.isInteger(position.y) &&
    Number.isInteger(position.z)
  );
}

function positionKey(position) {
  return `${position.x},${position.y},${position.z}`;
}

function dotProduct(a, b) {
  return a.reduce((sum, value, index) => {
    return sum + value * b[index];
  }, 0);
}

function determinant3(matrix) {
  const [a, b, c] = matrix;

  return (
    a[0] * (b[1] * c[2] - b[2] * c[1]) -
    a[1] * (b[0] * c[2] - b[2] * c[0]) +
    a[2] * (b[0] * c[1] - b[1] * c[0])
  );
}

/**
 * A valid cube orientation must be a proper rotation matrix.
 *
 * Its rows must:
 * - Contain only -1, 0, or 1.
 * - Be perpendicular to one another.
 * - Have a determinant of +1.
 */
function isValidOrientation(matrix) {
  if (
    !Array.isArray(matrix) ||
    matrix.length !== 3 ||
    matrix.some(
      (row) =>
        !Array.isArray(row) ||
        row.length !== 3 ||
        row.some((value) => ![-1, 0, 1].includes(value))
    )
  ) {
    return false;
  }

  for (let row = 0; row < 3; row++) {
    for (let other = row; other < 3; other++) {
      const dot = dotProduct(matrix[row], matrix[other]);
      const expected = row === other ? 1 : 0;

      if (dot !== expected) {
        return false;
      }
    }
  }

  return determinant3(matrix) === 1;
}

export function validateCubeState(state) {
  const errors = [];

  if (
    !state ||
    !Number.isInteger(state.size) ||
    state.size < 1 ||
    !Array.isArray(state.cubies)
  ) {
    return {
      valid: false,
      errors: ["Invalid cube state structure."],
    };
  }

  const expectedCount = state.size ** 3;

  if (state.cubies.length !== expectedCount) {
    errors.push(
      `Expected ${expectedCount} cubies, found ${state.cubies.length}.`
    );
  }

  const ids = new Set();
  const positions = new Set();

  for (const cubie of state.cubies) {
    if (!cubie || cubie.id === undefined || cubie.id === null) {
      errors.push("A cubie is missing its ID.");
      continue;
    }

    if (ids.has(cubie.id)) {
      errors.push(`Duplicate cubie ID: ${cubie.id}.`);
    }

    ids.add(cubie.id);

    // Validate permanent original position.
    if (!isIntegerVector(cubie.originalPosition)) {
      errors.push(
        `Cubie ${cubie.id} has an invalid original position.`
      );
    } else {
      const { x, y, z } = cubie.originalPosition;
      const max = state.size - 1;

      if (
        x < 0 || x > max ||
        y < 0 || y > max ||
        z < 0 || z > max
      ) {
        errors.push(
          `Cubie ${cubie.id} has an original position outside the cube bounds.`
        );
      }
    }

    // Validate current position.
    if (!isIntegerVector(cubie.position)) {
      errors.push(`Cubie ${cubie.id} has an invalid position.`);
      continue;
    }

    const { x, y, z } = cubie.position;
    const max = state.size - 1;

    if (
      x < 0 || x > max ||
      y < 0 || y > max ||
      z < 0 || z > max
    ) {
      errors.push(`Cubie ${cubie.id} is outside the cube bounds.`);
    }

    const key = positionKey(cubie.position);

    if (positions.has(key)) {
      errors.push(`Multiple cubies occupy position ${key}.`);
    }

    positions.add(key);

    // Validate orientation.
    if (!isValidOrientation(cubie.orientation)) {
      errors.push(`Cubie ${cubie.id} has an invalid orientation.`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Optional convenience function for development and tests.
 */
export function assertCubeState(state) {
  const result = validateCubeState(state);

  if (!result.valid) {
    throw new Error(
      `Invalid cube state:\n${result.errors.join("\n")}`
    );
  }

  return state;
}
