import { useEffect, useRef, useMemo, useCallback } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function DragRotate({
  targetRef,
  excludeRef,
  enabled = true,
  speed = 0.0035,
  friction = 1.25,
  maxVelocity = 6,
}) {
  const { gl, camera } = useThree();

  const raycaster = useMemo(() => new THREE.Raycaster(), []);

  const interaction = useRef({
    dragging: false,
    pointerId: null,

    lastX: 0,
    lastY: 0,
    lastTime: 0,

    // Angular velocities, in radians per second.
    velocityYaw: 0,
    velocityPitch: 0,
  });

  // --------------------------------------------------
  // Pointer / raycasting helpers
  // --------------------------------------------------

  const isPointerOverCube = useCallback(
    (event) => {
      const cube = excludeRef?.current;

      if (!cube) return false;

      const rect = gl.domElement.getBoundingClientRect();

      if (!rect.width || !rect.height) return false;

      const pointer = {
        x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
        y: -((event.clientY - rect.top) / rect.height) * 2 + 1,
      };

      cube.updateWorldMatrix(true, true);

      raycaster.setFromCamera(pointer, camera);

      return raycaster.intersectObject(cube, true).length > 0;
    },
    [gl, camera, excludeRef, raycaster]
  );

  // --------------------------------------------------
  // Canvas configuration
  // --------------------------------------------------

  useEffect(() => {
    const element = gl.domElement;
    const previousTouchAction = element.style.touchAction;

    element.style.touchAction = "none";

    return () => {
      element.style.touchAction = previousTouchAction;
    };
  }, [gl]);

  // --------------------------------------------------
  // Pointer interaction
  // --------------------------------------------------

  useEffect(() => {
    const element = gl.domElement;
    const state = interaction.current;

    const resetInteraction = () => {
      state.dragging = false;
      state.pointerId = null;
      state.velocityYaw = 0;
      state.velocityPitch = 0;

      document.body.style.cursor = "";
    };

    if (!enabled) {
      resetInteraction();
      return;
    }

    const onPointerDown = (event) => {
      if (!event.isPrimary || event.button !== 0) return;
      if (state.dragging) return;

      // The cube handles its own sticker and slice interactions.
      // Only begin orbiting when the pointer starts outside it.
      if (isPointerOverCube(event)) return;

      event.preventDefault();

      state.dragging = true;
      state.pointerId = event.pointerId;

      state.lastX = event.clientX;
      state.lastY = event.clientY;
      state.lastTime = performance.now();

      // Starting a new drag cancels previous momentum.
      state.velocityYaw = 0;
      state.velocityPitch = 0;

      try {
        element.setPointerCapture(event.pointerId);
      } catch {
        // Window listeners still handle the interaction.
      }

      document.body.style.cursor = "grabbing";
    };

    const onPointerMove = (event) => {
      if (!state.dragging) {
        document.body.style.cursor = isPointerOverCube(event)
          ? ""
          : "move";

        return;
      }

      if (event.pointerId !== state.pointerId) return;

      const now = performance.now();

      // Time between pointer samples, in seconds.
      const elapsed = Math.max(
        (now - state.lastTime) / 1000,
        0.001
      );

      const deltaX = event.clientX - state.lastX;
      const deltaY = event.clientY - state.lastY;

      state.lastX = event.clientX;
      state.lastY = event.clientY;
      state.lastTime = now;

      const group = targetRef.current;

      if (!group) return;

      // Convert pointer movement into angular movement.
      const yawDelta = deltaX * speed;
      const pitchDelta = deltaY * speed;

      // Apply rotation directly.
      group.rotation.y += yawDelta;
      group.rotation.x += pitchDelta;

      // Calculate velocities using the EXACT same signs
      // and axes as the rotations above.
      const measuredYawVelocity = yawDelta / elapsed;
      const measuredPitchVelocity = pitchDelta / elapsed;

      // Smooth velocity measurements over approximately 45ms.
      // This reduces spikes caused by irregular pointer events.
      const smoothing = 1 - Math.exp(-elapsed / 0.045);

      state.velocityYaw = THREE.MathUtils.lerp(
        state.velocityYaw,
        measuredYawVelocity,
        smoothing
      );

      state.velocityPitch = THREE.MathUtils.lerp(
        state.velocityPitch,
        measuredPitchVelocity,
        smoothing
      );

      // Limit the maximum release velocity.
      state.velocityYaw = THREE.MathUtils.clamp(
        state.velocityYaw,
        -maxVelocity,
        maxVelocity
      );

      state.velocityPitch = THREE.MathUtils.clamp(
        state.velocityPitch,
        -maxVelocity,
        maxVelocity
      );
    };

    const endDrag = (event) => {
      if (!state.dragging) return;

      if (
        event?.pointerId != null &&
        event.pointerId !== state.pointerId
      ) {
        return;
      }

      // If the user paused before releasing, reduce the
      // stored velocity to reflect that pause.
      const now = performance.now();
      const idleTime = Math.max(
        0,
        (now - state.lastTime) / 1000
      );

      const releaseDecay = Math.exp(-friction * idleTime);

      state.velocityYaw *= releaseDecay;
      state.velocityPitch *= releaseDecay;

      const pointerId = state.pointerId;

      state.dragging = false;
      state.pointerId = null;

      document.body.style.cursor = "";

      try {
        if (
          pointerId != null &&
          element.hasPointerCapture(pointerId)
        ) {
          element.releasePointerCapture(pointerId);
        }
      } catch {
        // Pointer capture may already have been released.
      }
    };

    const onWindowBlur = () => {
      resetInteraction();
    };

    element.addEventListener("pointerdown", onPointerDown);

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
    window.addEventListener("blur", onWindowBlur);

    return () => {
      element.removeEventListener("pointerdown", onPointerDown);

      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
      window.removeEventListener("blur", onWindowBlur);

      resetInteraction();
    };
  }, [
    gl,
    targetRef,
    enabled,
    speed,
    friction,
    maxVelocity,
    isPointerOverCube,
  ]);

  // --------------------------------------------------
  // Momentum
  // --------------------------------------------------

  useFrame((_, delta) => {
    const state = interaction.current;
    const group = targetRef.current;

    if (!enabled || !group || state.dragging) return;

    const minimumVelocity = 0.0001;

    if (
      Math.abs(state.velocityYaw) < minimumVelocity &&
      Math.abs(state.velocityPitch) < minimumVelocity
    ) {
      state.velocityYaw = 0;
      state.velocityPitch = 0;
      return;
    }

    // Continue rotation on the SAME axes and in the SAME
    // directions used during manual dragging.
    group.rotation.y += state.velocityYaw * delta;
    group.rotation.x += state.velocityPitch * delta;

    // Frame-rate-independent exponential friction.
    const decay = Math.exp(-friction * delta);

    state.velocityYaw *= decay;
    state.velocityPitch *= decay;
  });

  return null;
}

export default DragRotate;