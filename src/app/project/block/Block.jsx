
import { useEffect, useRef } from "react";
import BlockBody from "./BlockBody";
import StickerFace from "./StickerFace";
import useBlockStickers from "./hooks/useBlockStickers";

/**
 * One cubelet block with 0–6 stickers parented to it.
 *
 * blockIndex:
 *   Permanent original coordinates.
 *   Used for sticker identity and project overrides.
 *
 * gridPosition:
 *   Current logical coordinates.
 *   Used for slice selection and interactions.
 */
export default function Block({
  position = [0, 0, 0],
  quaternion = [0, 0, 0, 1],

  size = 1,

  cubieId,
  blockIndex = [0, 0, 0],
  gridPosition = blockIndex,

  gridDims = [3, 3, 3],
  faceMap = {},

  overrides = new Map(),

  onActivateSticker,
  frameReady,
  onStickerPointerDown,

  forwardRef,
}) {
  const localRef = useRef();
  const group = forwardRef ?? localRef;

  // Keep interaction metadata synchronized with the current engine state.
  useEffect(() => {
    if (!group.current) return;

    group.current.userData.cubieId = cubieId;
    group.current.userData.ijk = [...gridPosition];
    group.current.userData.originalPosition = [...blockIndex];
    group.current.userData.faceMap = { ...faceMap };
  }, [
    cubieId,
    gridPosition,
    blockIndex,
    faceMap,
    group,
  ]);

  // Sticker identity must always use the original position.
  const stickers = useBlockStickers({
    blockIndex,
    gridDims,
    overrides,
  });

  return (
    <group
      ref={group}
      position={position}
      quaternion={quaternion}
      userData={{
        cubieId,
        ijk: gridPosition,
        originalPosition: blockIndex,
        faceMap,
      }}
    >
      <BlockBody size={size} />

      {stickers.map((s) => (
        <StickerFace
          key={s.id}
          size={size}
          faceConfig={s}
          cubieId={cubieId}
          blockIndex={gridPosition}
          onActivateSticker={onActivateSticker}
          frameReady={frameReady}
          onPointerDown={onStickerPointerDown}
        />
      ))}
    </group>
  );
}
