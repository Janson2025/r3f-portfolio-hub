
import { useEffect, useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import BlockBody from "./BlockBody";
import StickerFace from "./StickerFace";
import useBlockStickers from "./hooks/useBlockStickers";

const IDLE_MOVEMENT = {
  minAmplitude: 0.01,
  maxAmplitude: 0.028,
  speed: 0.75,
};

// Deterministic pseudo-random value based on cubie ID.
function seededRandom(seed) {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
}

function AnimatedVisuals({ children, cubieId, position }) {
  const visualRef = useRef();

  const animation = useMemo(() => {
    const seed = Number(cubieId) || 0;

    const amplitudeRange =
      IDLE_MOVEMENT.maxAmplitude -
      IDLE_MOVEMENT.minAmplitude;

    return {
      phase: seededRandom(seed + 1) * Math.PI * 2,
      secondaryPhase: seededRandom(seed + 2) * Math.PI * 2,

      amplitude:
        IDLE_MOVEMENT.minAmplitude +
        seededRandom(seed + 3) * amplitudeRange,

      frequency:
        IDLE_MOVEMENT.speed *
        (0.7 + seededRandom(seed + 4) * 0.6),

      secondaryFrequency:
        IDLE_MOVEMENT.speed *
        (0.4 + seededRandom(seed + 5) * 0.4),
    };
  }, [cubieId]);

  // Calculate the cubie's outward direction.
  const outwardDirection = useMemo(() => {
    const direction = new THREE.Vector3(
      position[0],
      position[1],
      position[2]
    );

    if (direction.lengthSq() > 0) {
      direction.normalize();
    }

    return direction;
  }, [position]);

  useFrame(({ clock }) => {
    const visual = visualRef.current;

    if (!visual) return;

    const time = clock.elapsedTime;

    const primaryWave = Math.sin(
      time * animation.frequency + animation.phase
    );

    const secondaryWave = Math.sin(
      time * animation.secondaryFrequency +
      animation.secondaryPhase
    );

    // Combine two waves for a less mechanical movement.
    const movement =
      (primaryWave * 0.9 + secondaryWave * 0.5) *
      animation.amplitude;

    visual.position.copy(outwardDirection).multiplyScalar(movement);
  });

  return (
    <group ref={visualRef}>
      {children}
    </group>
  );
}

/**
 * One cubelet block with 0–6 stickers parented to it.
 *
 * The outer group remains controlled by the cube engine.
 * Only the inner visual group receives idle animation.
 */
export default function Block({
  position = [0, 0, 0],
  quaternion = [0, 0, 0, 1],

  size = 1,

  cubieId,
  blockIndex = [0, 0, 0],
  gridPosition = blockIndex,

  gridDims = [3, 3, 3],
  faceMap = {},

  overrides = new Map(),

  onActivateSticker,
  frameReady,
  onStickerPointerDown,

  forwardRef,
}) {
  const localRef = useRef();
  const group = forwardRef ?? localRef;

  // Keep interaction metadata synchronized with the current engine state.
  useEffect(() => {
    if (!group.current) return;

    group.current.userData.cubieId = cubieId;
    group.current.userData.ijk = [...gridPosition];
    group.current.userData.originalPosition = [...blockIndex];
    group.current.userData.faceMap = { ...faceMap };
  }, [
    cubieId,
    gridPosition,
    blockIndex,
    faceMap,
    group,
  ]);

  // Sticker identity must always use the original position.
  const stickers = useBlockStickers({
    blockIndex,
    gridDims,
    overrides,
  });

  return (
    <group
      ref={group}
      position={position}
      quaternion={quaternion}
      userData={{
        cubieId,
        ijk: gridPosition,
        originalPosition: blockIndex,
        faceMap,
      }}
    >
      <AnimatedVisuals
        cubieId={cubieId}
        position={position}
      >
        <BlockBody size={size} />

        {stickers.map((s) => (
          <StickerFace
            key={s.id}
            size={size}
            faceConfig={s}
            cubieId={cubieId}
            blockIndex={gridPosition}
            onActivateSticker={onActivateSticker}
            frameReady={frameReady}
            onPointerDown={onStickerPointerDown}
          />
        ))}
      </AnimatedVisuals>
    </group>
  );
}
