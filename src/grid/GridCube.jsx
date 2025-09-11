// src/grid/GridCube.jsx
import { useMemo } from "react";
import Block from "../block/Block";
import gridParams from "./params/grid.json";
import stickersConfig from "../sticker/params/stickers.json";

/**
 * Renders a grid of Blocks and places Stickers based on stickers.json
 */
export default function GridCube({ onActivateSticker, frameReady }) {
  const dims = gridParams.dimensions ?? [1, 1, 1];
  const spacing = gridParams.spacing ?? 1.2;

  // group stickers by block index
  const stickersByBlock = useMemo(() => {
    const map = new Map();
    for (const s of stickersConfig) {
      const key = s.block.join(",");
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(s);
    }
    return map;
  }, []);

  const blocks = [];
  for (let i = 0; i < dims[0]; i++) {
    for (let j = 0; j < dims[1]; j++) {
      for (let k = 0; k < dims[2]; k++) {
        const key = `${i},${j},${k}`;
        const x = (i - (dims[0] - 1) / 2) * spacing;
        const y = (j - (dims[1] - 1) / 2) * spacing;
        const z = (k - (dims[2] - 1) / 2) * spacing;
        blocks.push(
          <Block
            key={key}
            position={[x, y, z]}
            size={1.0}
            stickers={stickersByBlock.get(key) ?? []}
            onActivateSticker={onActivateSticker}
            frameReady={frameReady}
          />
        );
      }
    }
  }

  return <group>{blocks}</group>;
}
