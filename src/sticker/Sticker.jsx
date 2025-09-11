// src/sticker/Sticker.jsx
import * as THREE from "three";
import { useRef, useState, useEffect, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshPortalMaterial } from "@react-three/drei";

export default function Sticker({ config, dims=[0.98,0.98,0.06], onActivate, frameReady }) {
  const mat = useRef();
  const inner = useRef();

  // idle anim on preview
  useFrame((_, dt) => {
    if (inner.current) inner.current.rotation.y += dt * (config.idle?.spin ?? 0.0);
  });

  const [targetBlend, setTargetBlend] = useState(0);
  const [animating, setAnimating] = useState(false);
  const watchdogRef = useRef(null);

  useEffect(() => () => {
    if (watchdogRef.current) clearTimeout(watchdogRef.current);
  }, []);

  // Blend + reveal
  useFrame((_, dt) => {
    if (!mat.current) return;
    const current = mat.current.blend ?? 0;
    const next = THREE.MathUtils.lerp(current, targetBlend, 1 - Math.pow(0.0001, dt));
    mat.current.blend = THREE.MathUtils.clamp(next, 0, 1);

    if (animating && mat.current.blend > 0.985) {
      if (frameReady) {
        setTimeout(() => onActivate?.(), 16);
        setAnimating(false);
        setTargetBlend(0);
        if (watchdogRef.current) clearTimeout(watchdogRef.current);
        watchdogRef.current = null;
      } else if (!watchdogRef.current) {
        // reveal anyway if "ready" doesn't arrive soon
        watchdogRef.current = setTimeout(() => {
          onActivate?.();
          setAnimating(false);
          setTargetBlend(0);
          watchdogRef.current = null;
        }, 1200);
      }
    }
  });

  const start = useCallback(() => {
    setAnimating(true);
    setTargetBlend(1);
  }, []);

  const isPortal = config.type === "portal";

  return (
    <mesh
      onClick={start}
      onPointerOver={(e) => { document.body.style.cursor = "pointer"; e.stopPropagation(); }}
      onPointerOut={() => (document.body.style.cursor = "auto")}
    >
      <boxGeometry args={dims} />
      {isPortal ? (
        <MeshPortalMaterial ref={mat} side={THREE.DoubleSide} blend={0}>
          {/* lightweight preview scene */}
          <color attach="background" args={["#333333"]} />
          <ambientLight intensity={0.75} />
          <directionalLight position={[1.2, 1.6, 1.2]} intensity={1} />
          <mesh ref={inner}>
            <boxGeometry args={[0.5, 0.5, 0.5]} />
            <meshNormalMaterial />
          </mesh>
        </MeshPortalMaterial>
      ) : (
        <meshStandardMaterial color={config.preview?.color ?? "#888"} />
      )}
    </mesh>
  );
}
