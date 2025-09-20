// src/grid/GridCube.jsx
import React, { useMemo, useRef, useState, useCallback } from "react";
import Block from "../block/Block";
import gridParams from "./params/grid.json";
import customStickers from "../sticker/params/stickers.json";

export default function GridCube({ onActivateSticker, frameReady }) {
  const dims = gridParams.dimensions ?? [3, 3, 3];
  const spacing = gridParams.spacing ?? 1.03;
  const [dx, dy, dz] = dims;

  // Build an overrides map once: "i,j,k:face" -> override
  const overrides = useMemo(() => {
    const map = new Map();
    for (const s of customStickers) {
      const key = `${s.block[0]},${s.block[1]},${s.block[2]}:${s.face}`;
      map.set(key, s);
    }
    return map;
  }, []);

  // --- Model-driven blocks state
  const [blocks, setBlocks] = useState(() => {
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

  // Future use: the tmp rotating group (hidden by default)
  const tmpGroupRef = useRef();

  // Helper (needed later by the rotation hook; harmless now)
  const getBlocks = useCallback(() => blocks, [blocks]);

  // Render from indices each frame
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
          forwardRef={b.ref}                 // NEW: expose Object3D (used later)
          onStickerPointerDown={undefined}   // wired in Phase 2
        />
      );
    });
  }, [blocks, dx, dy, dz, spacing, overrides, onActivateSticker, frameReady]);

  return (
    <group>
      {/* Hidden rotating layer group (used in Phase 2+) */}
      <group ref={tmpGroupRef} visible={false} />
      {blockEls}
    </group>
  );
}
