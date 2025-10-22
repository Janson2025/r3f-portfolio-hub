import { useEffect, useRef } from "react";
import BlockBody from "./BlockBody";
import StickerFace from "./StickerFace";
import useBlockStickers from "./hooks/useBlockStickers";

/**
 * One cubelet block with 0–6 stickers parented to it.
 * Exposes userData.ijk so the grid can select layers quickly.
 */
export default function Block({
  position = [0, 0, 0],
  size = 1,
  blockIndex = [0, 0, 0],
  gridDims = [3, 3, 3],
  overrides = new Map(),
  onActivateSticker,
  frameReady,
  onStickerPointerDown, // passed to StickerFace
  forwardRef,           // allows external parenting to this block
}) {
  const localRef = useRef();
  const group = forwardRef ?? localRef;

  // expose ijk for layer-selection logic
  useEffect(() => {
    if (group.current) group.current.userData.ijk = blockIndex;
  }, [blockIndex, group]);

  const stickers = useBlockStickers({ blockIndex, gridDims, overrides });

  return (
    <group ref={group} position={position} userData={{ ijk: blockIndex }}>
      <BlockBody size={size} />

      {stickers.map((s) => (
        <StickerFace
          key={s.id}
          size={size}
          faceConfig={s}
          blockIndex={blockIndex}
          onActivateSticker={onActivateSticker}
          frameReady={frameReady}
          onPointerDown={onStickerPointerDown}
        />
      ))}
    </group>
  );
}
