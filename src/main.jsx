// src/App.jsx
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, MeshPortalMaterial } from "@react-three/drei";
import * as THREE from "three";
import { useRef, useEffect, useMemo, useState, useCallback } from "react";

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

  // Esc + browser Back handling
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && frameVisible) hideProject();
    };
    const onPop = () => {
      if (frameVisible) hideProject(true);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("popstate", onPop);
    };
  }, [frameVisible]);

  const showProject = useCallback(() => {
    try { window.history.pushState({ overlay: "project" }, "", "#project"); } catch {}
    setFrameVisible(true);
  }, []);

  const hideProject = useCallback((fromPopstate = false) => {
    setFrameVisible(false);
    setFrameReady(false);
    if (!fromPopstate) {
      try {
        if (window.location.hash === "#project") window.history.back();
      } catch {}
    }
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <Canvas camera={{ position: [3, 3, 3], fov: 50 }}>
        <color attach="background" args={["#22222f"]} />
        <PortalCube onEnter={showProject} frameReady={frameReady} />
        <OrbitControls enabled={!frameVisible} />
      </Canvas>

      {/* Subtle preload hint */}
      {!frameVisible && !frameReady && (
        <div className="absolute bottom-4 left-4 rounded-md bg-black/50 px-3 py-1 text-xs text-white backdrop-blur">
          Preloading project…
        </div>
      )}

      {/* Fallback close button when iframe is visible */}
      {frameVisible && (
        <button
          aria-label="Back to Hub"
          onClick={() => hideProject()}
          className="absolute left-3 top-3 z-20 rounded-lg bg-black/60 px-3 py-2 text-white backdrop-blur hover:bg-black/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          ← Back
        </button>
      )}

      <ProjectFrame
        url={PROJECT_URL}
        visible={frameVisible}
        onReady={() => setFrameReady(true)}
        onBack={() => hideProject()}
      />
    </div>
  );
}

function ProjectFrame({ url, visible, onReady, onBack }) {
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
      onLoad={() => onReady?.()}
      loading="eager"
      className={[
        "absolute inset-0 h-full w-full border-0 bg-neutral-900 transition-opacity duration-200 ease-out",
        visible ? "opacity-100 pointer-events-auto z-10" : "opacity-0 pointer-events-none",
      ].join(" ")}
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

  const revealWatchdogRef = useRef(null);
  useEffect(() => () => {
    if (revealWatchdogRef.current) {
      clearTimeout(revealWatchdogRef.current);
      revealWatchdogRef.current = null;
    }
  }, []);

  useFrame((_, dt) => {
    if (!mat.current) return;
    const current = mat.current.blend ?? 0;
    const next = THREE.MathUtils.lerp(current, targetBlend, 1 - Math.pow(0.0001, dt));
    mat.current.blend = THREE.MathUtils.clamp(next, 0, 1);

    if (animating) {
      camera.position.lerp(camTarget, 1 - Math.pow(0.0001, dt));
      camera.lookAt(0, 0, 0);

      if (mat.current.blend > 0.985) {
        if (frameReady) {
          setTimeout(() => onEnter?.(), 16);
          setAnimating(false);
          setTargetBlend(0);
          if (revealWatchdogRef.current) {
            clearTimeout(revealWatchdogRef.current);
            revealWatchdogRef.current = null;
          }
        } else if (!revealWatchdogRef.current) {
          revealWatchdogRef.current = setTimeout(() => {
            onEnter?.();
            setAnimating(false);
            setTargetBlend(0);
            revealWatchdogRef.current = null;
          }, 1200);
        }
      }
    }
  });

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
