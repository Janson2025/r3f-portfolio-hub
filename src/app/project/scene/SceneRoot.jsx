// src/app/project/scene/SceneRoot.jsx
import {
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { Environment, ContactShadows /*, OrbitControls */ } from "@react-three/drei";

import GridCube from "../grid/GridCube";
import useOverlayController from "./interactions/useOverlayController";
import ProjectOverlay from "./ProjectOverlay";
import { Avatar } from "./Avatar";
import { FadingDiskPlane } from "./FadingDiskPlane";
import DevRotatePanel from "../grid/interactions/DevRotatePanel";

import * as THREE from "three";

/** Drag-to-rotate controller: rotates the target group, not the camera. */

/**
 * Drag-to-rotate controller.
 *
 * Rotates the target group rather than the camera.
 * Supports unrestricted pitch and momentum after release.
 *
 * Dragging over the cube is left to the cube's own interaction
 * system. Dragging outside the cube rotates the overall rig.
 */

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

    // Frame-rate-independentexponential friction.
    const decay = Math.exp(-friction * delta);

    state.velocityYaw *= decay;
    state.velocityPitch *= decay;
  });

  return null;
}


/** Wraps the cube, positions it, and makes it rotatable. */
function CubeRig({ gridRef, onActivateSticker, frameReady, controlsEnabled }) {
  const group = useRef();
  const { size } = useThree();
  const isDesktop = size.width >= 1024;

  // Adjust this offset to taste. World units at your current camera/fov.
  const offsetX = isDesktop ? 2.0 : 0;
  const offsetY = isDesktop ? -0.5 : 0;
  const offsetZ = isDesktop ? 0 : 0;

  return (
    <group
      ref={group}
      position={[offsetX, offsetZ, offsetY]}
      rotation={[Math.PI / 5.5, -Math.PI / 2.75, 0.25]}
    >
      <GridCube
        ref={gridRef} // forwardRef GridCube must expose devAPI
        onActivateSticker={onActivateSticker}
        frameReady={frameReady}
      />
      <DragRotate
        targetRef={group}
        excludeRef={group}
        enabled={controlsEnabled}
        speed={0.0035}
        friction={1.25}
        maxVelocity={6}
      />
    </group>
  );
}

export default function SceneRoot() {
  const {
    visible, ready, setReady, targetUrl, targetOrigin, show, hide, controlsDisabled,
  } = useOverlayController();

  // Hoist the cube ref here so the Dev panel (outside Canvas) can access it
  const gridRef = useRef();

  return (
    <>
      {/* Dev panel renders to document.body — keep it OUTSIDE Canvas to avoid R3F SVG errors */}
      {/*<DevRotatePanel gridRef={gridRef} /> */}

      <div className="fixed inset-0 z-0">
        {/* Canvas already has shadows enabled */}
        <Canvas camera={{ position: [0, 1.5, 6], fov: 50 }} shadows>
          <color attach="background" args={["#22222f"]} />

          {/* <OrbitControls /> */}
          {/* Lighting */}
          <ambientLight intensity={0.3} />
          <directionalLight
            position={[5, 8, 5]}
            intensity={1.2}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            // Shadow camera frustum — make sure the floor + avatar are inside
            shadow-camera-left={-12}
            shadow-camera-right={12}
            shadow-camera-top={12}
            shadow-camera-bottom={-12}
            shadow-camera-near={0.5}
            shadow-camera-far={40}
          />
          <Environment preset="sunset" />

          {/* === Avatar (casts & receives shadows) === */}
          <group position={[-1.25, -0.25, 3.0]} rotation={[0.0, 0.75, 0.0]}>
            <Avatar />
            {/* Floor that receives shadows */}
            <group position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <FadingDiskPlane />
            </group>
          </group>

          <ContactShadows
            position={[0, 0.001, 0]}
            opacity={0.6}
            scale={24}
            blur={2.8}
            far={8}
          />

          {/* === Cube rig (also can cast shadows if its materials allow) === */}
          <CubeRig
            gridRef={gridRef}
            onActivateSticker={(href, meta) =>
              show({ href, slug: meta?.id, title: meta?.title ?? meta?.id })
            }
            frameReady={ready}
            controlsEnabled={!controlsDisabled}
          />
        </Canvas>
      </div>

      {visible && (
        <div className="fixed inset-0 z-40">
          <ProjectOverlay
            targetUrl={targetUrl}
            targetOrigin={targetOrigin}
            visible={visible}
            onReady={() => setReady(true)}
            onBack={() => hide()}
          />
        </div>
      )}
    </>
  );
}
