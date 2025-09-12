// src/block/hooks/useBlockStickers.js
import { useMemo } from "react";
import { RUBIK_FACE_COLORS } from "../../shared/constants";
import stickerDefaults from "../../sticker/params/stickerDefaults.json";
import { FACES } from "../hooks/useBlockStickers";

/**
 * Builds this block's stickers:
 * 1) Auto default plain stickers for exposed faces (Rubik colors)
 * 2) Merge overrides for this block/face
 * 3) Apply global portal defaults (type/bevel/smoothness) when relevant
 * 4) Remove faces with type:"none"
 */
export default function useBlockStickers({
  blockIndex, gridDims, overrides,
}) {
  const [i, j, k] = blockIndex;
  const [dx, dy, dz] = gridDims;

  return useMemo(() => {
    const keyBase = `${i},${j},${k}`;

    // 1) defaults per exposed face
    const defaults = [];
    for (const f of FACES) {
      if (f.isExposed(i, j, k, dx, dy, dz)) {
        defaults.push({
          id: `auto-${keyBase}-${f.name}`,
          block: [i, j, k],
          face: f.name,
          type: "plain",
          preview: { color: RUBIK_FACE_COLORS[f.name] },
          bevel: 0.02,
        });
      }
    }

    // 2–4) merge overrides / apply portal defaults / filter "none"
    const merged = defaults
      .map((d) => {
        const o = overrides.get(`${keyBase}:${d.face}`);
        if (!o) return d;
        if (o.type === "none") return null;

        // type precedence: override > global default ("portal") > fallback "plain"
        const type = o.type ?? stickerDefaults.type ?? "portal";

        // bevel/smoothness: apply global defaults for portals unless overridden
        const bevel =
          o.bevel ?? (type === "portal" ? (stickerDefaults.bevel ?? 0.06) : d.bevel);
        const smoothness =
          o.smoothness ?? (type === "portal" ? (stickerDefaults.smoothness ?? 6) : d.smoothness);

        // keep default color unless override provides one
        const mergedPreview = {
          ...(d.preview || {}),
          ...(o.preview || {}),
          color: (o.preview && o.preview.color) ? o.preview.color : d.preview?.color,
        };

        return { ...d, ...o, type, bevel, smoothness, preview: mergedPreview };
      })
      .filter(Boolean);

    return merged;
  }, [i, j, k, dx, dy, dz, overrides]);
}
