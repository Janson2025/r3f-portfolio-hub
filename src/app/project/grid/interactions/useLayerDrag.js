// src/app/project/grid/interactions/useLayerRotate.js
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import {
  resetGroup,
  attachLayerByIndex,
  bakeBack,
  snapPositionsAndReindex,
  normalizeAngle,
} from "./dragUtils.js";

/**
 * Programmatic quarter-turns with tween, bake & reindex.
 * API:
 *  - rotate(axisLetter: 'x'|'y'|'z', layerIndex: 0|1|2, dir: -1|+1)
 *  - rotating(): boolean
 */
export default function useLayerRotate({
  cubeRootRef,
  tmpGroupRef,
  getBlocks,          // not used here directly, but keep for parity/future
  dims = [3, 3, 3],   // ← IMPORTANT: needed to reindex after turn
  spacing = 1.03,     // ← matches your GridCube spacing
  durationMs = 250,
}) {
  const tw = useRef({
    active: false,
    axis: "z",
    from: 0,
    to: 0,
    t: 0,
    dur: durationMs,
  });

  useFrame((_, dt) => {
    if (!tw.current.active) return;
    const g = tmpGroupRef.current;
    if (!g) return;

    // easeInOutCubic
    const k = Math.min(1, (tw.current.t + dt / (tw.current.dur / 1000)));
    tw.current.t = k;
    const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    const angle = THREE.MathUtils.lerp(tw.current.from, tw.current.to, e);
    g.rotation[tw.current.axis] = angle;

    if (k >= 1) {
      // finalize: bake layer back to root, snap positions, rewrite ijk
      bakeBack(cubeRootRef.current, g);
      snapPositionsAndReindex(cubeRootRef.current, dims, spacing);
      // leave tmp group visible but empty; reset its rotation
      g.rotation.set(0, 0, 0);
      tw.current.active = false;
    }
  });

  const api = {
    rotating: () => tw.current.active,

    rotate(axisLetter, layerIndex, dir) {
      if (api.rotating()) return;

      // 1) Clean slate
      resetGroup(cubeRootRef.current, tmpGroupRef.current);

      // 2) Attach chosen layer by current ijk
      attachLayerByIndex(cubeRootRef.current, tmpGroupRef.current, axisLetter, layerIndex);

      // Ensure layer is visible while attached
      tmpGroupRef.current.visible = true;

      // 3) Define tween from current angle (normalized) to ±90°
      const a0 = normalizeAngle(tmpGroupRef.current.rotation[axisLetter] || 0);
      const step = Math.PI / 2;
      const a1 = a0 + step * (dir >= 0 ? 1 : -1);

      tw.current.axis = axisLetter;
      tw.current.from = a0;
      tw.current.to = a1;
      tw.current.t = 0;
      tw.current.dur = durationMs;
      tw.current.active = true;
    },
  };

  return api;
}
