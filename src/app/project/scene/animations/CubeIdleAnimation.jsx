
import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const ROTATION = {
  minSpeed: 0.025,
  maxSpeed: 0.055,

  minDirectionDuration: 8,
  maxDirectionDuration: 16,

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

function normalizeAngle(angle) {
  return THREE.MathUtils.euclideanModulo(
    angle + Math.PI,
    Math.PI * 2
  ) - Math.PI;
}

export default function CubeIdleAnimation({
  targetRef,
  enabled = true,
  idleDelay = 8,
  blendRef,
  freeze = false,
}) {
  const state = useRef({
    lastInteraction: 0,
    blend: 0,

    phase: Math.random() * Math.PI * 2,

    angularVelocity: new THREE.Vector3(),
    targetAngularVelocity: createRandomAngularVelocity(),

    rotationOffset: new THREE.Vector3(),

    nextDirectionChange: 0,
  });

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

    // Freeze the exact current transform during a view transition.
    // Do not fade or continue changing the inner group here.
    if (freeze) return;

    const now = performance.now();

    const elapsedSinceInteraction =
      (now - animation.lastInteraction) / 1000;

    const shouldAnimate =
      enabled && elapsedSinceInteraction >= idleDelay;

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

    const directionLerp =
      1 - Math.exp(-ROTATION.directionChangeSpeed * delta);

    animation.angularVelocity.lerp(
      animation.targetAngularVelocity,
      directionLerp
    );

    animation.rotationOffset.addScaledVector(
      animation.angularVelocity,
      delta * blend
    );

    // Keep Euler values bounded without changing their orientation.
    animation.rotationOffset.set(
      normalizeAngle(animation.rotationOffset.x),
      normalizeAngle(animation.rotationOffset.y),
      normalizeAngle(animation.rotationOffset.z)
    );

    const bobX =
      Math.sin(time * 0.23 + animation.phase) * BOBBING.x;

    const bobY =
      Math.sin(time * 0.48 + animation.phase * 1.4) * BOBBING.y;

    const bobZ =
      Math.sin(time * 0.31 + animation.phase * 0.7) * BOBBING.z;

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
