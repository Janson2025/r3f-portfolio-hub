// src/sticker/Sticker.jsx
import * as THREE from "three";
import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshPortalMaterial, RoundedBox } from "@react-three/drei";
import PortalScene from "./PortalScene.jsx";
import stickerDefaults from "./params/stickerDefaults.json";

export default function Sticker({
  config,
  // Target final dims (world units): [width, height, depth]
  dims = [0.94, 0.94, 0.02],
  onActivate,
  frameReady,
}) {
  const mat = useRef();

  // --- Build with final W/H and a THICK base depth; squash Z afterwards ---
  const { width, height, baseDepth, zScale, bevelRadius, smoothness } = useMemo(() => {
    const [w, h, d] = dims;
    const baseDepth = Math.max(w, h);          // thick slab so bevel stays chunky
    const zScale = d / baseDepth;              // flatten only along Z
    const bevelRadius = config.bevel ?? 0.08;  // chunky bevel
    const smoothness = Math.max(2, config.smoothness ?? 5);
    return { width: w, height: h, baseDepth, zScale, bevelRadius, smoothness };
  }, [dims, config.bevel, config.smoothness]);

  // --- Portal blend state ---
  const [targetBlend, setTargetBlend] = useState(0);
  const [animating, setAnimating] = useState(false);
  const watchdogRef = useRef(null);

  // Universal timings from stickerDefaults.json
  const blendMs = useMemo(() => {
    const v = stickerDefaults?.blendMs;
    return Number.isFinite(v) && v > 0 ? v : 500; // default 500ms
  }, []);
  const handoffFallbackMs = useMemo(() => {
    const v = stickerDefaults?.handoffFallbackMs;
    return Number.isFinite(v) && v >= 0 ? v : 1200; // default 1200ms
  }, []);

  useEffect(() => {
    return () => {
      if (watchdogRef.current) clearTimeout(watchdogRef.current);
    };
  }, []);

  // Drive MeshPortalMaterial.blend 0→1; reveal via onActivate
  useFrame((_, dt) => {
    if (!mat.current) return;
    const current = mat.current.blend ?? 0;

    // Time-based easing using blendMs:
    // factor = 1 - exp(-dt / tau), with tau = blendMs/5 so ~99% at ~blendMs
    const tau = Math.max(0.0001, blendMs / 5000); // seconds
    const factor = 1 - Math.exp(-(dt / tau));
    const next = THREE.MathUtils.lerp(current, targetBlend, factor);

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
        }, handoffFallbackMs);
      }
    }
  });

  const start = useCallback(() => {
    if (config.type === "portal") {
      setAnimating(true);
      setTargetBlend(1);
    } else {
      // Plain stickers: inert by default; wire up if needed
      // onActivate?.();
    }
  }, [config.type]);

  const isPortal = config.type === "portal";
  const faceColor = config.preview?.color ?? "#ffffff"; // default background for the portal scene

  const portalSceneProps = useMemo(() => {
    const p = config.portal ?? {};
    return {
      bgColor: faceColor,
      mesh: p.mesh ?? { type: "icosa", props: {} },
      spin: p.spin ?? { speed: 0.6, axis: [0, 1, 0] },
      lights: p.lights,
    };
  }, [config.portal, faceColor]);

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
            <PortalScene {...portalSceneProps} />
          </MeshPortalMaterial>
        ) : (
          <meshStandardMaterial
            color={faceColor}
            roughness={0.05}
            metalness={0.2}
            flatShading={false}
          />
        )}
      </RoundedBox>
    </group>
  );
}
