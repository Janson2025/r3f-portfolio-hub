import { AnimationClip, Quaternion, QuaternionKeyframeTrack, VectorKeyframeTrack, Vector3 } from 'three';
import { retargetIdleClip } from './retargetIdle.js';

export function gestureClip(source, name) {
  const result = retargetIdleClip(source);
  result.name = name;
  result.tracks = result.tracks.filter(track => track.name.endsWith('.quaternion') && !/Eye|Head|Neck/i.test(track.name));
  return result;
}
/** Retarget Mixamo joint orientation to the GLB rest skeleton without root motion. */
export function waveClip(source, target, keepHead = false) {
  source.updateMatrixWorld(true); target.updateMatrixWorld(true);
  const tracks = [];
  for (const track of source.animations[0]?.tracks ?? []) {
    if (!track.name.endsWith('.quaternion')) continue;
    const sourceName = track.name.split('.')[0], name = sourceName.replace(/^mixamorig:?/, '');
    if (/Eye/i.test(name) || (!keepHead && /Head|Neck/i.test(name))) continue;
    const from = source.getObjectByName(sourceName), to = target.getObjectByName(name);
    if (!from || !to) continue;
    const before = to.parent.getWorldQuaternion(new Quaternion()).invert().multiply(from.parent.getWorldQuaternion(new Quaternion()));
    const after = from.getWorldQuaternion(new Quaternion()).invert().multiply(to.getWorldQuaternion(new Quaternion()));
    const copy = track.clone(); copy.name = `${name}.quaternion`;
    const value = new Quaternion();
    for (let i = 0; i < copy.values.length; i += 4) value.fromArray(copy.values, i).premultiply(before).multiply(after).normalize().toArray(copy.values, i);
    tracks.push(copy);
  }
  return new AnimationClip('greeting', source.animations[0]?.duration ?? 1, tracks);
}
export function neutralClip(gesture) {
  const times = [0, 1.5, 3, 4.5, 6];
  return new AnimationClip('neutral', 6, gesture.tracks.map(track => {
    const base = new Quaternion().fromArray(track.values), values = [];
    const axis = new Vector3(1, 0, 0);
    for (const time of times) {
      const breath = /Spine[12]?\.quaternion/.test(track.name) ? Math.sin(time / 6 * Math.PI * 2) * 0.012 : 0;
      base.clone().multiply(new Quaternion().setFromAxisAngle(axis, breath)).toArray(values, values.length);
    }
    return new QuaternionKeyframeTrack(track.name, times, values);
  }));
}
export function idleGestureAt(time) { const cycle = time % 19; return cycle >= 15 && cycle < 17 ? 'acknowledge' : 'neutral'; }
export function gestureAt(playback, durationMs) {
  if (!playback.playing) return 'neutral';
  if (playback.elapsedMs < -4700) return 'neutral';
  if (playback.elapsedMs < -300) return 'greeting';
  if (playback.elapsedMs < 0 || playback.elapsedMs >= durationMs) return 'neutral';
  return ['acknowledge', 'neutral', 'happy', 'neutral', 'nod'][Math.floor(playback.elapsedMs / 3500) % 5];
}
export function gazeOffset(time, random = Math.random) {
  // Most of each cycle addresses the camera; small glances return smoothly.
  const cycle = time % 4.8;
  const envelope = cycle > 3.8 ? Math.sin((cycle - 3.8) * Math.PI) : 0;
  return { x: Math.sin(time * 1.7) * 0.02 * envelope, y: Math.sin(time * 0.9) * 0.045 * envelope };
}
export function interactionClip(source,target,name){
 const mixamo=source.animations[0]?.tracks.some(t=>t.name.startsWith('mixamorig'));
 const clip=mixamo?waveClip(source,target,true):retargetIdleClip(source.animations[0]);clip.name=name;clip.tracks=clip.tracks.filter(track=>track.name.endsWith('.quaternion')&&!/Eye/i.test(track.name));
 const sourceHips=source.getObjectByName(mixamo?'mixamorigHips':'Hips'),targetHips=target.getObjectByName('Hips');
 const track=source.animations[0]?.tracks.find(t=>t.name===(mixamo?'mixamorigHips.position':'Hips.position'));
 if(track&&sourceHips&&targetHips){
  source.updateMatrixWorld(true);target.updateMatrixWorld(true);
  const rotation=sourceHips.parent.getWorldQuaternion(new Quaternion()),worldHeight=Math.abs(sourceHips.getWorldPosition(new Vector3()).y),scale=targetHips.getWorldPosition(new Vector3()).y/Math.max(.001,worldHeight);
  const first=new Vector3().fromArray(track.values).applyQuaternion(rotation),values=[];
  for(let i=0;i<track.values.length;i+=3){const point=new Vector3().fromArray(track.values,i).applyQuaternion(rotation).sub(first);values.push(targetHips.position.x,targetHips.position.y+Math.max(-.65,Math.min(.18,point.y*scale)),targetHips.position.z);}
  clip.tracks.push(new VectorKeyframeTrack('Hips.position',track.times,values));
 }
 return clip;
}
export const AVATAR_IDLE_DANCE_SECONDS=22;
export function interactionAction({now,pokeStart,duckDuration,nervousDuration,danceStart,danceDuration}){
 if(pokeStart!==null){const t=now-pokeStart;if(t<duckDuration)return'duck';if(t<duckDuration+nervousDuration)return'nervous';}
 if(danceStart!==null&&now-danceStart<danceDuration)return'dance';
 return null;
}
