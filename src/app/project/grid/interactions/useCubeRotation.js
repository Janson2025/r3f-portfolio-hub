
import * as THREE from "three";
import { useCallback, useRef } from "react";
import { useFrame } from "@react-three/fiber";

const AXES = {
  x: new THREE.Vector3(1, 0, 0),
  y: new THREE.Vector3(0, 1, 0),
  z: new THREE.Vector3(0, 0, 1),
};

const VALID_AXES = ["x", "y", "z"];

const VALID_QUARTER_TURNS = [1, -1, 2, -2];

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
  commitMove: null,
  onComplete: null,
};

function easeInOutCubic(t) {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function createAnimationState(duration) {
  return {
    ...INITIAL_ANIMATION_STATE,
    duration,
  };
}

/**
 * Animated and manually controlled cube slice rotation.
 *
 * The cube engine remains the source of truth.
 * The pivot group is used only for visual rotation.
 *
 * Supports:
 * - Fixed quarter-turn rotations.
 * - Half-turn rotations.
 * - Manual pointer-driven rotations.
 * - Snapping and committing dragged rotations.
 * - Custom commit functions for undo and redo.
 *
 * Cubies are selected using their logical engine positions,
 * rather than potentially stale Three.js userData.
 */
export default function useCubeRotation({
  cubeRootRef,
  pivotRef,
  getBlocks,
  engine,
  onMoveComplete,
  durationMs = 250,
}) {
  const animation = useRef(
    createAnimationState(durationMs)
  );

  // --------------------------------------------------
  // State helpers
  // --------------------------------------------------

  const rotating = useCallback(() => {
    return animation.current.active;
  }, []);

  // --------------------------------------------------
  // Pivot management
  // --------------------------------------------------

  /**
   * Restore all cubies from the pivot to the cube root.
   *
   * Object3D.attach preserves world transforms.
   * React will subsequently apply the new logical transforms.
   */
  const restorePivot = useCallback(() => {
    const root = cubeRootRef.current;
    const pivot = pivotRef.current;

    if (!root || !pivot) return;

    root.updateMatrixWorld(true);
    pivot.updateMatrixWorld(true);

    while (pivot.children.length > 0) {
      root.attach(pivot.children[0]);
    }

    pivot.position.set(0, 0, 0);
    pivot.rotation.set(0, 0, 0);
    pivot.quaternion.identity();
    pivot.scale.set(1, 1, 1);

    pivot.updateMatrixWorld(true);
    root.updateMatrixWorld(true);
  }, [cubeRootRef, pivotRef]);

  // --------------------------------------------------
  // Begin rotation
  // --------------------------------------------------

  /**
   * Begin a rotation by selecting the current logical slice
   * and attaching its cubies to the pivot.
   */
  const beginRotation = useCallback(
    (axis, layer, mode) => {
      const root = cubeRootRef.current;
      const pivot = pivotRef.current;

      if (!root || !pivot || !engine) {
        return false;
      }

      if (animation.current.active) {
        return false;
      }

      if (!VALID_AXES.includes(axis)) {
        throw new Error(
          `Invalid rotation axis: ${axis}`
        );
      }

      if (durationMs <= 0) {
        throw new Error(
          "Animation duration must be positive."
        );
      }

      // Get the current logical cube state.
      const currentState = engine.getState();
      const size = currentState.size;

      if (
        !Number.isInteger(layer) ||
        layer < 0 ||
        layer >= size
      ) {
        throw new Error(
          `Invalid layer index: ${layer}`
        );
      }

      // Ensure the pivot is empty before starting.
      restorePivot();

      // Create a lookup using permanent cubie IDs.
      const cubiesById = new Map(
        currentState.cubies.map((cubie) => [
          cubie.id,
          cubie,
        ])
      );

      // Select cubies using their current logical positions.
      //
      // Do not use object.userData.ijk here.
      // React may not have updated that metadata yet when
      // consecutive moves are being animated.
      const selectedBlocks = getBlocks().filter(
        (block) => {
          const object = block.ref?.current;
          const cubie = cubiesById.get(block.id);

          return (
            object &&
            cubie &&
            cubie.position[axis] === layer
          );
        }
      );

      // A complete slice must contain size² cubies.
      if (selectedBlocks.length !== size * size) {
        console.error(
          "[Cube rotation] Incomplete slice selection.",
          {
            axis,
            layer,
            expected: size * size,
            found: selectedBlocks.length,
            logicalCubieCount: currentState.cubies.length,
          }
        );

        return false;
      }

      // Attach selected cubies while preserving world transforms.
      try {
        root.updateMatrixWorld(true);

        for (const block of selectedBlocks) {
          pivot.attach(block.ref.current);
        }

        pivot.updateMatrixWorld(true);
      } catch (error) {
        console.error(
          "[Cube rotation] Failed to attach slice to pivot.",
          error
        );

        restorePivot();

        return false;
      }

      animation.current = {
        ...createAnimationState(durationMs),
        active: true,
        mode,
        axis,
        layer,
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

  /**
   * Complete an animation and commit its result to the engine.
   *
   * A custom commit function allows undo and redo to update
   * existing history instead of creating new history entries.
   */
  const finishRotation = useCallback(
    (quarterTurns) => {
      const state = animation.current;

      if (!state.active) return;

      const move = {
        axis: state.axis,
        layer: state.layer,
        quarterTurns,
      };

      const onComplete = state.onComplete;

      try {
        // Commit only actual quarter-turn movements.
        if (quarterTurns !== 0) {
          if (typeof state.commitMove === "function") {
            state.commitMove(move);
          } else {
            engine.move(move);
          }
        }
      } catch (error) {
        console.error(
          "[Cube rotation] Failed to commit move.",
          move,
          error
        );

        // Restore the scene before propagating the error.
        restorePivot();

        animation.current = createAnimationState(
          durationMs
        );

        throw error;
      }

      // Restore cubies before React applies their new transforms.
      restorePivot();

      // Mark the animation as finished.
      animation.current = createAnimationState(
        durationMs
      );

      if (quarterTurns !== 0) {
        onMoveComplete?.();
      }

      // Notify the caller after the animation has finished.
      //
      // For sequences, the caller should wait for React's
      // updated render before starting the next rotation.
      onComplete?.(quarterTurns);
    },
    [
      engine,
      restorePivot,
      onMoveComplete,
      durationMs,
    ]
  );

  // --------------------------------------------------
  // Fixed quarter-turn rotation
  // --------------------------------------------------

  /**
   * Animate a slice rotation.
   *
   * quarterTurns:
   *   1  = positive quarter-turn
   *  -1  = negative quarter-turn
   *   2  = positive half-turn
   *  -2  = negative half-turn
   *
   * options.commitMove:
   *   Optional custom engine commit function.
   *
   * options.onComplete:
   *   Optional completion callback.
   */
  const rotate = useCallback(
    (
      axis,
      layer,
      quarterTurns = 1,
      options = {}
    ) => {
      if (!VALID_QUARTER_TURNS.includes(quarterTurns)) {
        throw new Error(
          "quarterTurns must be 1, -1, 2, or -2."
        );
      }

      const moveDuration = options.durationMs ?? durationMs;

      if (!Number.isFinite(moveDuration) || moveDuration <= 0) {
        throw new Error("Rotation duration must be positive.");
      }

      const started = beginRotation(
        axis,
        layer,
        "turn"
      );

      if (!started) return false;

      const state = animation.current;

      state.duration = moveDuration;
      state.direction = Math.sign(quarterTurns);
      state.quarterTurns = quarterTurns;

      state.targetAngle =
        quarterTurns * QUARTER_TURN;

      state.commitMove = options.commitMove ?? null;
      state.onComplete = options.onComplete ?? null;

      return true;
    },
    [beginRotation, durationMs]
  );

  // --------------------------------------------------
  // Manual pointer rotation
  // --------------------------------------------------

  /**
   * Begin a manually controlled slice rotation.
   */
  const beginDrag = useCallback(
    (axis, layer) => {
      return beginRotation(
        axis,
        layer,
        "drag"
      );
    },
    [beginRotation]
  );

  /**
   * Update the current drag angle in radians.
   *
   * Positive and negative angles are supported.
   */
  const updateDrag = useCallback(
    (angle) => {
      const state = animation.current;
      const pivot = pivotRef.current;

      if (
        !state.active ||
        state.mode !== "drag" ||
        !pivot
      ) {
        return false;
      }

      if (!Number.isFinite(angle)) {
        return false;
      }

      state.angle = angle;

      pivot.quaternion.setFromAxisAngle(
        AXES[state.axis],
        angle
      );

      pivot.updateMatrixWorld(true);

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

    if (
      !state.active ||
      state.mode !== "drag"
    ) {
      return false;
    }

    const quarterTurns = Math.round(
      state.angle / QUARTER_TURN
    );

    state.mode = "settle";
    state.fromAngle = state.angle;

    state.targetAngle =
      quarterTurns * QUARTER_TURN;

    state.quarterTurns = quarterTurns;
    state.elapsed = 0;

    return true;
  }, []);

  // --------------------------------------------------
  // Animation loop
  // --------------------------------------------------

  useFrame((_, delta) => {
    const state = animation.current;

    if (
      !state.active ||
      state.mode === "drag"
    ) {
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
        (state.targetAngle - state.fromAngle) *
          eased;
    }

    pivot.quaternion.setFromAxisAngle(
      AXES[state.axis],
      angle
    );

    if (progress < 1) return;

    // Finish at the exact target angle.
    pivot.quaternion.setFromAxisAngle(
      AXES[state.axis],
      state.targetAngle
    );

    pivot.updateMatrixWorld(true);

    finishRotation(state.quarterTurns);
  });

  // --------------------------------------------------
  // Public API
  // --------------------------------------------------

  return {
    rotate,
    rotating,

    beginDrag,
    updateDrag,
    finishDrag,
  };
}
