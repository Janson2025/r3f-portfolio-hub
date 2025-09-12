// src/block/Block.jsx
import { useRef } from "react";
import BlockBody from "./BlockBody";
import StickerFace from "./StickerFace";
import useBlockStickers from "./hooks/useBlockStickers";

export default function Block({
  position = [0, 0, 0],
  size = 1,
  blockIndex = [0, 0, 0],
  gridDims = [3, 3, 3],
  overrides = new Map(),
  onActivateSticker,
  frameReady,
}) {
  const group = useRef();

  // Compute this block's stickers (defaults + overrides + global portal defaults)
  const stickers = useBlockStickers({ blockIndex, gridDims, overrides });

  return (
    <group ref={group} position={position}>
      <BlockBody size={size} />

      {/* Stickers parented to this block */}
      {stickers.map((s) => (
        <StickerFace
          key={s.id}
          size={size}
          faceConfig={s}
          onActivateSticker={onActivateSticker}
          frameReady={frameReady}
        />
      ))}
    </group>
  );
}
