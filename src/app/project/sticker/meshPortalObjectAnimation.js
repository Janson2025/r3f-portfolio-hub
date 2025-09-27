// src/sticker/meshPortalObjectAnimation.js

import * as THREE from "three";

/**
 * makeAnimator({ type, params }) -> (object3D, dt, playing) => void
 *
 * Supported types:
 *  - "idle": gentle vertical bob only (params: { bobAmp=0.03, bobHz=0.6 })
 *  - "spin": continuous rotation (params: { speed=0.6, axis=[0,1,0] })
 *
 * Notes:
 *  - The returned function is cheap and early-returns when !playing or !object3D.
 *  - We stash a tiny per-instance clock on object3D.userData.__mpoa_t to avoid GC.
 */
export function makeAnimator({ type = "idle", params = {} } = {}) {
  if (type === "spin") {
    const speed = Number.isFinite(params.speed) ? params.speed : 0.6;
    const axis = Array.isArray(params.axis) ? params.axis : [0, 1, 0];
    const ax = new THREE.Vector3(axis[0] || 0, axis[1] || 1, axis[2] || 0);

    return (obj, dt, playing) => {
      if (!playing || !obj) return;
      // Rotate in local space
      obj.rotation.x += ax.x * speed * dt;
      obj.rotation.y += ax.y * speed * dt;
      obj.rotation.z += ax.z * speed * dt;
    };
  }

  // Default: "idle" — vertical bob only
  const bobAmp = Number.isFinite(params.bobAmp) ? params.bobAmp : 0.03; // units
  const bobHz = Number.isFinite(params.bobHz) ? params.bobHz : 0.6;     // cycles/sec
  // NOTE: params.yaw (if provided) is intentionally ignored for idle.

  return (obj, dt, playing) => {
    if (!obj) return;

    // keep an internal time even when not playing so the phase doesn’t jump on re-hover
    const ud = (obj.userData ||= {});
    ud.__mpoa_t = (ud.__mpoa_t || 0) + dt;

    if (!playing) return;

    // gentle bob on Y only
    const phase = 2 * Math.PI * bobHz * ud.__mpoa_t;
    const baseY = ud.__mpoa_baseY ?? (ud.__mpoa_baseY = obj.position.y);
    obj.position.y = baseY + Math.sin(phase) * bobAmp;
  };
}
