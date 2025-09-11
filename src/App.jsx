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

  // (Nice-to-have) Preconnect for faster initial hop
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
          onEnter={() => setFrameVisible(true)}
          frameReady={frameReady}
        />
        <OrbitControls />
      </Canvas>

      <ProjectFrame
        url={PROJECT_URL}
        visible={frameVisible}
        onReady={() => setFrameReady(true)}
        onBack={() => {
          setFrameVisible(false);
          setFrameReady(false); // reset; next entry will wait for ready again
        }}
      />
    </div>
  );
}

/** Preloaded overlay iframe that shows your project */
function ProjectFrame({ url, visible, onReady, onBack }) {
  // Listen ONLY to messages from the project origin
  useEffect(() => {
    const onMsg = (e) => {
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
      // Fallback "ready" if the app doesn't postMessage (still fine)
      onLoad={() => onReady?.()}
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
        background: "#111", // avoid white flash before first paint
      }}
      // Optional sandbox if you want to tighten capabilities:
      // sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock"
    />
  );
}

function PortalCube({ onEnter, frameReady }) {
  const group = useRef();
  const inner = useRef();
  const mat = useRef();
  const { camera } = useThree();

  // Subtle idle motion
  useFrame((_, dt) => {
    if (group.current) group.current.rotation.y += dt * 0.3;
    if (inner.current) inner.current.rotation.x += dt * 0.6;
  });

  // Blend + camera push
  const [targetBlend, setTargetBlend] = useState(0);
  const [animating, setAnimating] = useState(false);
  const camTarget = useMemo(() => new THREE.Vector3(1.2, 1.2, 1.2), []);
  const prefersReducedMotion =
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  useFrame((_, dt) => {
    if (!mat.current) return;
    const current = mat.current.blend ?? 0;
    const next = THREE.MathUtils.lerp(current, targetBlend, 1 - Math.pow(0.0001, dt));
    mat.current.blend = THREE.MathUtils.clamp(next, 0, 1);

    if (animating) {
      camera.position.lerp(camTarget, 1 - Math.pow(0.0001, dt));
      camera.lookAt(0, 0, 0);

      // Reveal iframe ONLY when blend is done AND project is ready
      if (mat.current.blend > 0.985 && frameReady) {
        setTimeout(() => onEnter?.(), 16); // let last portal frame paint
        setAnimating(false);
        setTargetBlend(0); // reset (portal is "closed" when you return)
      }
    }
  });

  // If user clicks before iframe is ready, we hold at blend==1 until "ready"
  useEffect(() => {
    if (animating && mat.current?.blend > 0.985 && frameReady) {
      setTimeout(() => onEnter?.(), 16);
      setAnimating(false);
      setTargetBlend(0);
    }
  }, [animating, frameReady, onEnter]);

  const startTransition = useCallback(() => {
    if (prefersReducedMotion) {
      onEnter?.();
      return;
    }
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
