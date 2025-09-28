import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { tweenRotation, updateTweens, activeTweens } from "../../shared/tween.js";

/**
 * useLayerRotate
 * Parameters:
 *  - cubeRootRef: ref to the group containing all Block groups
 *  - tmpGroupRef: ref to an empty group used as a temporary parent
 *  - getBlocks: () => [{ ref, ijk }] from GridCube state (ijk = [i,j,k])
 *
 * API:
 *  - rotating(): boolean
 *  - rotate(axis: 'x'|'y'|'z', layer: 0|1|2, dir: +1|-1)
 */
export default function useLayerRotate({ cubeRootRef, tmpGroupRef, getBlocks }) {
  const api = useMemo(() => ({
    rotating: () => activeTweens() > 0,

    rotate(axis, layer, dir = 1) {
      const root = cubeRootRef.current;
      const grp  = tmpGroupRef.current;
      if (!root || !grp) return;
      if (activeTweens()) return;

      // 1) reset: move any prior children back
      for (let i = grp.children.length - 1; i >= 0; i--) root.attach(grp.children[i]);
      grp.rotation.set(0, 0, 0);
      grp.updateMatrixWorld(true);

      // 2) select layer by ijk index (NOT world position)
      const idx = axis === "x" ? 0 : axis === "y" ? 1 : 2;

      const blocks = getBlocks();
      for (const b of blocks) {
        const o3d = b.ref?.current;
        if (!o3d) continue;
        // ensure ijk is known (we copy it onto userData too in Block)
        const ijk = o3d.userData?.ijk ?? b.ijk;
        if (ijk?.[idx] === layer) grp.attach(o3d);
      }
      grp.updateMatrixWorld(true);

      // 3) animate ±90°
      const delta = (Math.PI / 2) * (dir >= 0 ? 1 : -1);
      tweenRotation({
        obj: grp,
        axis,
        deltaRadians: delta,
        durationMs: 250,
        onComplete: () => {
          // 4) re-parent to root (no snapping of rotation/position!)
          for (let i = grp.children.length - 1; i >= 0; i--) root.attach(grp.children[i]);
          grp.rotation.set(0, 0, 0);
          grp.updateMatrixWorld(true);
        }
      });
    }
  }), [cubeRootRef, tmpGroupRef, getBlocks]);

  useFrame(updateTweens);

  return api;
}
