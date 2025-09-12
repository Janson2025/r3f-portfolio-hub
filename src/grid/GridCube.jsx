// src/grid/GridCube.jsx
import { useMemo } from "react";
import Block from "../block/Block";
import gridParams from "./params/grid.json";
import customStickers from "../sticker/params/stickers.json";

/**
 * GridCube now ONLY lays out blocks and passes down:
 *  - blockIndex: [i,j,k]
 *  - gridDims: [dx,dy,dz]   (for face exposure checks inside Block)
 *  - overrides: Map keyed by "i,j,k:face" -> sticker override object
 */
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

  const blocks = [];
  for (let i = 0; i < dx; i++) {
    for (let j = 0; j < dy; j++) {
      for (let k = 0; k < dz; k++) {
        const x = (i - (dx - 1) / 2) * spacing;
        const y = (j - (dy - 1) / 2) * spacing;
        const z = (k - (dz - 1) / 2) * spacing;

        blocks.push(
          <Block
            key={`${i},${j},${k}`}
            position={[x, y, z]}
            size={1.0}
            blockIndex={[i, j, k]}
            gridDims={[dx, dy, dz]}
            overrides={overrides}
            onActivateSticker={onActivateSticker}
            frameReady={frameReady}
          />
        );
      }
    }
  }

  return <group>{blocks}</group>;
}
