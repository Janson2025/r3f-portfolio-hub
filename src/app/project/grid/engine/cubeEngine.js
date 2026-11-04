import {
  createCubeState,
  applySliceMove,
} from "./cubeState.js";

import {
  assertCubeState,
  validateCubeState,
} from "./cubeValidation.js";

import {
  normalizeMove,
  invertMove,
  moveToNotation,
} from "./moveNotation.js";

/**
 * Clone a cube state so external code cannot accidentally
 * mutate the engine's internal state.
 */
function cloneState(state) {
  return {
    size: state.size,
    cubies: state.cubies.map((cubie) => ({
      id: cubie.id,
      originalPosition: { ...cubie.originalPosition },
      position: { ...cubie.position },
      orientation: cubie.orientation.map((row) => [...row]),
    })),
  };
}

/**
 * Create a logical cube engine.
 *
 * This module does not depend on React or Three.js.
 *
 * Example:
 * const cube = createCubeEngine(3);
 *
 * cube.move({ axis: "x", layer: 0, quarterTurns: 1 });
 * cube.undo();
 * cube.redo();
 */
export function createCubeEngine(size = 3) {
  let state = createCubeState(size);

  // Completed moves, ordered oldest to newest.
  let history = [];

  // Moves that have been undone and can be redone.
  let redoStack = [];

  assertCubeState(state);

  /**
   * Commit a normalized move to the internal state.
   */
  function commitMove(move, { recordHistory = true } = {}) {
    if (move.quarterTurns === 0) {
      return cloneState(state);
    }

    const nextState = applySliceMove(state, move);

    assertCubeState(nextState);

    state = nextState;

    if (recordHistory) {
      history.push({
        move: { ...move },
        notation: moveToNotation(move, size),
      });

      // A recorded user move invalidates redo history.
      redoStack = [];
    }

    return cloneState(state);
  }

  /**
   * Apply one move.
   */
  function move(moveDescription, options = {}) {
    const normalized = normalizeMove(moveDescription, size);
    return commitMove(normalized, options);
  }

  /**
   * Apply a sequence of moves.
   *
   * All moves are normalized before any are committed.
   * This prevents invalid input from partially applying
   * a sequence.
   *
   * Each move remains an individual history entry.
   */
  function applyMoves(moves) {
    if (!Array.isArray(moves)) {
      throw new Error("Moves must be supplied as an array.");
    }

    const normalizedMoves = moves.map((moveDescription) =>
      normalizeMove(moveDescription, size)
    );

    for (const moveDescription of normalizedMoves) {
      commitMove(moveDescription);
    }

    return cloneState(state);
  }

  /**
   * Undo the most recent move.
   */
  function undo() {
    const entry = history.pop();

    if (!entry) {
      return cloneState(state);
    }

    const inverse = invertMove(entry.move, size);

    const nextState = applySliceMove(state, inverse);

    assertCubeState(nextState);

    state = nextState;
    redoStack.push(entry);

    return cloneState(state);
  }

  /**
   * Redo the most recently undone move.
   */
  function redo() {
    const entry = redoStack.pop();

    if (!entry) {
      return cloneState(state);
    }

    const nextState = applySliceMove(state, entry.move);

    assertCubeState(nextState);

    state = nextState;
    history.push(entry);

    return cloneState(state);
  }

  /**
   * Clear undo/redo history without changing the current cube arrangement.
   */
  function clearHistory() {
    history = [];
    redoStack = [];

    return {
      history: getHistory(),
      redoHistory: getRedoHistory(),
    };
  }

  /**
   * Reset the cube to its solved state.
   */
  function reset() {
    state = createCubeState(size);

    history = [];
    redoStack = [];

    assertCubeState(state);

    return cloneState(state);
  }

  /**
   * Return a safe copy of the current cube state.
   */
  function getState() {
    return cloneState(state);
  }

  /**
   * Return completed move history.
   */
  function getHistory() {
    return history.map((entry) => ({
      move: { ...entry.move },
      notation: entry.notation,
    }));
  }

  /**
   * Return redo history.
   */
  function getRedoHistory() {
    return redoStack.map((entry) => ({
      move: { ...entry.move },
      notation: entry.notation,
    }));
  }

  /**
   * Validate the current state.
   */
  function validate() {
    return validateCubeState(state);
  }

  return {
    size,

    move,
    applyMoves,

    undo,
    redo,
    reset,
    clearHistory,

    getState,
    getHistory,
    getRedoHistory,

    validate,

    canUndo: () => history.length > 0,
    canRedo: () => redoStack.length > 0,

    getMoveCount: () => history.length,
  };
}