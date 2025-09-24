// src/sticker/Sticker.jsx
import * as THREE from "three";
import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshPortalMaterial, RoundedBox, Html } from "@react-three/drei"; // ← Html added
import PortalScene from "./PortalScene.jsx";
import stickerDefaults from "./params/stickerDefaults.json";
import pubsub from "../../project/shared/pubsub.js"; // ← so we can emit hover

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
    const baseDepth = Math.max(w, h);
    const zScale = d / baseDepth;
    const desiredBevel = config.bevel ?? 0.4;
    const maxRadius = 0.5 * Math.min(w, h, baseDepth);
    const bevelRadius = Math.min(desiredBevel, Math.max(0.0001, maxRadius - 1e-3));
    const smoothness = Math.max(2, config.smoothness ?? 6);
    const faceColor = config.preview?.color ?? "#ffffff";
    return { width: w, height: h, baseDepth, zScale, bevelRadius, smoothness, faceColor };
  }, [dims, config.bevel, config.smoothness, config.preview?.color]);

  // --- Portal blend state (time-based) ---
  const [targetBlend, setTargetBlend] = useState(0);
  const [animating, setAnimating] = useState(false);
  const watchdogRef = useRef(null);

  // --- Hover tooltip state ---
  const [hovered, setHovered] = useState(false);
  const [tooltipPos, setTooltipPos] = useState([0, 0, 0]); // world-space
  const tooltipYOffset = 0.08; // small offset above pointer

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

  useFrame((_, dt) => {
    if (!mat.current) return;
    const current = mat.current.blend ?? 0;
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
      // onActivate?.(); // enable if you want non-portal stickers to activate too
    }
  }, [config.type, onActivate]);

  const isPortal = config.type === "portal";

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

  // --- Pointer handlers for tooltip + hover→active ---
  const onOver = useCallback((e) => {
    document.body.style.cursor = "pointer";
    e.stopPropagation();
    setHovered(true);
    // Trigger chip/summary focus on hover
    if (config?.id) {
      pubsub?.emit?.("project:hover", { id: config.id });
    }
  }, [config?.id]);

  const onOut = useCallback(() => {
    document.body.style.cursor = "auto";
    setHovered(false);
  }, []);

  const onMove = useCallback((e) => {
    // e.point is the world-space intersection with this object
    if (e?.point) {
      const p = e.point;
      setTooltipPos([p.x, p.y + tooltipYOffset, p.z]);
    }
  }, []);

  return (
    <group
      onClick={start}
      onPointerOver={onOver}
      onPointerOut={onOut}
      onPointerMove={onMove}
    >
      {/* Parent group applies Z squash so bevel (on RoundedBox) remains visually chunky */}
      <group scale={[1, 1, zScale]}>
        <RoundedBox
          args={[width, height, baseDepth]}
          radius={bevelRadius}
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
 
      {/* Hover tooltip (screen-facing sprite) */}
      {hovered && (
        <Html
          position={[0, height / 2 + 0.05, 0]} // anchored above the top of the sticker
          sprite
          transform
          distanceFactor={8}
          pointerEvents="none"
          zIndexRange={[100, 0]}
        >
          <div
            style={{
              padding: "2px 4px",
              fontSize: "3px",
              lineHeight: 1,
              borderRadius: "4px",
              background: "rgba(0,0,0,0.7)",
              color: "white",
              whiteSpace: "nowrap",
              boxShadow: "0 1px 3px rgba(0,0,0,0.35)"
            }}
          >
            {config?.title ?? config?.id}
          </div>
        </Html>
      )}
    </group>
  );
}
