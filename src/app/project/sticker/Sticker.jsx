// src/sticker/Sticker.jsx
import * as THREE from "three";
import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshPortalMaterial, RoundedBox, Html } from "@react-three/drei";
import PortalScene from "./PortalScene.jsx";
import stickerDefaults from "./params/stickerDefaults.json";
import pubsub from "../../project/shared/pubsub.js";

export default function Sticker({
  config,
  dims = [0.94, 0.94, 0.09],
  onActivate,
  frameReady,
}) {
  const mat = useRef();
  const isPortal = config?.type === "portal";

  const { width, height, baseDepth, zScale, bevelRadius, smoothness, faceColor } = useMemo(() => {
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

  const [targetBlend, setTargetBlend] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [hovered, setHovered] = useState(false);
  const watchdogRef = useRef(null);

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
    if (!isPortal || !mat.current) return; // only portals animate blend/hand-off
    const current = mat.current.blend ?? 0;
    const tau = Math.max(0.0001, blendMs / 5000);
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
    if (isPortal) {
      setAnimating(true);
      setTargetBlend(1);
    }
  }, [isPortal]);

  // Portal scene props; only play when portal & hovered
  const portalSceneProps = useMemo(() => {
    const p = config.portal ?? {};
    const animation = p.animation
      ? p.animation
      : p.spin
      ? { type: "spin", params: { speed: p.spin.speed, axis: p.spin.axis } }
      : { type: "idle", params: {} };
    return {
      bgColor: faceColor,
      mesh: p.mesh ?? { type: "icosa", props: {} },
      lights: p.lights,
      distance: p.distance ?? 0,
      animation,
      playing: isPortal && hovered,
    };
  }, [config.portal, faceColor, hovered, isPortal]);

  const onOver = useCallback((e) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = isPortal ? "pointer" : "grab";
    if (config?.id) pubsub?.emit?.("project:hover", { id: config.id });
  }, [isPortal, config?.id]);

  const onOut = useCallback(() => {
    setHovered(false);
    // Let the scene logic decide (DragRotate will set 'move' when outside)
    document.body.style.cursor = "";
  }, []);

  return (
    <group
      onClick={isPortal ? start : undefined}
      onPointerOver={isPortal ? onOver : undefined}
      onPointerOut={isPortal ? onOut : undefined}
      onPointerMove={(e) => isPortal ? e.stopPropagation() : undefined}
    >
      <group scale={[1, 1, zScale]}>
        <RoundedBox args={[width, height, baseDepth]} radius={bevelRadius} smoothness={smoothness}>
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

      {isPortal && hovered && (
        <Html
          position={[0, height / 2 + 0.05, 0]}
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
              boxShadow: "0 1px 3px rgba(0,0,0,0.35)",
            }}
          >
            {config?.title ?? config?.id}
          </div>
        </Html>
      )}
    </group>
  );
}
