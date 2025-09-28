// src/app/project/scene/SceneRoot.jsx
import { useEffect, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Environment, ContactShadows /*, OrbitControls */ } from "@react-three/drei";

import GridCube from "../grid/GridCube";
import useOverlayController from "./interactions/useOverlayController";
import ProjectOverlay from "./ProjectOverlay";
import { Avatar } from "./Avatar";
import { FadingDiskPlane } from "./FadingDiskPlane";
import DevRotatePanel from "../grid/interactions/DevRotatePanel";

/** Drag-to-rotate controller: rotates the target group, not the camera. */
function DragRotate({ targetRef, enabled = true, speed = 0.0035, clampX = Math.PI / 2 }) {
  const { gl } = useThree();

  // prevent the browser from handling touch panning/zooming on the canvas
  useEffect(() => {
    const el = gl.domElement;
    const prev = el.style.touchAction;
    el.style.touchAction = "none";
    return () => {
      el.style.touchAction = prev;
    };
  }, [gl]);

  useEffect(() => {
    if (!enabled) return;

    const el = gl.domElement;
    const state = { dragging: false, lx: 0, ly: 0 };

    const onDown = (e) => {
      state.dragging = true;
      state.lx = e.clientX;
      state.ly = e.clientY;
      try { el.setPointerCapture?.(e.pointerId); } catch {}
      document.body.style.cursor = "grabbing";
    };

    const onMove = (e) => {
      if (!state.dragging || !targetRef.current) return;
      const dx = e.clientX - state.lx;
      const dy = e.clientY - state.ly;
      state.lx = e.clientX;
      state.ly = e.clientY;

      const g = targetRef.current;
      g.rotation.y += dx * speed; // horizontal drag -> yaw
      g.rotation.x += dy * speed; // vertical drag   -> pitch
      // Clamp pitch to avoid flipping
      if (g.rotation.x >  clampX) g.rotation.x =  clampX;
      if (g.rotation.x < -clampX) g.rotation.x = -clampX;
    };

    const endDrag = () => {
      if (!state.dragging) return;
      state.dragging = false;
      document.body.style.cursor = "";
    };

    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
    };
  }, [gl, targetRef, enabled, speed, clampX]);

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
      <DragRotate targetRef={group} enabled={controlsEnabled} />
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
      <DevRotatePanel gridRef={gridRef} />

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
