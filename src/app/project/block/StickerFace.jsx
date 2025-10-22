import { FACE_NORMAL, FACE_ROT } from "./constrants";
import Sticker from "../sticker/Sticker";

/**
 * One face of a block:
 * - computes its local rotation/offset
 * - renders a Sticker (portal or colored tile)
 * - forwards pointer-down for drag-rotate selection
 */
export default function StickerFace({
  size = 1,
  faceConfig,                // merged config for this face
  onActivateSticker,
  frameReady,
  blockIndex,                 // needed to choose layer on drag
  onPointerDown,              // handler from GridCube
  // tuning
  stickerSizeRatio = 0.99,
  stickerDepthRatio = 0.99,
  epsilon = -0.966,
}) {
  const { face } = faceConfig;
  const rot = FACE_ROT[face];
  const n = FACE_NORMAL[face];
  if (!rot || !n) return null;

  const w = size * stickerSizeRatio;
  const h = size * stickerSizeRatio;
  const d = size * stickerDepthRatio;

  // place slightly outside the rounded box to avoid z-fighting
  const offset = (0.5 + stickerDepthRatio / 2 + epsilon) * size;
  const pos = [n[0] * offset, n[1] * offset, n[2] * offset];

  return (
    <group
      position={pos}
      rotation={rot}
      onPointerDown={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "grabbing";
        onPointerDown?.(e, { blockIndex, face });
      }}
      onPointerUp={() => { document.body.style.cursor = ""; }}
      onPointerCancel={() => { document.body.style.cursor = ""; }}
    >
      <Sticker
        config={faceConfig}
        dims={[w, h, d]}
        onActivate={() => onActivateSticker(faceConfig.href, faceConfig)}
        frameReady={frameReady}
      />
    </group>
  );
}
