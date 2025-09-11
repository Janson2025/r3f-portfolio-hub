// src/sticker/Sticker.jsx
import * as THREE from "three";
import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshPortalMaterial, RoundedBox } from "@react-three/drei";

export default function Sticker({
  config,
  // Target final dims (world units): [width, height, depth]
  dims = [0.94, 0.94, 0.02],
  onActivate,
  frameReady,
}) {
  const mat = useRef();
  const inner = useRef();

  // Subtle idle on preview mesh (if configured)
  useFrame((_, dt) => {
    if (inner.current) inner.current.rotation.y += dt * (config.idle?.spin ?? 0.0);
  });

  // --- Build with final W/H and a THICK base depth; squash Z afterwards ---
  const { width, height, baseDepth, zScale, bevelRadius, smoothness } = useMemo(() => {
    const [w, h, d] = dims;
    const baseDepth = Math.max(w, h);        // thick slab so bevel stays chunky
    const zScale = d / baseDepth;            // flatten only along Z
    const bevelRadius = config.bevel ?? 0.08; // chunky bevel
    const smoothness = Math.max(2, config.smoothness ?? 5);
    return { width: w, height: h, baseDepth, zScale, bevelRadius, smoothness };
  }, [dims, config.bevel, config.smoothness]);

  // --- Portal blend state ---
  const [targetBlend, setTargetBlend] = useState(0);
  const [animating, setAnimating] = useState(false);
  const watchdogRef = useRef(null);

  useEffect(() => {
    return () => {
      if (watchdogRef.current) clearTimeout(watchdogRef.current);
    };
  }, []);

  // Drive MeshPortalMaterial.blend 0→1; reveal via onActivate
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
    if (config.type === "portal") {
      setAnimating(true);
      setTargetBlend(1);
    } else {
      // Plain stickers: keep inert, or enable if you want
      // onActivate?.();
    }
  }, [config.type, onActivate]);

  const isPortal = config.type === "portal";
  const faceColor = config.preview?.color ?? "#ffffff"; // comes from GridCube auto-colors or override

  return (
    <group
      onClick={start}
      onPointerOver={(e) => { document.body.style.cursor = "pointer"; e.stopPropagation(); }}
      onPointerOut={() => (document.body.style.cursor = "auto")}
    >
      {/* Build geometry with FINAL width/height and THICK base depth, then squash Z only */}
      <RoundedBox
        args={[width, height, baseDepth]}
        radius={bevelRadius}
        smoothness={smoothness}
        scale={[1, 1, zScale]}
      >
        {isPortal ? (
          <MeshPortalMaterial ref={mat} side={THREE.DoubleSide} blend={0}>
            {/* Portal background uses the assigned face color */}
            <color attach="background" args={[faceColor]} />
            <ambientLight intensity={0.75} />
            <directionalLight position={[1.2, 1.6, 1.2]} intensity={1} />
            <mesh ref={inner}>
              <boxGeometry args={[0.5, 0.5, 0.5]} />
              <meshNormalMaterial />
            </mesh>
          </MeshPortalMaterial>
        ) : (
          <meshStandardMaterial
            color={faceColor}
            roughness={0.05}
            metalness={0.0}
            flatShading={false}
          />
        )}
      </RoundedBox>
    </group>
  );
}
