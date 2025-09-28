import React, { useMemo, useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import Block from "../block/Block";
import gridParams from "./params/grid.json";
import customStickers from "../sticker/params/stickers.json";
import useLayerRotate from "./interactions/useLayerRotate.js";

const GridCube = forwardRef(function GridCube({ onActivateSticker, frameReady }, ref) {
  const dims = gridParams.dimensions ?? [3, 3, 3];
  const spacing = gridParams.spacing ?? 1.03;
  const [dx, dy, dz] = dims;

  // Build overrides map once
  const overrides = useMemo(() => {
    const map = new Map();
    for (const s of customStickers) {
      const key = `${s.block[0]},${s.block[1]},${s.block[2]}:${s.face}`;
      map.set(key, s);
    }
    return map;
  }, []);

  // blocks model (keep your shape, but add a ref per block)
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

  const cubeRootRef = useRef();    // parent for all blocks
  const tmpGroupRef = useRef();    // temporary rotation parent

  const getBlocks = useCallback(() => blocks, [blocks]);

  // Hook providing rotate(axis, layer, dir)
  const rotateApi = useLayerRotate({ cubeRootRef, tmpGroupRef, getBlocks });

  // Expose a dev API (optional) so your HUD/overlay can call rotations
  useImperativeHandle(ref, () => ({
    devAPI: {
      rotateX: (layer, dir) => rotateApi.rotate("x", layer, dir),
      rotateY: (layer, dir) => rotateApi.rotate("y", layer, dir),
      rotateZ: (layer, dir) => rotateApi.rotate("z", layer, dir),
      // convenience: names you mentioned earlier
      x_left:  (dir) => rotateApi.rotate("x", 0, dir),
      x_mid:   (dir) => rotateApi.rotate("x", 1, dir),
      x_right: (dir) => rotateApi.rotate("x", 2, dir),
      y_front: (dir) => rotateApi.rotate("y", 0, dir),
      y_mid:   (dir) => rotateApi.rotate("y", 1, dir),
      y_back:  (dir) => rotateApi.rotate("y", 2, dir),
      z_top:   (dir) => rotateApi.rotate("z", 2, dir),
      z_mid:   (dir) => rotateApi.rotate("z", 1, dir),
      z_bottom:(dir) => rotateApi.rotate("z", 0, dir),
      busy: rotateApi.rotating,
    }
  }), [rotateApi]);

  // Render blocks from ijk and spacing
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
          forwardRef={b.ref}               // expose the Object3D for reparenting
          onStickerPointerDown={undefined} // (Phase 2: drag-to-rotate)
        />
      );
    });
  }, [blocks, dx, dy, dz, spacing, overrides, onActivateSticker, frameReady]);

  return (
    <group ref={cubeRootRef}>
      {/* Temporary rotation group */}
      <group ref={tmpGroupRef} visible={false} />
      {blockEls}
    </group>
  );
});

export default GridCube;
