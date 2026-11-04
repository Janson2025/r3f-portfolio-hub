import test from "node:test";
import assert from "node:assert/strict";

import { createCubeEngine } from "../src/app/project/grid/engine/cubeEngine.js";
import {
  createCubeState,
  applySliceMove,
} from "../src/app/project/grid/engine/cubeState.js";
import { validateCubeState } from "../src/app/project/grid/engine/cubeValidation.js";
import { invertMoveSequence } from "../src/app/project/grid/engine/moveNotation.js";

// --------------------------------------------------
// Test helpers
// --------------------------------------------------

/**
 * Create a comparable snapshot of a cube state.
 * Sorting by ID ensures cubie array ordering doesn't
 * affect comparisons.
 */
function snapshot(state) {
  return state.cubies
    .map((cubie) => ({
      id: cubie.id,
      originalPosition: { ...cubie.originalPosition },
      position: { ...cubie.position },
      orientation: cubie.orientation.map((row) => [...row]),
    }))
    .sort((a, b) => a.id - b.id);
}

/**
 * Validate the cube and check its fundamental invariants.
 */
function assertValid(engine) {
  const result = engine.validate();

  assert.equal(
    result.valid,
    true,
    result.errors.join("\n")
  );

  const state = engine.getState();

  assert.equal(state.cubies.length, state.size ** 3);

  const ids = new Set(
    state.cubies.map((cubie) => cubie.id)
  );

  const positions = new Set(
    state.cubies.map(
      ({ position }) =>
        `${position.x},${position.y},${position.z}`
    )
  );

  assert.equal(
    ids.size,
    state.size ** 3,
    "Cubie IDs must be unique."
  );

  assert.equal(
    positions.size,
    state.size ** 3,
    "Cubie positions must be unique."
  );
}

// --------------------------------------------------
// Test 1: Initial cube state
// --------------------------------------------------

test("a new cube has the expected number of cubies and a valid solved state", () => {
  for (const size of [1, 2, 3, 4, 5]) {
    const engine = createCubeEngine(size);

    assert.equal(
      engine.getState().cubies.length,
      size ** 3
    );

    assertValid(engine);

    assert.equal(engine.canUndo(), false);
    assert.equal(engine.canRedo(), false);
    assert.equal(engine.getMoveCount(), 0);
  }
});

// --------------------------------------------------
// Test 2: Four rotations restore the original state
// --------------------------------------------------

test("four quarter-turns restore every slice on every axis", () => {
  for (const axis of ["x", "y", "z"]) {
    for (let layer = 0; layer < 3; layer++) {
      const engine = createCubeEngine(3);
      const initial = snapshot(engine.getState());

      for (let turn = 0; turn < 4; turn++) {
        engine.move({
          axis,
          layer,
          quarterTurns: 1,
        });

        assertValid(engine);
      }

      assert.deepEqual(
        snapshot(engine.getState()),
        initial,
        `${axis.toUpperCase()} layer ${layer}`
      );
    }
  }
});

// --------------------------------------------------
// Test 3: A move followed by its inverse
// --------------------------------------------------

test("a move followed by its inverse restores the complete state", () => {
  for (const axis of ["x", "y", "z"]) {
    for (let layer = 0; layer < 3; layer++) {
      const engine = createCubeEngine(3);
      const initial = snapshot(engine.getState());

      engine.move({
        axis,
        layer,
        quarterTurns: 1,
      });

      engine.move({
        axis,
        layer,
        quarterTurns: -1,
      });

      assert.deepEqual(
        snapshot(engine.getState()),
        initial
      );

      assertValid(engine);
    }
  }
});

// --------------------------------------------------
// Test 4: Multiple axes and reversed move sequence
// --------------------------------------------------

test("a mixed-axis sequence followed by its reversed inverse restores the state", () => {
  const engine = createCubeEngine(3);
  const initial = snapshot(engine.getState());

  const moves = [
    { axis: "x", layer: 0, quarterTurns: 1 },
    { axis: "y", layer: 1, quarterTurns: -1 },
    { axis: "z", layer: 2, quarterTurns: 1 },
    { axis: "x", layer: 2, quarterTurns: -1 },
    { axis: "y", layer: 0, quarterTurns: 1 },
    { axis: "z", layer: 1, quarterTurns: 1 },
  ];

  engine.applyMoves(moves);

  assertValid(engine);

  engine.applyMoves(
    invertMoveSequence(moves, 3)
  );

  assert.deepEqual(
    snapshot(engine.getState()),
    initial
  );

  assertValid(engine);
});

// --------------------------------------------------
// Test 5: Undo and redo
// --------------------------------------------------

test("undo and redo restore the expected states and history counts", () => {
  const engine = createCubeEngine(3);
  const initial = snapshot(engine.getState());

  engine.move({
    axis: "x",
    layer: 0,
    quarterTurns: 1,
  });

  const afterFirst = snapshot(engine.getState());

  engine.move({
    axis: "y",
    layer: 2,
    quarterTurns: -1,
  });

  const afterSecond = snapshot(engine.getState());

  assert.equal(engine.getMoveCount(), 2);
  assert.equal(engine.canUndo(), true);

  engine.undo();

  assert.deepEqual(
    snapshot(engine.getState()),
    afterFirst
  );

  assert.equal(engine.canRedo(), true);
  assert.equal(engine.getMoveCount(), 1);

  engine.redo();

  assert.deepEqual(
    snapshot(engine.getState()),
    afterSecond
  );

  assert.equal(engine.canRedo(), false);
  assert.equal(engine.getMoveCount(), 2);

  engine.undo();
  engine.undo();

  assert.deepEqual(
    snapshot(engine.getState()),
    initial
  );

  assert.equal(engine.canUndo(), false);

  assertValid(engine);
});

