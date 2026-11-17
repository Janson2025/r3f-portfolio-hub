import { timelineFrame } from './textTimeline.js';

export const mouthTargets = { aa: 'viseme_aa', ih: 'viseme_I', ou: 'viseme_U', ee: 'viseme_E', oh: 'viseme_O' };

export function findMouthMeshes(root) {
  const meshes = [];
  root.traverse(object => { if (object.morphTargetDictionary && object.morphTargetInfluences) meshes.push(object); });
  return meshes;
}
export function applyMouthFrame(meshes, shape, weight, delta = 1 / 60) {
  const blend = 1 - Math.exp(-24 * Math.max(0, delta));
  for (const mesh of meshes) {
    for (const [id, name] of Object.entries(mouthTargets)) {
      const index = mesh.morphTargetDictionary[name];
      if (index === undefined) continue;
      const target = shape === id ? weight : 0;
      mesh.morphTargetInfluences[index] += (target - mesh.morphTargetInfluences[index]) * blend;
    }
  }
}
export function mouthFrame(timeline, playback) {
  return playback.playing ? timelineFrame(timeline, playback.elapsedMs) : { mouthShape: null, weight: 0 };
}
