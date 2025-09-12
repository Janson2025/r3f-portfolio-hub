// src/block/StickerFace.jsx
import { FACE_NORMAL, FACE_ROT } from "./constrants";
import Sticker from "../sticker/Sticker";

/**
 * Renders a single sticker on a given face of a block:
 * - computes rotation + position offset
 * - sets sticker dims from ratios
 */
export default function StickerFace({
  size = 1,
  faceConfig,                // the merged sticker config (s)
  onActivateSticker,
  frameReady,

  // tuning
  stickerSizeRatio = 0.9,
  stickerDepthRatio = 0.04,
  epsilon = 0.002,
}) {
  const { face } = faceConfig;
  const rot = FACE_ROT[face];
  const n = FACE_NORMAL[face];
  if (!rot || !n) return null;

  const w = size * stickerSizeRatio;
  const h = size * stickerSizeRatio;
  const d = size * stickerDepthRatio;

  // Place OUTSIDE surface: 0.5 (surface) + d/2 + epsilon
  const offset = (0.5 + stickerDepthRatio / 2 + epsilon) * size;
  const pos = [n[0] * offset, n[1] * offset, n[2] * offset];

  return (
    <group position={pos} rotation={rot}>
      <Sticker
        config={faceConfig}
        dims={[w, h, d]}
        onActivate={() => onActivateSticker(faceConfig.href, faceConfig)}
        frameReady={frameReady}
      />
    </group>
  );
}
