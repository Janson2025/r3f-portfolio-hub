import { Quaternion, Vector3 } from 'three';

/** Source FBX uses a -90° X armature conversion; GLB has that transform baked in. */
export function retargetIdleClip(source) {
  const clip = source.clone();
  const correction = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -Math.PI / 2);
  clip.tracks = clip.tracks.filter(track => !track.name.startsWith('Armature.'));
  for (const track of clip.tracks) {
    if (track.name === 'Hips.position') {
      for (let i = 0; i < track.values.length; i += 3) new Vector3().fromArray(track.values, i).applyQuaternion(correction).toArray(track.values, i);
    } else if (track.name === 'Hips.quaternion') {
      for (let i = 0; i < track.values.length; i += 4) new Quaternion().fromArray(track.values, i).premultiply(correction).toArray(track.values, i);
    }
  }
  clip.name = 'about-idle';
  return clip;
}
