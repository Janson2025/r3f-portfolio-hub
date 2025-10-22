// src/app/project/grid/interactions/dragUtils.js
import * as THREE from "three";

/** ===== Math helpers ===== */
export function dominantAxisLetter(v) {
  const ax = Math.abs(v.x), ay = Math.abs(v.y), az = Math.abs(v.z);
  if (ax >= ay && ax >= az) return "x";
  if (ay >= ax && ay >= az) return "y";
  return "z";
}

// x -> i, y -> k, z -> j  (matches your GridCube index convention)
export function layerIndexForAxis(axisLetter, [i, j, k]) {
  if (axisLetter === "x") return i;
  if (axisLetter === "y") return k;
  return j; // z
}

export function unwrapAngle(theta, prev) {
  let t = theta;
  while (t - prev >  Math.PI) t -= Math.PI * 2;
  while (t - prev < -Math.PI) t += Math.PI * 2;
  return t;
}

export function normalizeAngle(a) {
  const two = Math.PI * 2;
  let t = ((a % two) + two) % two;
  if (t > Math.PI) t -= two;
  return t;
}

export function getAxisWorld(root, axisLetter) {
  const m = new THREE.Matrix4().extractRotation(root.matrixWorld);
  const v =
    axisLetter === "x" ? new THREE.Vector3(1, 0, 0)
  : axisLetter === "y" ? new THREE.Vector3(0, 1, 0)
                       : new THREE.Vector3(0, 0, 1);
  return v.applyMatrix4(m).normalize();
}

export function basisFromAxis(a) {
  const tmp = Math.abs(a.x) < 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
  const t1 = new THREE.Vector3().crossVectors(a, tmp).normalize();
  const t2 = new THREE.Vector3().crossVectors(a, t1).normalize();
  return { t1, t2 };
}

export function pointAngleAroundAxis(p, originW, t1, t2) {
  const v = new THREE.Vector3().subVectors(p, originW);
  const u = v.dot(t1), w = v.dot(t2);
  return Math.atan2(w, u);
}

/** ===== Selection / parenting helpers ===== */
export function resetGroup(root, grp) {
  for (let c = grp.children.length - 1; c >= 0; c--) root.attach(grp.children[c]);
  grp.rotation.set(0, 0, 0);
  grp.updateMatrixWorld(true);
}

export function attachLayerByIndex(root, grp, axisLetter, layerIndex) {
  const idx = axisLetter === "x" ? 0 : axisLetter === "y" ? 1 : 2;
  const children = root.children.slice().reverse();
  for (const child of children) {
    const ijk = child.userData?.ijk;
    if (!ijk) continue;
    if (ijk[idx] === layerIndex) grp.attach(child);
  }
  grp.updateMatrixWorld(true);
}

export function bakeBack(root, grp) {
  for (let c = grp.children.length - 1; c >= 0; c--) root.attach(grp.children[c]);
  grp.rotation.set(0, 0, 0);
  grp.updateMatrixWorld(true);
}

export function snapPositionsAndReindex(root, dims, spacing) {
  const [dx, dy, dz] = dims;
  const cx = (dx - 1) / 2, cy = (dy - 1) / 2, cz = (dz - 1) / 2;

  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const pos = new THREE.Vector3();
  const rot = new THREE.Quaternion();
  const scl = new THREE.Vector3();

  for (const child of root.children) {
    child.updateMatrixWorld(true);
    const m = new THREE.Matrix4().multiplyMatrices(inv, child.matrixWorld);
    m.decompose(pos, rot, scl);

    const ix = Math.round(pos.x / spacing + cx);
    const iy = Math.round(pos.y / spacing + cy);
    const iz = Math.round(pos.z / spacing + cz);

    const i = THREE.MathUtils.clamp(ix, 0, dx - 1);
    const j = THREE.MathUtils.clamp(iy, 0, dy - 1);
    const k = THREE.MathUtils.clamp(iz, 0, dz - 1);

    pos.set((i - cx) * spacing, (j - cy) * spacing, (k - cz) * spacing);
    child.position.copy(pos);
    child.quaternion.copy(rot);
    child.scale.copy(scl);
    child.updateMatrixWorld(true);

    child.userData.ijk = [i, j, k];
  }
}

/** ===== Ray helpers ===== */
export function intersectDOMWithPlane(ev, camera, gl, plane) {
  const ray = makeRayFromDOM(ev, camera, gl);
  const hit = new THREE.Vector3();
  return ray?.intersectPlane(plane, hit) ? hit : null;
}

// project arbitrary world point onto plane (n, p0)
export function intersectPointWithPlane(pWorld, planeNormal, planePoint) {
  const v = new THREE.Vector3().subVectors(pWorld, planePoint);
  const n = planeNormal.clone().normalize();
  const dist = v.dot(n);
  return pWorld.clone().sub(n.multiplyScalar(dist));
}

export function makeRayFromDOM(ev, camera, gl) {
  if (!ev) return null;
  const rect = gl.domElement.getBoundingClientRect();
  const x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
  const y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera({ x, y }, camera);
  return raycaster.ray.clone();
}
