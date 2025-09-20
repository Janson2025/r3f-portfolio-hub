// src/shared/math.js
import * as THREE from "three";

/** Snap an angle (radians) to the nearest 90° step */
export function snapToQuarterTurns(rad) {
  const q = Math.PI / 2;
  return Math.round(rad / q) * q;
}

/** Small clamp helper (kept local to avoid importing THREE just for clamp) */
export function clamp01(x) {
  return Math.min(1, Math.max(0, x));
}

/** Unit vectors for global axes */
export function axisUnit(axisKey) {
  if (axisKey === "x") return new THREE.Vector3(1, 0, 0);
  if (axisKey === "y") return new THREE.Vector3(0, 1, 0);
  return new THREE.Vector3(0, 0, 1); // 'z'
}

/**
 * Given a face normal (world or local) return the two tangent candidates
 * as axis keys + unit vectors that lie in the face's plane.
 * Assumes face normals are axis-aligned (|x|>|y|>|z| max picks dominant).
 */
export function tangentCandidatesFromFaceNormal(n) {
  const ax = Math.abs(n.x), ay = Math.abs(n.y), az = Math.abs(n.z);
  if (ax >= ay && ax >= az) {
    // Face is +/-X -> tangents are Y and Z
    return [{ key: "y", v: new THREE.Vector3(0, 1, 0) },
            { key: "z", v: new THREE.Vector3(0, 0, 1) }];
  } else if (ay >= ax && ay >= az) {
    // Face is +/-Y -> tangents are X and Z
    return [{ key: "x", v: new THREE.Vector3(1, 0, 0) },
            { key: "z", v: new THREE.Vector3(0, 0, 1) }];
  } else {
    // Face is +/-Z -> tangents are X and Y
    return [{ key: "x", v: new THREE.Vector3(1, 0, 0) },
            { key: "y", v: new THREE.Vector3(0, 1, 0) }];
  }
}

/** Convenience: face name → local normal (assuming cube local axes) */
export function localNormalFromFaceName(face) {
  switch (face) {
    case "front":  return new THREE.Vector3(0, 0, 1);
    case "back":   return new THREE.Vector3(0, 0,-1);
    case "right":  return new THREE.Vector3(1, 0, 0);
    case "left":   return new THREE.Vector3(-1,0, 0);
    case "top":    return new THREE.Vector3(0, 1, 0);
    case "bottom": return new THREE.Vector3(0,-1, 0);
    default:       return new THREE.Vector3(0, 0, 1);
  }
}

/** Rotate (i,j) in an A×B grid by +90° about +Z: (i,j)->(B-1-j, i) */
export function rot2D_AB_90(i, j, A, B) {
  return [B - 1 - j, i];
}

/** General plane permutations used later (documented for tests & clarity) */
export function permuteIJ_Z(i, j, A, B, steps) {
  // +Z quarter-turns rotate (i,j) in A×B
  let ni = i, nj = j;
  const n = ((steps % 4) + 4) % 4;
  for (let t = 0; t < n; t++) {
    [ni, nj] = rot2D_AB_90(ni, nj, A, B);
  }
  return [ni, nj];
}

export function permuteJK_X(j, k, B, C, steps) {
  // +X quarter-turns rotate (j,k) in B×C
  let nj = j, nk = k;
  const n = ((steps % 4) + 4) % 4;
  for (let t = 0; t < n; t++) {
    // (j,k) -> (C-1-k, j)
    const _j = nj, _k = nk;
    nj = (C - 1) - _k;
    nk = _j;
  }
  return [nj, nk];
}

export function permuteIK_Y(i, k, A, C, steps) {
  // +Y quarter-turns rotate (i,k) in A×C: (i,k)->(k, A-1-i)
  let ni = i, nk = k;
  const n = ((steps % 4) + 4) % 4;
  for (let t = 0; t < n; t++) {
    const _i = ni, _k = nk;
    ni = _k;
    nk = (A - 1) - _i;
  }
  return [ni, nk];
}