// --------------------------------------------------
// Test 6: New moves invalidate redo history
// --------------------------------------------------

test("a new move after undo clears redo history", () => {
  const engine = createCubeEngine(3);

  engine.move({
    axis: "x",
    layer: 0,
    quarterTurns: 1,
  });

  engine.undo();

  assert.equal(engine.canRedo(), true);

  engine.move({
    axis: "z",
    layer: 1,
    quarterTurns: 1,
  });

  assert.equal(engine.canRedo(), false);

  assertValid(engine);
});

// --------------------------------------------------
// Test 7: Invalid batches are rejected safely
// --------------------------------------------------

test("invalid move batches do not partially change state or history", () => {
  const engine = createCubeEngine(3);
  const initial = snapshot(engine.getState());

  assert.throws(() =>
    engine.applyMoves([
      {
        axis: "x",
        layer: 0,
        quarterTurns: 1,
      },
      {
        axis: "q",
        layer: 1,
        quarterTurns: 1,
      },
    ])
  );

  assert.deepEqual(
    snapshot(engine.getState()),
    initial
  );

  assert.equal(engine.getMoveCount(), 0);

  assertValid(engine);
});

// --------------------------------------------------
// Test 8: Defensive copies
// --------------------------------------------------

test("returned states and histories cannot mutate the engine internals", () => {
  const engine = createCubeEngine(3);

  const externalState = engine.getState();

  externalState.cubies[0].position.x = 99;
  externalState.cubies[0].orientation[0][0] = 99;

  assertValid(engine);

  assert.notEqual(
    engine.getState().cubies[0].position.x,
    99
  );

  engine.move({
    axis: "y",
    layer: 1,
    quarterTurns: 1,
  });

  const externalHistory = engine.getHistory();

  externalHistory[0].move.layer = 99;

  assert.notEqual(
    engine.getHistory()[0].move.layer,
    99
  );
});

// --------------------------------------------------
// Test 9: Zero and full rotations
// --------------------------------------------------

test("zero and full-turn moves do not alter the cube or add history", () => {
  const engine = createCubeEngine(3);
  const initial = snapshot(engine.getState());

  engine.move({
    axis: "x",
    layer: 0,
    quarterTurns: 0,
  });

  engine.move({
    axis: "y",
    layer: 1,
    quarterTurns: 4,
  });

  engine.move({
    axis: "z",
    layer: 2,
    quarterTurns: -4,
  });

  assert.deepEqual(
    snapshot(engine.getState()),
    initial
  );

  assert.equal(engine.getMoveCount(), 0);

  assertValid(engine);
});

// --------------------------------------------------
// Test 10: Long deterministic move sequence
// --------------------------------------------------

test("a deterministic long move sequence preserves cube integrity", () => {
  const engine = createCubeEngine(3);

  let seed = 20261103;

  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };

  const axes = ["x", "y", "z"];

  for (let index = 0; index < 250; index++) {
    const axis = axes[
      Math.floor(random() * axes.length)
    ];

    const layer = Math.floor(random() * 3);

    const quarterTurns = random() < 0.5 ? -1 : 1;

    engine.move({
      axis,
      layer,
      quarterTurns,
    });

    assertValid(engine);
  }

  assert.equal(engine.getMoveCount(), 250);
});

// --------------------------------------------------
// Test 11: Pure state operations
// --------------------------------------------------

test("the pure state operation leaves its input state unchanged", () => {
  const original = createCubeState(3);

  const before = snapshot(original);

  const next = applySliceMove(original, {
    axis: "y",
    layer: 1,
    quarterTurns: 1,
  });

  assert.deepEqual(
    snapshot(original),
    before
  );

  assert.notDeepEqual(
    snapshot(next),
    before
  );

  assert.equal(
    validateCubeState(next).valid,
    true
  );
});

// --------------------------------------------------
// Test 12: Clear history without changing cube state
// --------------------------------------------------

test("clearHistory removes undo and redo history without changing the current cube state", () => {
  const engine = createCubeEngine(3);

  engine.move({
    axis: "x",
    layer: 0,
    quarterTurns: 1,
  });

  engine.move({
    axis: "y",
    layer: 2,
    quarterTurns: -1,
  });

  // Undo one move so both history stacks contain entries.
  engine.undo();

  const stateBeforeClear = snapshot(engine.getState());

  assert.equal(engine.canUndo(), true);
  assert.equal(engine.canRedo(), true);

  engine.clearHistory();

  assert.deepEqual(
    snapshot(engine.getState()),
    stateBeforeClear,
    "Clearing history must not change the cube arrangement."
  );

  assert.deepEqual(engine.getHistory(), []);
  assert.deepEqual(engine.getRedoHistory(), []);

  assert.equal(engine.canUndo(), false);
  assert.equal(engine.canRedo(), false);
  assert.equal(engine.getMoveCount(), 0);

  assertValid(engine);
});