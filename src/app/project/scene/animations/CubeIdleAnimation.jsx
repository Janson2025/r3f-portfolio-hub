
import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const ROTATION = {
  // Angular velocity in radians per second.
  minSpeed: 0.025,
  maxSpeed: 0.055,

  // How often the desired rotation direction changes.
  minDirectionDuration: 8,
  maxDirectionDuration: 16,

  // How quickly the cube transitions toward its new direction.
  directionChangeSpeed: 0.12,
};

const BOBBING = {
  x: 0.008,
  y: 0.018,
  z: 0.008,
};

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

/**
 * Creates a random angular velocity.
 *
 * The direction is distributed across all three axes.
 * Its magnitude is kept within the configured speed range.
 */
function createRandomAngularVelocity() {
  const direction = new THREE.Vector3(
    Math.random() * 2 - 1,
    Math.random() * 2 - 1,
    Math.random() * 2 - 1
  );

  if (direction.lengthSq() < 0.001) {
    direction.set(1, 0, 0);
  }

  direction.normalize();

  const speed = randomRange(
    ROTATION.minSpeed,
    ROTATION.maxSpeed
  );

  return direction.multiplyScalar(speed);
}

/**
 * Adds subtle idle movement to a target group.
 *
 * The target must be a dedicated child group, separate from
 * the group used by orbit controls or other interactions.
 *
 * Animation:
 * - Starts after a period of inactivity.
 * - Continuously rotates at a slow speed.
 * - Gradually changes its rotational direction.
 * - Gently bobs in multiple directions.
 * - Fades back to its neutral transform during interaction.
 */
export default function CubeIdleAnimation({
  targetRef,
  enabled = true,
  idleDelay = 8,
  blendRef,
}) {
  const state = useRef({
    lastInteraction: 0,
    blend: 0,

    phase: Math.random() * Math.PI * 2,

    // Current and desired angular velocity.
    angularVelocity: new THREE.Vector3(),
    targetAngularVelocity: createRandomAngularVelocity(),

    // Accumulated idle rotation.
    rotationOffset: new THREE.Vector3(),

    nextDirectionChange: 0,
  });

  // Register mouse, touch, keyboard, and scroll activity.
  useEffect(() => {
    const animation = state.current;
    animation.lastInteraction = performance.now();

    const registerInteraction = () => {
      animation.lastInteraction = performance.now();
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

  useFrame(({ clock }, delta) => {
    const group = targetRef.current;
    const animation = state.current;

    if (!group) return;

    const now = performance.now();

    const elapsedSinceInteraction =
      (now - animation.lastInteraction) / 1000;

    const shouldAnimate =
      enabled && elapsedSinceInteraction >= idleDelay;

    // Smoothly fade idle movement in and out.
    animation.blend = THREE.MathUtils.damp(
      animation.blend,
      shouldAnimate ? 1 : 0,
      0.65,
      delta
    );

    if (blendRef) {
      blendRef.current = animation.blend;
    }

    const time = clock.elapsedTime;
    const blend = animation.blend;

    // Pick a new rotational direction periodically.
    if (time >= animation.nextDirectionChange) {
      animation.targetAngularVelocity.copy(
        createRandomAngularVelocity()
      );

      animation.nextDirectionChange =
        time + randomRange(
          ROTATION.minDirectionDuration,
          ROTATION.maxDirectionDuration
        );
    }

    // Gradually steer toward the new direction.
    const directionLerp =
      1 - Math.exp(-ROTATION.directionChangeSpeed * delta);

    animation.angularVelocity.lerp(
      animation.targetAngularVelocity,
      directionLerp
    );

    // Accumulate continuous rotation.
    // Multiplying by blend allows it to slow down during interaction.
    animation.rotationOffset.addScaledVector(
      animation.angularVelocity,
      delta * blend
    );

    // Layered, slow bobbing.
    const bobX =
      Math.sin(time * 0.23 + animation.phase) * BOBBING.x;

    const bobY =
      Math.sin(time * 0.48 + animation.phase * 1.4) * BOBBING.y;

    const bobZ =
      Math.sin(time * 0.31 + animation.phase * 0.7) * BOBBING.z;

    // Apply idle movement to the dedicated inner group.
    group.position.set(
      bobX * blend,
      bobY * blend,
      bobZ * blend
    );

    group.rotation.set(
      animation.rotationOffset.x * blend,
      animation.rotationOffset.y * blend,
      animation.rotationOffset.z * blend
    );
  });

  return null;
}
