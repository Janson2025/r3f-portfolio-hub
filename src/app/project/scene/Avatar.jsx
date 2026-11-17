import { useEffect,useMemo,useRef } from 'react';
import { useFrame,useLoader } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { AnimationMixer,Euler,LoopOnce,LoopRepeat,Quaternion,Vector3 } from 'three';
import { cloneWithShadows } from './avatarUtils.js';
import { gestureClip,waveClip,neutralClip,gestureAt,idleGestureAt,gazeOffset,interactionClip,interactionAction,AVATAR_IDLE_DANCE_SECONDS } from '../../../features/about/avatarAnimation.js';
import { applyMouthFrame,findMouthMeshes,mouthFrame } from '../../../features/about/mouthShapes.js';
const urls=['/animations/Gestures-Pack-Basic/acknowledging.fbx','/animations/Gestures-Pack-Basic/happy-hand-gesture.fbx','/animations/Gestures-Pack-Basic/head-nod-yes.fbx','/animations/other/Waving.fbx','/animations/other/Ducking.fbx','/animations/other/Nervously Look Around.fbx','/animations/dance/Hip-Hop-Dancing.fbx'];
export function Avatar({timeline,playback,interaction,reducedMotion=false,onReady,onPoke,...props}){
 const {scene}=useGLTF('/models/Avatar1.glb');const [ack,happy,nod,wave,duck,nervous,dance]=useLoader(FBXLoader,urls);
 const clone=useMemo(()=>cloneWithShadows(scene),[scene]);const meshes=useMemo(()=>findMouthMeshes(clone),[clone]);
 const clips=useMemo(()=>{const base=gestureClip(ack.animations[0],'acknowledge');return[neutralClip(base),base,gestureClip(happy.animations[0],'happy'),gestureClip(nod.animations[0],'nod'),waveClip(wave,clone),interactionClip(duck,clone,'duck'),interactionClip(nervous,clone,'nervous'),interactionClip(dance,clone,'dance')];},[ack,happy,nod,wave,duck,nervous,dance,clone]);
 const mixer=useMemo(()=>new AnimationMixer(clone),[clone]),actions=useRef({});
 const eyes=useMemo(()=>['LeftEye','RightEye'].map(n=>clone.getObjectByName(n)).filter(Boolean),[clone]),head=useMemo(()=>clone.getObjectByName('Head'),[clone]),headRest=useMemo(()=>head?.quaternion.clone(),[head]);
 const root=useRef(null),current=useRef(null),frames=useRef(0),behavior=useRef({pokeId:0,pokeStart:null,danceStart:null,lastActive:0,key:null});
 const scratch=useMemo(()=>({position:new Vector3(),local:new Vector3(),gaze:new Vector3(),rotation:new Quaternion(),head:new Quaternion(),euler:new Euler()}),[]);
 useEffect(()=>{actions.current=Object.fromEntries(clips.map(clip=>[clip.name,mixer.clipAction(clip)]));current.current=null;return()=>{mixer.stopAllAction();mixer.uncacheRoot(clone);actions.current={};applyMouthFrame(meshes,null,0,1);};},[mixer,clips,clone,meshes]);
 useFrame(({clock,camera},raw)=>{
  const delta=Math.min(raw,.05),now=clock.elapsedTime,state=playback.current,pointer=interaction.current,b=behavior.current;
  if(frames.current<3){frames.current++;if(frames.current===3)onReady?.();}
  if(b.key!==state.key){b.key=state.key;b.lastActive=now;b.danceStart=null;b.pokeStart=null;}
  if(pointer.pokeId!==b.pokeId){b.pokeId=pointer.pokeId;b.pokeStart=now;b.danceStart=null;b.lastActive=now;}
  const speaking=state.playing&&state.elapsedMs<(timeline?.durationMs??0);
  if(speaking||pointer.inside){b.lastActive=now;b.danceStart=null;}
  if(!speaking&&!pointer.inside&&!reducedMotion&&b.pokeStart===null&&b.danceStart===null&&now-b.lastActive>AVATAR_IDLE_DANCE_SECONDS)b.danceStart=now;
  const durations=Object.fromEntries(clips.map(clip=>[clip.name,clip.duration]));
  let special=interactionAction({now,pokeStart:b.pokeStart,duckDuration:durations.duck,nervousDuration:durations.nervous,danceStart:b.danceStart,danceDuration:durations.dance});
  if(!special&&(b.pokeStart!==null||b.danceStart!==null)){b.pokeStart=null;b.danceStart=null;b.lastActive=now;}
  const desired=reducedMotion?'neutral':special||(speaking?gestureAt(state,timeline.durationMs):idleGestureAt(now));
  pointer.action=desired;
  const token=`${desired}:${special&&b.pokeStart!==null?b.pokeId:''}`;
  if(current.current!==token){const old=actions.current[current.current?.split(':')[0]],next=actions.current[desired];if(next){next.reset().setEffectiveWeight(1).setLoop(['greeting','duck','nervous','dance'].includes(desired)?LoopOnce:LoopRepeat,['greeting','duck','nervous','dance'].includes(desired)?1:Infinity).play();next.clampWhenFinished=true;if(old&&old!==next)next.crossFadeFrom(old,.25,false);}current.current=token;}
  if(!reducedMotion)mixer.update(delta);
  root.current.rotation.y+=( (pointer.inside?pointer.x*.32:0)-root.current.rotation.y)*(1-Math.exp(-7*delta));
  if(head&&headRest){scratch.euler.set(pointer.inside?-pointer.y*.1:0,pointer.inside?pointer.x*.22:0,0);scratch.head.copy(special?head.quaternion:headRest).multiply(scratch.rotation.setFromEuler(scratch.euler));if(!special||pointer.inside)head.quaternion.slerp(scratch.head,1-Math.exp(-9*delta));}
  const cue=!special&&timeline&&!reducedMotion?mouthFrame(timeline,state):{mouthShape:null,weight:0};applyMouthFrame(meshes,cue.mouthShape,cue.weight,delta);
  const glance=reducedMotion?{x:0,y:0}:gazeOffset(now);scratch.gaze.copy(camera.position);if(desired==='nervous'&&!pointer.inside)scratch.gaze.x+=Math.sin(now*2.4)*1.2;if(pointer.inside){scratch.gaze.x+=pointer.x*.8;scratch.gaze.y+=pointer.y*.5;}
  for(const eye of eyes){eye.parent.updateWorldMatrix(true,false);eye.getWorldPosition(scratch.position);scratch.local.copy(scratch.gaze).sub(scratch.position).normalize().applyQuaternion(eye.parent.getWorldQuaternion(scratch.rotation).invert());scratch.euler.set(Math.max(-.16,Math.min(.16,-Math.atan2(scratch.local.y,scratch.local.z)))+glance.x,Math.max(-.18,Math.min(.18,Math.atan2(scratch.local.x,scratch.local.z)))+glance.y,0);scratch.rotation.setFromEuler(scratch.euler);eye.quaternion.slerp(scratch.rotation,1-Math.exp(-12*delta));}
  const blink=reducedMotion?0:Math.max(0,1-Math.abs(now%4.3-4.15)/.1);for(const mesh of meshes)for(const [name,value]of[['mouthSmile',.16],['eyesClosed',blink]]){const i=mesh.morphTargetDictionary[name];if(i!==undefined)mesh.morphTargetInfluences[i]=value;}
 });
 return <group ref={root} {...props} dispose={null} onClick={event=>{event.stopPropagation();onPoke?.();}}><primitive object={clone}/></group>;
}
