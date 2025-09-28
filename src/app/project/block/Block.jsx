import { useEffect, useRef } from "react";
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
  forwardRef,                 // NEW
}) {
  const localRef = useRef();
  const group = forwardRef ?? localRef;

  // expose ijk for selection
  useEffect(() => {
    if (group.current) group.current.userData.ijk = blockIndex;
  }, [group, blockIndex]);

  const stickers = useBlockStickers({ blockIndex, gridDims, overrides });

  return (
    <group ref={group} position={position}>
      <BlockBody size={size} />
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
