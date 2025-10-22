// src/app/project/grid/GridCube.jsx
import React, {
  useMemo,
  useRef,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import Block from "../block/Block";
import gridParams from "./params/grid.json";
import customStickers from "../sticker/params/stickers.json";
import useLayerRotate from "./interactions/useLayerRotate.js";
import useLayerDrag from "./interactions/useLayerDrag.js";

const GridCube = forwardRef(function GridCube({ onActivateSticker, frameReady }, ref) {
  // --- grid setup ---
  const dims = gridParams.dimensions ?? [3, 3, 3];
  const spacing = gridParams.spacing ?? 1.03;
  const [dx, dy, dz] = dims;

  // --- drag kill-switch ---
  // Flip to true when you're ready to re-enable drag.
  const DRAG_ENABLED = false;

  // --- sticker overrides map (block,face) -> config ---
  const overrides = useMemo(() => {
    const map = new Map();
    for (const s of customStickers) {
      const key = `${s.block[0]},${s.block[1]},${s.block[2]}:${s.face}`;
      map.set(key, s);
    }
    return map;
  }, []);

  // --- stable blocks model (ref per cubelet) ---
  const [blocks] = useState(() => {
    const arr = [];
    let id = 0;
    for (let i = 0; i < dx; i++) {
      for (let j = 0; j < dy; j++) {
        for (let k = 0; k < dz; k++) {
          arr.push({ id: id++, ijk: [i, j, k], ref: React.createRef() });
        }
      }
    }
    return arr;
  });

  // expose for rotate/drag helpers
  const getBlocks = useCallback(() => blocks, [blocks]);

  // --- scene groups ---
  const cubeRootRef = useRef(); // parent for all blocks
  const tmpGroupRef = useRef(); // temporary rotation parent (used by BOTH rotate & drag)

  // --- animated 90° button rotations ---
  const rotateApi = useLayerRotate({
    cubeRootRef,
    tmpGroupRef,
    getBlocks,
    dims,          // ← add these
    spacing,       // ← add these
    durationMs: 250,
  });

  // --- drag hook wired but disabled (so code stays intact) ---
  const dragApi = useLayerDrag({
    cubeRootRef,
    tmpGroupRef,
    enabled: DRAG_ENABLED, // <— OFF for now
    dims: [dx, dy, dz],
    spacing,
  });

  // pointer start intended for drag — only attaches when enabled
  const onStickerPointerDown = useCallback(
    (e, info) => {
      if (!DRAG_ENABLED) return;
      if (rotateApi.rotating() || dragApi.rotating()) return;

      dragApi.dragStart(e, info);

      const onMove = (ev) => dragApi.dragUpdate(ev);
      const onEnd = () => {
        dragApi.dragEnd();
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onEnd);
        window.removeEventListener("pointercancel", onEnd);
      };

      window.addEventListener("pointermove", onMove, { passive: false });
      window.addEventListener("pointerup", onEnd, { passive: true });
      window.addEventListener("pointercancel", onEnd, { passive: true });
    },
    [DRAG_ENABLED, dragApi, rotateApi]
  );

  // --- dev/HUD API for your panel ---
  useImperativeHandle(
    ref,
    () => ({
      devAPI: {
        rotateX: (layer, dir) => rotateApi.rotate("x", layer, dir),
        rotateY: (layer, dir) => rotateApi.rotate("y", layer, dir),
        rotateZ: (layer, dir) => rotateApi.rotate("z", layer, dir),

        // convenience aliases
        x_left: (dir) => rotateApi.rotate("x", 0, dir),
        x_mid: (dir) => rotateApi.rotate("x", 1, dir),
        x_right: (dir) => rotateApi.rotate("x", 2, dir),

        y_front: (dir) => rotateApi.rotate("y", 0, dir),
        y_mid: (dir) => rotateApi.rotate("y", 1, dir),
        y_back: (dir) => rotateApi.rotate("y", 2, dir),

        z_bottom: (dir) => rotateApi.rotate("z", 0, dir),
        z_mid: (dir) => rotateApi.rotate("z", 1, dir),
        z_top: (dir) => rotateApi.rotate("z", 2, dir),

        busy: () => rotateApi.rotating() || dragApi.rotating(), // dragApi.rotating() will be false when disabled
      },
    }),
    [rotateApi, dragApi]
  );

  // --- render all blocks at their spaced ijk positions ---
  const blockEls = useMemo(() => {
    return blocks.map((b) => {
      const [i, j, k] = b.ijk;
      const x = (i - (dx - 1) / 2) * spacing;
      const y = (j - (dy - 1) / 2) * spacing;
      const z = (k - (dz - 1) / 2) * spacing;

      return (
        <Block
          key={b.id}
          position={[x, y, z]}
          size={1.0}
          blockIndex={[i, j, k]}
          gridDims={[dx, dy, dz]}
          overrides={overrides}
          onActivateSticker={onActivateSticker}
          frameReady={frameReady}
          forwardRef={b.ref}
          // Only wire the drag start handler when drag is enabled
          onStickerPointerDown={DRAG_ENABLED ? onStickerPointerDown : undefined}
        />
      );
    });
  }, [
    blocks,
    dx,
    dy,
    dz,
    spacing,
    overrides,
    onActivateSticker,
    frameReady,
    onStickerPointerDown,
    DRAG_ENABLED,
  ]);

  return (
    <group ref={cubeRootRef}>
      {/* IMPORTANT: keep visible=true so button-rotations don't make children disappear while attached */}
      <group ref={tmpGroupRef} visible={true} />
      {blockEls}
    </group>
  );
});

export default GridCube;
