
/**
 * Move normalization and notation utilities.
 *
 * Move structure:
 * {
 *   axis: "x" | "y" | "z",
 *   layer: number,
 *   quarterTurns: number
 * }
 *
 * quarterTurns:
 *  1 = positive quarter-turn
 * -1 = negative quarter-turn
 *  2 = half-turn
 *  0 = no movement
 */

/**
 * Normalize quarter-turns into the range:
 * -2, -1, 0, 1, 2
 */
export function normalizeQuarterTurns(quarterTurns) {
  if (!Number.isInteger(quarterTurns)) {
    throw new Error("quarterTurns must be an integer.");
  }

  const normalized = ((quarterTurns % 4) + 4) % 4;

  if (normalized === 3) return -1;

  return normalized;
}

/**
 * Validate and normalize a move against a cube size.
 */
export function normalizeMove(move, size) {
  if (!move || typeof move !== "object") {
    throw new Error("A move object is required.");
  }

  if (!["x", "y", "z"].includes(move.axis)) {
    throw new Error(`Invalid rotation axis: ${move.axis}`);
  }

  if (
    !Number.isInteger(size) ||
    size < 1 ||
    !Number.isInteger(move.layer) ||
    move.layer < 0 ||
    move.layer >= size
  ) {
    throw new Error(`Invalid layer: ${move.layer}`);
  }

  return {
    axis: move.axis,
    layer: move.layer,
    quarterTurns: normalizeQuarterTurns(move.quarterTurns),
  };
}

/**
 * Return the inverse of a move.
 */
export function invertMove(move, size) {
  const normalized = normalizeMove(move, size);

  return {
    ...normalized,
    quarterTurns: normalizeQuarterTurns(
      -normalized.quarterTurns
    ),
  };
}

/**
 * Convert a normalized move into readable notation.
 *
 * Examples:
 * X:0
 * Y:1'
 * Z:2(2)
 */
export function moveToNotation(move, size) {
  const normalized = normalizeMove(move, size);

  const axis = normalized.axis.toUpperCase();
  const { layer, quarterTurns } = normalized;

  if (quarterTurns === 0) {
    return `${axis}:${layer}(0)`;
  }

  if (quarterTurns === -1) {
    return `${axis}:${layer}'`;
  }

  if (quarterTurns === 2 || quarterTurns === -2) {
    return `${axis}:${layer}(2)`;
  }

  return `${axis}:${layer}`;
}

/**
 * Parse readable move notation.
 */
export function parseMoveNotation(notation, size) {
  if (typeof notation !== "string") {
    throw new Error("Move notation must be a string.");
  }

  const match = notation.trim().match(
    /^([XYZxyz]):(\d+)(?:(')|\((0|2)\))?$/
  );

  if (!match) {
    throw new Error(`Invalid move notation: ${notation}`);
  }

  const [, axis, layerText, prime, specialTurn] = match;

  let quarterTurns = 1;

  if (prime) {
    quarterTurns = -1;
  } else if (specialTurn === "2") {
    quarterTurns = 2;
  } else if (specialTurn === "0") {
    quarterTurns = 0;
  }

  return normalizeMove(
    {
      axis: axis.toLowerCase(),
      layer: Number(layerText),
      quarterTurns,
    },
    size
  );
}

/**
 * Invert a sequence of moves.
 *
 * The order must also be reversed because the inverse of
 * A followed by B is inverse(B) followed by inverse(A).
 */
export function invertMoveSequence(moves, size) {
  return [...moves]
    .reverse()
    .map((move) => invertMove(move, size));
}
