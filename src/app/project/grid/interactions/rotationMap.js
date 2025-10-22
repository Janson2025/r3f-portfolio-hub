// src/app/project/grid/interactions/rotationMap.js
import { dominantAxisLetter, layerIndexForAxis } from "./dragUtils.js";

/**
 * Default per-face mapping: which vector determines rotation axis when U or V "wins".
 * - "N_AXIS" => use face normal basis (N_l)
 * - "U_AXIS" => use face right basis  (U_l)
 * - "V_AXIS" => use face up basis     (V_l)  ← available if you want it later
 *
 * swapUVLock = false (default): U→N, V→U (your earlier behavior)
 * swapUVLock = true:             U→U, V→N (your swapped request)
 */
export const DEFAULT_FACE_MAP = (swapUVLock = false) => {
  const Umap = swapUVLock ? "U_AXIS" : "N_AXIS";
  const Vmap = swapUVLock ? "N_AXIS" : "U_AXIS";
  // You can specialize any face here if needed:
  return {
    front:  { U: Umap, V: Vmap },
    back:   { U: Umap, V: Vmap },
    right:  { U: Umap, V: Vmap },
    left:   { U: Umap, V: Vmap },
    top:    { U: Umap, V: Vmap },
    bottom: { U: Umap, V: Vmap },
  };
};

// Direction sense per face (CW/CCW feel while dragging)
export const DEFAULT_FACE_SIGN = {
  front: +1, back: -1,
  right: +1, left: -1,
  top:   +1, bottom: -1,
};

// Optional global axis remap (e.g., swap y<->z in your app)
export const DEFAULT_AXIS_MAP = { x: "x", y: "y", z: "z" };

/**
 * Resolve a drag decision to (axisLetter, layerIndex, dirSign).
 * @param {Object} args
 *  - face: "front"|"back"|...
 *  - winner: "U"|"V" (which motion dominated)
 *  - blockIndex: [i,j,k]
 *  - basisLocal: { U_l, V_l, N_l } in cube-root local space
 *  - axisMap: {x,y,z} remapping (optional)
 *  - faceSign: per-face sign (optional)
 *  - faceMap: override of DEFAULT_FACE_MAP(swap) (optional)
 *  - swapUVLock: boolean to build default face map (optional)
 */
export function resolveDragToTurn({
  face,
  winner,
  blockIndex,
  basisLocal,
  axisMap = DEFAULT_AXIS_MAP,
  faceSign = DEFAULT_FACE_SIGN,
  faceMap,
  swapUVLock = false,
}) {
  const fmap = faceMap ?? DEFAULT_FACE_MAP(swapUVLock);
  const rule = fmap[face]?.[winner];
  if (!rule) {
    // fallback: behave like U→N, V→U
    return pickAxisAndLayer("N_AXIS", { blockIndex, basisLocal, axisMap, dirSign: faceSign[face] ?? 1 });
  }
  return pickAxisAndLayer(rule, { blockIndex, basisLocal, axisMap, dirSign: faceSign[face] ?? 1 });
}

function pickAxisAndLayer(kind, { blockIndex, basisLocal, axisMap, dirSign }) {
  const { U_l, V_l, N_l } = basisLocal;
  const base =
    kind === "U_AXIS" ? U_l :
    kind === "V_AXIS" ? V_l :
    N_l; // "N_AXIS" default
  let axisLetter = dominantAxisLetter(base);
  axisLetter = axisMap[axisLetter] ?? axisLetter;

  const layerIndex = layerIndexForAxis(axisLetter, blockIndex);
  return { axisLetter, layerIndex, dirSign };
}
