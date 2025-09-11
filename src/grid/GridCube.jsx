// src/grid/GridCube.jsx
import { useMemo } from "react";
import Block from "../block/Block";
import gridParams from "./params/grid.json";
import customStickers from "../sticker/params/stickers.json";
import { RUBIK_FACE_COLORS } from "../shared/constants";

/** Faces and their boundary checks (z+, z-, x+, x-, y+, y-) */
const FACES = [
  { name: "front",  isExposed: (i,j,k,dx,dy,dz) => k === dz - 1 }, // z+
  { name: "back",   isExposed: (i,j,k,dx,dy,dz) => k === 0 },      // z-
  { name: "right",  isExposed: (i,j,k,dx,dy,dz) => i === dx - 1 }, // x+
  { name: "left",   isExposed: (i,j,k,dx,dy,dz) => i === 0 },      // x-
  { name: "top",    isExposed: (i,j,k,dx,dy,dz) => j === dy - 1 }, // y+
  { name: "bottom", isExposed: (i,j,k,dx,dy,dz) => j === 0 },      // y-
];

export default function GridCube({ onActivateSticker, frameReady }) {
  const dims = gridParams.dimensions ?? [3, 3, 3];
  const spacing = gridParams.spacing ?? 1.03;
  const [dx, dy, dz] = dims;

  // Index overrides by "i,j,k:face"
  const overrides = useMemo(() => {
    const map = new Map();
    for (const s of customStickers) {
      const key = `${s.block[0]},${s.block[1]},${s.block[2]}:${s.face}`;
      map.set(key, s);
    }
    return map;
  }, []);

  const blocks = [];
  for (let i = 0; i < dx; i++) {
    for (let j = 0; j < dy; j++) {
      for (let k = 0; k < dz; k++) {
        const key = `${i},${j},${k}`;
        const x = (i - (dx - 1) / 2) * spacing;
        const y = (j - (dy - 1) / 2) * spacing;
        const z = (k - (dz - 1) / 2) * spacing;

        // Default stickers for exposed faces (Rubik’s colors)
        const defaults = [];
        for (const f of FACES) {
          if (f.isExposed(i, j, k, dx, dy, dz)) {
            defaults.push({
              id: `auto-${key}-${f.name}`,
              block: [i, j, k],
              face: f.name,
              type: "plain",
              // This preview color is ALSO used by portal background in Sticker.jsx
              preview: { color: RUBIK_FACE_COLORS[f.name] },
              bevel: 0.02,
            });
          }
        }

        // Merge overrides (portals or custom props)
        const merged = defaults.map((d) => {
          const o = overrides.get(`${i},${j},${k}:${d.face}`);
          if (!o) return d;

          // Preserve auto color unless override explicitly provides one
          const mergedPreview = {
            ...(d.preview || {}),
            ...(o.preview || {}),
            color: (o.preview && o.preview.color) ? o.preview.color : d.preview?.color,
          };

          return { ...d, ...o, preview: mergedPreview };
        });

        blocks.push(
          <Block
            key={key}
            position={[x, y, z]}
            size={1.0}
            stickers={merged}
            onActivateSticker={onActivateSticker}
            frameReady={frameReady}
          />
        );
      }
    }
  }

  return <group>{blocks}</group>;
}
