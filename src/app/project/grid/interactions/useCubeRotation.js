import * as THREE from "three";
import { useCallback, useRef } from "react";
import { useFrame } from "@react-three/fiber";

const AXES = {
  x: [1, 0, 0],
  y: [0, 1, 0],
  z: [0, 0, 1],
};

const QUARTER_TURN = Math.PI / 2;

const INITIAL_ANIMATION_STATE = {
  active: false,
  mode: null,
  axis: "x",
  layer: 0,
  direction: 1,
  angle: 0,
  fromAngle: 0,
  targetAngle: 0,
  quarterTurns: 0,
  elapsed: 0,
  duration: 250,
};

function easeInOutCubic(t) {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Animated and manually controlled cube slice rotation.
 *
 * The cube engine remains the source of truth.
 * The pivot group is used only for visual rotation.
 *
 * Supports:
 * - Fixed quarter-turn rotations (keyboard/buttons).
 * - Manual pointer-driven rotation.
 * - Snapping and committing a dragged rotation.
 */
export default function useCubeRotation({
  cubeRootRef,
  pivotRef,
  getBlocks,
  engine,
  onMoveComplete,
  durationMs = 250,
}) {
  const animation = useRef({
    ...INITIAL_ANIMATION_STATE,
    duration: durationMs,
  });

  // --------------------------------------------------
  // State helpers
  // --------------------------------------------------

  const rotating = useCallback(
    () => animation.current.active,
    []
  );

  /**
   * Return all cubies from the pivot to the cube root.
   * Object3D.attach preserves their world transforms.
   */
  const restorePivot = useCallback(() => {
    const root = cubeRootRef.current;
    const pivot = pivotRef.current;

    if (!root || !pivot) return;

    while (pivot.children.length > 0) {
      root.attach(pivot.children[0]);
    }

    pivot.position.set(0, 0, 0);
    pivot.rotation.set(0, 0, 0);
    pivot.quaternion.identity();

    pivot.updateMatrixWorld(true);
  }, [cubeRootRef, pivotRef]);

  /**
   * Begin a rotation by selecting the current slice
   * and attaching its cubies to the pivot.
   */
  const beginRotation = useCallback(
    (axis, layer, mode) => {
      const root = cubeRootRef.current;
      const pivot = pivotRef.current;

      if (!root || !pivot || !engine) return false;
      if (animation.current.active) return false;

      if (!["x", "y", "z"].includes(axis)) {
        throw new Error(`Invalid rotation axis: ${axis}`);
      }

      const size = engine.getState().size;

      if (!Number.isInteger(layer) || layer < 0 || layer >= size) {
        throw new Error(`Invalid layer index: ${layer}`);
      }

      if (durationMs <= 0) {
        throw new Error("Animation duration must be positive.");
      }

      restorePivot();

      const axisIndex = {
        x: 0,
        y: 1,
        z: 2,
      }[axis];

      // Select cubies using their current logical positions.
      const selectedBlocks = getBlocks().filter((block) => {
        const object = block.ref?.current;

        return (
          object &&
          object.userData?.ijk?.[axisIndex] === layer
        );
      });

      // A complete slice must contain size² cubies.
      if (selectedBlocks.length !== size * size) {
        console.error(
          "Cube rotation aborted: incomplete slice selection.",
          {
            axis,
            layer,
            expected: size * size,
            found: selectedBlocks.length,
          }
        );

        return false;
      }

      // Attach selected cubies while preserving world transforms.
      for (const block of selectedBlocks) {
        pivot.attach(block.ref.current);
      }

      pivot.updateMatrixWorld(true);

      animation.current = {
        active: true,
        mode,
        axis,
        layer,
        direction: 1,
        angle: 0,
        fromAngle: 0,
        targetAngle: 0,
        quarterTurns: 0,
        elapsed: 0,
        duration: durationMs,
      };

      return true;
    },
    [
      cubeRootRef,
      pivotRef,
      getBlocks,
      engine,
      durationMs,
      restorePivot,
    ]
  );

  // --------------------------------------------------
  // Finish and commit rotation
  // --------------------------------------------------

  const finishRotation = useCallback(
    (quarterTurns) => {
      const state = animation.current;

      if (!state.active) return;

      // Commit only actual quarter-turn movements.
      if (quarterTurns !== 0) {
        engine.move({
          axis: state.axis,
          layer: state.layer,
          quarterTurns,
        });
      }

      // Restore cubies before React applies new transforms.
      restorePivot();

      animation.current = {
        ...INITIAL_ANIMATION_STATE,
        duration: durationMs,
      };

      if (quarterTurns !== 0) {
        onMoveComplete?.();
      }
    },
    [engine, restorePivot, onMoveComplete, durationMs]
  );

  // --------------------------------------------------
  // Fixed quarter-turn rotation
  // --------------------------------------------------

  const rotate = useCallback(
    (axis, layer, direction = 1) => {
      if (direction !== 1 && direction !== -1) {
        throw new Error("Direction must be 1 or -1.");
      }

      const started = beginRotation(axis, layer, "turn");

      if (!started) return false;

      const state = animation.current;

      state.direction = direction;
      state.quarterTurns = direction;
      state.targetAngle = direction * QUARTER_TURN;

      return true;
    },
    [beginRotation]
  );

  // --------------------------------------------------
  // Manual pointer rotation
  // --------------------------------------------------

  /**
   * Begin a manually controlled slice rotation.
   */
  const beginDrag = useCallback(
    (axis, layer) => {
      return beginRotation(axis, layer, "drag");
    },
    [beginRotation]
  );

  /**
   * Update the current drag angle in radians.
   *
   * Positive and negative angles are both supported.
   */
  const updateDrag = useCallback(
    (angle) => {
      const state = animation.current;
      const pivot = pivotRef.current;

      if (!state.active || state.mode !== "drag" || !pivot) {
        return false;
      }

      if (!Number.isFinite(angle)) return false;

      state.angle = angle;

      pivot.quaternion.setFromAxisAngle(
        new THREE.Vector3(...AXES[state.axis]),
        angle
      );

      return true;
    },
    [pivotRef]
  );

  /**
   * Snap a manually rotated slice to its nearest
   * quarter-turn and animate the remaining distance.
   */
  const finishDrag = useCallback(() => {
    const state = animation.current;

    if (!state.active || state.mode !== "drag") {
      return false;
    }

    const quarterTurns = Math.round(
      state.angle / QUARTER_TURN
    );

    state.mode = "settle";
    state.fromAngle = state.angle;
    state.targetAngle = quarterTurns * QUARTER_TURN;
    state.quarterTurns = quarterTurns;
    state.elapsed = 0;

    return true;
  }, []);

  // --------------------------------------------------
  // Animation loop
  // --------------------------------------------------

  useFrame((_, delta) => {
    const state = animation.current;

    if (!state.active || state.mode === "drag") {
      return;
    }

    const pivot = pivotRef.current;

    if (!pivot) return;

    state.elapsed += delta;

    const progress = Math.min(
      state.elapsed / (state.duration / 1000),
      1
    );

    const eased = easeInOutCubic(progress);

    let angle;

    if (state.mode === "turn") {
      angle = state.targetAngle * eased;
    } else {
      angle =
        state.fromAngle +
        (state.targetAngle - state.fromAngle) * eased;
    }

    pivot.quaternion.setFromAxisAngle(
      new THREE.Vector3(...AXES[state.axis]),
      angle
    );

    if (progress < 1) return;

    // Finish at the exact target angle.
    pivot.quaternion.setFromAxisAngle(
      new THREE.Vector3(...AXES[state.axis]),
      state.targetAngle
    );

    finishRotation(state.quarterTurns);
  });

  return {
    rotate,
    rotating,

    beginDrag,
    updateDrag,
    finishDrag,
  };
}
