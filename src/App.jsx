// src/App.jsx (hub)
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, MeshPortalMaterial } from "@react-three/drei";
import * as THREE from "three";
import { useRef, useEffect, useMemo, useState, useCallback } from "react";

// === LIVE PROJECT URL / ORIGIN ===
const PROJECT_URL = "https://r3f-new-character-configurator.onrender.com/";
const PROJECT_ORIGIN = new URL(PROJECT_URL).origin;

export default function App() {
  const [frameVisible, setFrameVisible] = useState(false);
  const [frameReady, setFrameReady] = useState(false);

  // Preconnect
  useEffect(() => {
    const l = document.createElement("link");
    l.rel = "preconnect";
    l.href = PROJECT_ORIGIN;
    document.head.appendChild(l);
    return () => document.head.removeChild(l);
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative", overflow: "hidden" }}>
      <Canvas camera={{ position: [3, 3, 3], fov: 50 }}>
        <color attach="background" args={["#22222f"]} />
        <PortalCube
          onEnter={() => {
            console.log("[HUB] Revealing iframe");
            setFrameVisible(true);
          }}
          frameReady={frameReady}
        />
        <OrbitControls />
      </Canvas>

      <ProjectFrame
        url={PROJECT_URL}
        visible={frameVisible}
        onReady={() => {
          console.log("[HUB] iframe ready (onLoad or project-ready)");
          setFrameReady(true);
        }}
        onBack={() => {
          console.log("[HUB] back-from-project received");
          setFrameVisible(false);
          setFrameReady(false);
        }}
      />
    </div>
  );
}

function ProjectFrame({ url, visible, onReady, onBack }) {
  useEffect(() => {
    const onMsg = (e) => {
      // Debug every message
      console.log("[HUB] postMessage event:", e.origin, e.data);
      if (e.origin !== PROJECT_ORIGIN) return;
      if (e?.data?.type === "project-ready") onReady?.();
      if (e?.data?.type === "back-from-project") onBack?.();
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [onReady, onBack]);

  return (
    <iframe
      title="project"
      src={url}
      onLoad={() => {
        console.log("[HUB] iframe onLoad fired");
        onReady?.();
      }}
      loading="eager"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        border: 0,
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        transition: "opacity 200ms ease-out",
        background: "#111",
        zIndex: 10, // ensure it sits above the canvas
      }}
    />
  );
}

function PortalCube({ onEnter, frameReady }) {
  const group = useRef();
  const inner = useRef();
  const mat = useRef();
  const { camera } = useThree();

  useFrame((_, dt) => {
    if (group.current) group.current.rotation.y += dt * 0.3;
    if (inner.current) inner.current.rotation.x += dt * 0.6;
  });

  const [targetBlend, setTargetBlend] = useState(0);
  const [animating, setAnimating] = useState(false);
  const camTarget = useMemo(() => new THREE.Vector3(1.2, 1.2, 1.2), []);
  const prefersReducedMotion =
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  // When blend finishes, either reveal immediately (if ready) or wait up to 2s for readiness.
  const tryRevealAfterBlend = useCallback(() => {
    if (frameReady) {
      setTimeout(() => onEnter?.(), 16);
      setAnimating(false);
      setTargetBlend(0);
    } else {
      console.log("[HUB] blend finished, waiting for iframe readiness ...");
      const start = performance.now();
      const timer = setInterval(() => {
        const elapsed = performance.now() - start;
        if (frameReady || elapsed > 2000) {
          clearInterval(timer);
          console.log(frameReady
            ? "[HUB] iframe reported ready during wait; revealing"
            : "[HUB] timeout: revealing iframe anyway");
          setTimeout(() => onEnter?.(), 16);
          setAnimating(false);
          setTargetBlend(0);
        }
      }, 50);
    }
  }, [frameReady, onEnter]);

  useFrame((_, dt) => {
    if (!mat.current) return;
    const current = mat.current.blend ?? 0;
    const next = THREE.MathUtils.lerp(current, targetBlend, 1 - Math.pow(0.0001, dt));
    mat.current.blend = THREE.MathUtils.clamp(next, 0, 1);

    if (animating) {
      camera.position.lerp(camTarget, 1 - Math.pow(0.0001, dt));
      camera.lookAt(0, 0, 0);
      if (mat.current.blend > 0.985) {
        tryRevealAfterBlend();
      }
    }
  });

  const startTransition = useCallback(() => {
    if (prefersReducedMotion) {
      onEnter?.();
      return;
    }
    console.log("[HUB] starting blend");
    setAnimating(true);
    setTargetBlend(1);
  }, [onEnter, prefersReducedMotion]);

  return (
    <group
      ref={group}
      position={[0, 0, 0]}
      onClick={startTransition}
      onPointerOver={(e) => {
        document.body.style.cursor = "pointer";
        e.stopPropagation();
      }}
      onPointerOut={() => (document.body.style.cursor = "auto")}
    >
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <MeshPortalMaterial ref={mat} side={THREE.DoubleSide} blend={0}>
          <color attach="background" args={["#333333"]} />
          <mesh ref={inner} position={[0, 0, 0]}>
            <boxGeometry args={[0.5, 0.5, 0.5]} />
            <meshNormalMaterial />
          </mesh>
        </MeshPortalMaterial>
      </mesh>
    </group>
  );
}
