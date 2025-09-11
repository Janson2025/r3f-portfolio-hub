// src/App.jsx (hub)
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

  // Handle Esc and Back button to close the iframe
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && frameVisible) {
        hideProject();
      }
    };
    const onPop = () => {
      // If user hits browser back and the iframe is open, close it instead of leaving the hub
      if (frameVisible) hideProject(true /*fromPopstate*/);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("popstate", onPop);
    };
  }, [frameVisible]);

  const showProject = useCallback(() => {
    // Push a history entry so browser Back will close the overlay
    try {
      window.history.pushState({ overlay: "project" }, "", "#project");
    } catch {}
    setFrameVisible(true);
  }, []);

  const hideProject = useCallback((fromPopstate = false) => {
    setFrameVisible(false);
    setFrameReady(false);
    // If we initiated the close (not from browser back), go back one step to keep history tidy
    if (!fromPopstate) {
      try {
        if (window.location.hash === "#project") window.history.back();
      } catch {}
    }
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative", overflow: "hidden" }}>
      <Canvas camera={{ position: [3, 3, 3], fov: 50 }}>
        <color attach="background" args={["#22222f"]} />
        <PortalCube onEnter={showProject} frameReady={frameReady} />
        <OrbitControls enabled={!frameVisible} />
      </Canvas>

      {/* Subtle preload hint (optional) */}
      {!frameVisible && !frameReady && (
        <div style={{ position: "absolute", bottom: 16, left: 16, padding: "6px 10px", borderRadius: 8, background: "rgba(0,0,0,0.5)", color: "#fff", fontSize: 12 }}>
          Preloading project…
        </div>
      )}

      {/* Close button when iframe is visible (fallback if project doesn't message) */}
      {frameVisible && (
        <button
          aria-label="Back to Hub"
          onClick={() => hideProject()}
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            zIndex: 20,
            padding: "8px 10px",
            borderRadius: 10,
            border: "none",
            background: "rgba(0,0,0,0.55)",
            color: "#fff",
            cursor: "pointer",
            backdropFilter: "blur(2px)"
          }}
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

  const revealWatchdogRef = useRef(null);

  useEffect(() => {
    return () => {
      if (revealWatchdogRef.current) {
        clearTimeout(revealWatchdogRef.current);
        revealWatchdogRef.current = null;
      }
    };
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
