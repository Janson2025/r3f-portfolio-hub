// Minimal tween engine for rotating Object3D.euler axes.
export const ease = {
  cubicInOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
};

const _tweens = [];

export function tweenRotation({ obj, axis, deltaRadians, durationMs = 250, onComplete }) {
  if (!obj || !axis) return false;
  // prevent overlapping tweens on the same (obj,axis)
  if (_tweens.some(t => t.obj === obj && t.axis === axis)) return false;

  const start = performance.now();
  const from = obj.rotation[axis];
  const to = from + deltaRadians;

  const tw = {
    obj, axis, from, to, durationMs, onComplete,
    update(now) {
      const t = Math.min(1, (now - start) / durationMs);
      const k = ease.cubicInOut(t);
      obj.rotation[axis] = from + (to - from) * k;
      if (t >= 1) { onComplete?.(); return false; }
      return true;
    }
  };
  _tweens.push(tw);
  return true;
}

export function updateTweens() {
  const now = performance.now();
  for (let i = _tweens.length - 1; i >= 0; i--) {
    if (!_tweens[i].update(now)) _tweens.splice(i, 1);
  }
}

export function activeTweens() {
  return _tweens.length;
}
