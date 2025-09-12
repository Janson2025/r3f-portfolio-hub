// src/block/Block.jsx
import { useMemo, useRef } from "react";
import { RoundedBox } from "@react-three/drei";
import Sticker from "../sticker/Sticker";
import params from "./params/block.json";
import { RUBIK_FACE_COLORS } from "../shared/constants";
import stickerDefaults from "../sticker/params/stickerDefaults.json";

/**
 * Face rotations and normals (same as before)
 */
const FACE_ROT = {
  front:  [0, 0, 0],
  back:   [0, Math.PI, 0],
  right:  [0,  Math.PI / 2, 0],
  left:   [0, -Math.PI / 2, 0],
  top:    [-Math.PI / 2, 0, 0],
  bottom: [ Math.PI / 2, 0, 0],
};

const FACE_NORMAL = {
  front:  [0, 0,  0.933],
  back:   [0, 0, -0.933],
  right:  [ 0.933, 0, 0],
  left:   [-0.933, 0, 0],
  top:    [0,  0.933, 0],
  bottom: [0, -0.933, 0],
};

/** Exposure checks (z+, z-, x+, x-, y+, y-) */
const FACES = [
  { name: "front",  isExposed: (i,j,k,dx,dy,dz) => k === dz - 1 },
  { name: "back",   isExposed: (i,j,k,dx,dy,dz) => k === 0 },
  { name: "right",  isExposed: (i,j,k,dx,dy,dz) => i === dx - 1 },
  { name: "left",   isExposed: (i,j,k,dx,dy,dz) => i === 0 },
  { name: "top",    isExposed: (i,j,k,dx,dy,dz) => j === dy - 1 },
  { name: "bottom", isExposed: (i,j,k,dx,dy,dz) => j === 0 },
];

export default function Block({
  position = [0, 0, 0],
  size = 1,
  blockIndex = [0, 0, 0],     // NEW: which cubelet am I?
  gridDims = [3, 3, 3],       // NEW: for exposure calc
  overrides = new Map(),      // NEW: Map "i,j,k:face" -> override cfg
  onActivateSticker,
  frameReady,
}) {
  const group = useRef();
  const [i, j, k] = blockIndex;
  const [dx, dy, dz] = gridDims;

  // Sticker visual proportions (relative to block size)
  const stickerSizeRatio = 0.9;   // width/height
  const stickerDepthRatio = 0.04; // thickness
  const epsilon = 0.002;          // avoid z-fighting

  /**
   * Build this block's stickers:
   * 1) Auto-generate defaults for EXPOSED faces (plain stickers, Rubik colors)
   * 2) Merge any overrides for this block's faces
   * 3) Apply global sticker defaults for portals (type/bevel/smoothness)
   * 4) Filter out faces explicitly set to "none"
   */
  const stickers = useMemo(() => {
    const keyBase = `${i},${j},${k}`;

    // 1) defaults
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

    // 2-3) merge overrides + apply global defaults for portals
    const merged = defaults
      .map((d) => {
        const o = overrides.get(`${keyBase}:${d.face}`);
        if (!o) return d;
        if (o.type === "none") return null;

        // Decide type: override > global default ("portal") > fallback "plain"
        const type = o.type ?? stickerDefaults.type ?? "portal";

        // Apply bevel/smoothness for portals from global defaults unless overridden
        const bevel =
          o.bevel ?? (type === "portal" ? (stickerDefaults.bevel ?? 0.06) : d.bevel);
        const smoothness =
          o.smoothness ?? (type === "portal" ? (stickerDefaults.smoothness ?? 6) : d.smoothness);

        // Preserve default color unless override provides one
        const mergedPreview = {
          ...(d.preview || {}),
          ...(o.preview || {}),
          color:
            (o.preview && o.preview.color) ? o.preview.color : d.preview?.color,
        };

        return { ...d, ...o, type, bevel, smoothness, preview: mergedPreview };
      })
      .filter(Boolean);

    return merged;
  }, [i, j, k, dx, dy, dz, overrides]);

  return (
    <group ref={group} position={position}>
      {/* Block body */}
      <RoundedBox args={[size, size, size]} radius={params.bevel ?? 0.05} smoothness={4}>
        <meshStandardMaterial
          color={params.material?.color ?? "#1b1e24"}
          roughness={params.material?.roughness ?? 0.9}
          metalness={params.material?.metalness ?? 0.1}
          flatShading={false}
        />
      </RoundedBox>

      {/* Stickers ON this block (parented, so they follow block transforms) */}
      {stickers.map((s) => {
        const rot = FACE_ROT[s.face];
        const n = FACE_NORMAL[s.face];
        if (!rot || !n) return null;

        const w = size * stickerSizeRatio;
        const h = size * stickerSizeRatio;
        const d = size * stickerDepthRatio;

        // Place OUTSIDE surface: 0.5 (surface) + d/2 + epsilon
        const offset = (0.5 + stickerDepthRatio / 2 + epsilon) * size;
        const pos = [n[0] * offset, n[1] * offset, n[2] * offset];

        return (
          <group key={s.id} position={pos} rotation={rot}>
            <Sticker
              config={s}
              dims={[w, h, d]}
              onActivate={() => onActivateSticker(s.href)}
              frameReady={frameReady}
            />
          </group>
        );
      })}
    </group>
  );
}
