import { Suspense, useEffect, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Environment, OrbitControls } from "@react-three/drei";

import GridCube from "../grid/GridCube";
import useOverlayController from "./interactions/useOverlayController";
import ProjectOverlay from "./ProjectOverlay";
import { Avatar } from "./Avatar";

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
      g.rotation.y += dx * speed;               // horizontal drag -> yaw
      g.rotation.x += dy * speed;               // vertical drag   -> pitch
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

/** Wraps the cube, positions it (right on desktop, center on mobile), and makes it rotatable. */
function CubeRig({ onActivateSticker, frameReady, controlsEnabled }) {
  const group = useRef();
  const { size } = useThree();
  const isDesktop = size.width >= 1024;

  // Adjust this offset to taste. World units at your current camera/fov.
  const offsetX = isDesktop ? 10 : 0;

  return (
    <group ref={group} position={[1.75, 0.0, -4.5]} rotation={[Math.PI / 5.5, -Math.PI / 2.75, 0]}>
      <GridCube onActivateSticker={onActivateSticker} frameReady={frameReady} />
      <DragRotate targetRef={group} enabled={controlsEnabled} />
    </group>
  );
}

export default function SceneRoot() {
  const {
    visible,
    ready,
    setReady,
    targetUrl,
    targetOrigin,
    show,
    hide,
    controlsDisabled,
  } = useOverlayController();

  return (
    <>
      {/* Full-screen background Canvas (below header/footer; above body) */}
      <div className="fixed inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 0], focus: 0 }} shadows>
          {/* Scene background + basic lighting */}
          <color attach="background" args={["#22222f"]} />
          <ambientLight intensity={0.6} />
          <directionalLight position={[3, 4, 2]} intensity={1.1} />
          <Suspense fallback={null}>
            <Environment preset="sunset" />
          </Suspense>

          {/* Your avatar lives in the same Canvas */}
          <group position={[-1.25, -1.0, -2.0]} rotation={[0.4, .75, -0.2]}>
            <Avatar />
          </group>

          {/* Cube on the right (desktop) / centered (mobile). Drag to rotate object, not camera. */}
          <CubeRig
            onActivateSticker={(href, meta) =>
              show({ href, slug: meta?.id, title: meta?.title ?? meta?.id })
            }
            frameReady={ready}
            controlsEnabled={!controlsDisabled}
          />
        </Canvas>
      </div>

      {/* Overlay only mounts when visible; sits above header/footer */}
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
