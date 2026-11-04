
import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import gridParams from "../../grid/params/grid.json";

// --------------------------------------------------
// Configuration
// --------------------------------------------------

const DEFAULT_CONFIG = {
  // Random delay between slice demonstrations (seconds).
  minInterval: 3,
  maxInterval: 6,

  // Duration of each individual quarter-turn (seconds).
  // Four turns means total animation time is approximately
  // four times this value.
  turnDuration: 1,
};

// --------------------------------------------------
// Helpers
// --------------------------------------------------

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

function createRandomMoves() {
  const axes = ["x", "y", "z"];
  const axis = axes[Math.floor(Math.random() * axes.length)];

  const size = gridParams.dimensions[0];
  const layer = Math.floor(Math.random() * size);

  const direction = Math.random() < 0.5 ? 1 : -1;

  return Array.from({ length: 4 }, () => ({
    axis,
    layer,
    quarterTurns: direction,
  }));
}

/**
 * Occasionally performs a complete slice rotation.
 *
 * Uses GridCube's existing sequence API.
 * Idle rotations do not create undo-history entries.
 */
export default function CubeIdleSliceAnimation({
  gridRef,
  enabled = true,

  minInterval = DEFAULT_CONFIG.minInterval,
  maxInterval = DEFAULT_CONFIG.maxInterval,

  turnDuration = DEFAULT_CONFIG.turnDuration,

  onActiveChange,
}) {
  const state = useRef({
    lastInteraction: 0,
    nextInterval: randomRange(minInterval, maxInterval),
    active: false,
  });

  // --------------------------------------------------
  // Interaction detection
  // --------------------------------------------------

  useEffect(() => {
    const animation = state.current;
    animation.lastInteraction = performance.now();

    const registerInteraction = () => {
      if (!animation.active) {
        animation.lastInteraction = performance.now();
      }
    };

    const registerPointerMove = (event) => {
      if (event.buttons !== 0) {
        registerInteraction();
      }
    };

    window.addEventListener("pointerdown", registerInteraction);
    window.addEventListener("pointermove", registerPointerMove);
    window.addEventListener("keydown", registerInteraction);
    window.addEventListener("wheel", registerInteraction);

    return () => {
      window.removeEventListener("pointerdown", registerInteraction);
      window.removeEventListener("pointermove", registerPointerMove);
      window.removeEventListener("keydown", registerInteraction);
      window.removeEventListener("wheel", registerInteraction);
    };
  }, []);

  // --------------------------------------------------
  // Animation scheduling
  // --------------------------------------------------

  useFrame(() => {
    const animation = state.current;

    if (!enabled || animation.active) return;

    const now = performance.now();

    const elapsed =
      (now - animation.lastInteraction) / 1000;

    if (elapsed < animation.nextInterval) return;

    const api = gridRef.current?.devAPI;

    if (!api || api.busy()) {
      animation.lastInteraction = now;
      return;
    }

    const moves = createRandomMoves();

    const started = api.playSequence(moves, {
      recordHistory: false,

      // The sequence uses the existing rotation system.
      // Each move is independently animated.
      durationMs: turnDuration * 1000,

      onComplete: () => {
        animation.active = false;
        animation.lastInteraction = performance.now();

        animation.nextInterval = randomRange(
          minInterval,
          maxInterval
        );

        onActiveChange?.(false);
      },
    });

    if (!started) {
      animation.lastInteraction = now;
      return;
    }

    animation.active = true;
    onActiveChange?.(true);
  });

  return null;
}
