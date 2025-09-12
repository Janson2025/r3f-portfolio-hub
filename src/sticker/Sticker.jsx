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
  dims = [0.94, 0.94, 0.09],
  onActivate,
  frameReady,
}) {
  const mat = useRef();

  // --- Geometry & transform planning: bevel first, then squash Z on PARENT group ---
  const {
    width, height, baseDepth, zScale, bevelRadius, smoothness, faceColor,
  } = useMemo(() => {
    const [w, h, d] = dims;

    // We build a thick slab so bevel is computed "chunky", then squash Z via parent group.
    const baseDepth = Math.max(w, h);
    const zScale = d / baseDepth;

    // Chunky bevel request: default 0.4 (world units)
    const desiredBevel = config.bevel ?? 0.4;

    // Clamp bevel to safe range (cannot exceed half of any dimension)
    const maxRadius = 0.5 * Math.min(w, h, baseDepth);
    const bevelRadius = Math.min(desiredBevel, Math.max(0.0001, maxRadius - 1e-3));

    // Segments for roundness
    const smoothness = Math.max(2, config.smoothness ?? 6);

    // Color (Rubik face color is set upstream in preview.color)
    const faceColor = config.preview?.color ?? "#ffffff";

    return { width: w, height: h, baseDepth, zScale, bevelRadius, smoothness, faceColor };
  }, [dims, config.bevel, config.smoothness, config.preview?.color]);

  // --- Portal blend state (time-based) ---
  const [targetBlend, setTargetBlend] = useState(0);
  const [animating, setAnimating] = useState(false);
  const watchdogRef = useRef(null);

  // Universal timings from stickerDefaults.json
  const blendMs = useMemo(() => {
    const v = stickerDefaults?.blendMs;
    return Number.isFinite(v) && v > 0 ? v : 500;
  }, []);
  const handoffFallbackMs = useMemo(() => {
    const v = stickerDefaults?.handoffFallbackMs;
    return Number.isFinite(v) && v >= 0 ? v : 1200;
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

    // time-based easing so ~blendMs to ~complete
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
      // Plain stickers are inert by default; enable if desired:
      // onActivate?.();
    }
  }, [config.type, onActivate]);

  const isPortal = config.type === "portal";

  // Small idle spin for the portal preview (optional; uses PortalScene internal props)
  const portalSceneProps = useMemo(() => {
    const p = config.portal ?? {};
    return {
      bgColor: faceColor,
      mesh: p.mesh ?? { type: "icosa", props: {} },
      spin: p.spin ?? { speed: 0.6, axis: [0, 1, 0] },
      lights: p.lights,
      distance: p.distance ?? 0
    };
  }, [config.portal, faceColor]);

  return (
    <group
      onClick={start}
      onPointerOver={(e) => { document.body.style.cursor = "pointer"; e.stopPropagation(); }}
      onPointerOut={() => (document.body.style.cursor = "auto")}
    >
      {/* Parent group applies Z squash so bevel (on RoundedBox) remains visually chunky */}
      <group scale={[1, 1, zScale]}>
        <RoundedBox
          args={[width, height, baseDepth]} // thick slab geometry
          radius={bevelRadius}              // chunky bevel (clamped for safety)
          smoothness={smoothness}
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
    </group>
  );
}
