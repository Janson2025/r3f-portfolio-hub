
import { useMemo } from "react";
import { RUBIK_FACE_COLORS } from "../../shared/constants";
import stickerData from "../../sticker/params/stickers.json";
import { FACES } from "../constrants";

const stickerDefaults = stickerData.defaults ?? {};

/**
 * Builds this block's stickers:
 * 1. Auto default plain stickers for exposed faces.
 * 2. Merge project overrides for this block/face.
 * 3. Apply global sticker defaults.
 * 4. Remove faces with type:"none".
 */
export default function useBlockStickers({
  blockIndex,
  gridDims,
  overrides,
}) {
  const [i, j, k] = blockIndex;
  const [dx, dy, dz] = gridDims;

  return useMemo(() => {
    const keyBase = `${i},${j},${k}`;

    // 1. Defaults per exposed face.
    const defaults = [];

    for (const face of FACES) {
      if (face.isExposed(i, j, k, dx, dy, dz)) {
        defaults.push({
          id: `auto-${keyBase}-${face.name}`,
          block: [i, j, k],
          face: face.name,
          type: "plain",
          preview: {
            color: RUBIK_FACE_COLORS[face.name],
          },
          bevel: 0.1,
        });
      }
    }

    // 2. Merge overrides and apply global defaults.
    const merged = defaults
      .map((defaultSticker) => {
        const override = overrides.get(
          `${keyBase}:${defaultSticker.face}`
        );

        if (!override) return defaultSticker;
        if (override.type === "none") return null;

        const type =
          override.type ??
          stickerDefaults.type ??
          "plain";

        const bevel =
          override.bevel ??
          (type === "portal"
            ? stickerDefaults.bevel ?? 0.06
            : defaultSticker.bevel);

        const smoothness =
          override.smoothness ??
          (type === "portal"
            ? stickerDefaults.smoothness ?? 6
            : defaultSticker.smoothness);

        const preview = {
          ...(defaultSticker.preview || {}),
          ...(override.preview || {}),
          color:
            override.preview?.color ??
            defaultSticker.preview?.color,
        };

        return {
          ...defaultSticker,
          ...override,
          type,
          bevel,
          smoothness,
          preview,
        };
      })
      .filter(Boolean);

    return merged;
  }, [i, j, k, dx, dy, dz, overrides]);
}
