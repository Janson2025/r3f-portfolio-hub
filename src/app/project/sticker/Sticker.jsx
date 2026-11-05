
import * as THREE from "three";
import {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";

import { useFrame } from "@react-three/fiber";
import {
  MeshPortalMaterial,
  RoundedBox,
  Html,
} from "@react-three/drei";

import PortalScene from "./PortalScene.jsx";
import stickerDefaults from "./params/stickers.json";
import pubsub from "../../project/shared/pubsub.js";

export default function Sticker({
  config,
  dims = [0.94, 0.94, 0.09],
  onActivate,
  frameReady,

  // External permission to activate this portal.
  // Disabled by default.
  activationEnabled = false,
}) {
  const mat = useRef();
  const isPortal = config?.type === "portal";

  const { width, height, baseDepth, zScale, bevelRadius, smoothness, faceColor } =
    useMemo(() => {
      const [w, h, d] = dims;

      const baseDepth = Math.max(w, h);
      const zScale = d / baseDepth;

      const desiredBevel = config.bevel ?? 0.4;
      const maxRadius = 0.5 * Math.min(w, h, baseDepth);

      const bevelRadius = Math.min(
        desiredBevel,
        Math.max(0.0001, maxRadius - 1e-3)
      );

      const smoothness = Math.max(2, config.smoothness ?? 6);
      const faceColor = config.preview?.color ?? "#ffffff";

      return {
        width: w,
        height: h,
        baseDepth,
        zScale,
        bevelRadius,
        smoothness,
        faceColor,
      };
    }, [
      dims,
      config.bevel,
      config.smoothness,
      config.preview?.color,
    ]);

  const [targetBlend, setTargetBlend] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [hovered, setHovered] = useState(false);

  const watchdogRef = useRef(null);
  const handoffRef = useRef(null);

  const blendMs = useMemo(() => {
    const value = stickerDefaults?.blendMs;

    return Number.isFinite(value) && value > 0
      ? value
      : 500;
  }, []);

  const handoffFallbackMs = useMemo(() => {
    const value = stickerDefaults?.handoffFallbackMs;

    return Number.isFinite(value) && value >= 0
      ? value
      : 1200;
  }, []);

  // --------------------------------------------------
  // TIMER CLEANUP
  // --------------------------------------------------

  const clearActivationTimers = useCallback(() => {
    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    }

    if (handoffRef.current) {
      clearTimeout(handoffRef.current);
      handoffRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearActivationTimers();
    };
  }, [clearActivationTimers]);

  // --------------------------------------------------
  // ACTIVATION PERMISSION
  // --------------------------------------------------

  /**
   * If activation becomes disabled while the portal is
   * animating, immediately cancel the activation.
   *
   * This prevents a previously started animation from
   * opening a website after the user changes views.
   */
  useEffect(() => {
    if (activationEnabled) return;

    setAnimating(false);
    setTargetBlend(0);

    if (mat.current) {
      mat.current.blend = 0;
    }

    clearActivationTimers();
  }, [activationEnabled, clearActivationTimers]);

  // --------------------------------------------------
  // PORTAL BLEND ANIMATION
  // --------------------------------------------------

  useFrame((_, dt) => {
    if (!isPortal || !mat.current) return;

    // Never allow a disabled portal to continue an
    // activation or external-site handoff.
    if (!activationEnabled && animating) {
      setAnimating(false);
      setTargetBlend(0);
      mat.current.blend = 0;
      clearActivationTimers();
      return;
    }

    const current = mat.current.blend ?? 0;

    const tau = Math.max(0.0001, blendMs / 5000);
    const factor = 1 - Math.exp(-(dt / tau));

    const next = THREE.MathUtils.lerp(
      current,
      targetBlend,
      factor
    );

    mat.current.blend = THREE.MathUtils.clamp(next, 0, 1);

    if (animating && mat.current.blend > 0.985) {
      if (frameReady) {
        if (!handoffRef.current) {
          handoffRef.current = setTimeout(() => {
            handoffRef.current = null;

            if (!activationEnabled) return;

            onActivate?.();

            setAnimating(false);
            setTargetBlend(0);
            clearActivationTimers();
          }, 16);
        }
      } else if (!watchdogRef.current) {
        watchdogRef.current = setTimeout(() => {
          watchdogRef.current = null;

          if (!activationEnabled) return;

          onActivate?.();

          setAnimating(false);
          setTargetBlend(0);
          clearActivationTimers();
        }, handoffFallbackMs);
      }
    }
  });

  // --------------------------------------------------
  // START ACTIVATION
  // --------------------------------------------------

  const start = useCallback(
    (event) => {
      if (!isPortal || !activationEnabled) return;

      event?.stopPropagation();

      clearActivationTimers();

      setAnimating(true);
      setTargetBlend(1);
    },
    [
      isPortal,
      activationEnabled,
      clearActivationTimers,
    ]
  );

  // --------------------------------------------------
  // PORTAL SCENE
  // --------------------------------------------------

  const portalSceneProps = useMemo(() => {
    const portal = config.portal ?? {};

    const animation = portal.animation
      ? portal.animation
      : portal.spin
        ? {
            type: "spin",
            params: {
              speed: portal.spin.speed,
              axis: portal.spin.axis,
            },
          }
        : {
            type: "idle",
            params: {},
          };

    return {
      bgColor: faceColor,
      mesh: portal.mesh ?? {
        type: "icosa",
        props: {},
      },
      lights: portal.lights,
      distance: portal.distance ?? 0,
      animation,
      playing: isPortal && hovered,
    };
  }, [
    config.portal,
    faceColor,
    hovered,
    isPortal,
  ]);

  // --------------------------------------------------
  // HOVER
  // --------------------------------------------------

  const onOver = useCallback(
    (event) => {
      event.stopPropagation();

      setHovered(true);

      document.body.style.cursor =
        isPortal && activationEnabled
          ? "pointer"
          : "";

      // Project previews are only enabled in Cube View.
      // activationEnabled is true for the active Project View.
      if (!activationEnabled && config?.id) {
        pubsub?.emit?.("project:hover", {
          id: config.id,
        });
      }
    },
    [
      isPortal,
      activationEnabled,
      config?.id,
    ]
  );

  const onOut = useCallback(() => {
    setHovered(false);
    document.body.style.cursor = "";

    if (!activationEnabled && config?.id) {
      pubsub?.emit?.("project:unhover", {
        id: config.id,
      });
    }
  }, [
    activationEnabled,
    config?.id,
  ]);

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <group
      onClick={
        isPortal && activationEnabled
          ? start
          : undefined
      }
      onPointerOver={isPortal ? onOver : undefined}
      onPointerOut={isPortal ? onOut : undefined}
      onPointerMove={
        isPortal
          ? (event) => event.stopPropagation()
          : undefined
      }
    >
      <group scale={[1, 1, zScale]}>
        <RoundedBox
          args={[width, height, baseDepth]}
          radius={bevelRadius}
          smoothness={smoothness}
        >
          {isPortal ? (
            <MeshPortalMaterial
              ref={mat}
              side={THREE.DoubleSide}
              blend={0}
            >
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
