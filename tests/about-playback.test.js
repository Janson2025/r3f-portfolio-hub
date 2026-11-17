import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { AnimationClip, VectorKeyframeTrack, QuaternionKeyframeTrack } from 'three';
import { createTextTimeline, timelineFrame, getMouthCueDurationMs } from '../src/features/about/textTimeline.js';
import { applyMouthFrame, mouthFrame, mouthTargets } from '../src/features/about/mouthShapes.js';
import { retargetIdleClip } from '../src/features/about/retargetIdle.js';

test('typewriter and mouth shapes use the same nonoverlapping text timeline',()=>{
  const timeline=createTextTimeline('Ae, i.');
  assert.equal(getMouthCueDurationMs(timeline.mouthCues),timeline.durationMs);
  assert.equal(timelineFrame(timeline,0).mouthShape,'aa');
  assert.equal(timelineFrame(timeline,0).visibleCharacters,1);
  const e=timeline.mouthCues.find(cue=>cue.mouthShape==='ee');
  assert.equal(timelineFrame(timeline,e.start*1000+.001).visibleCharacters,2);
  assert.equal(timelineFrame(timeline,e.start*1000+.001).mouthShape,'ee');
  for(let i=1;i<timeline.mouthCues.length;i++) assert.ok(timeline.mouthCues[i].start>=timeline.mouthCues[i-1].end);
  assert.equal(timelineFrame(timeline,timeline.durationMs).complete,true);
  assert.equal(timelineFrame(timeline,timeline.durationMs).mouthShape,null);
});
test('revealed text preserves Unicode characters and completes the full biography',()=>{
  const text='Hi 🙂.';const timeline=createTextTimeline(text);
  assert.equal(timelineFrame(timeline,timeline.durationMs).visibleCharacters,text.length);
  assert.equal(getMouthCueDurationMs([]),0);
  assert.equal(timelineFrame(createTextTimeline(''),0).mouthShape,null);
});
test('paused/completed playback closes the mouth and target weights are smoothed safely',()=>{
  const timeline=createTextTimeline('a');
  assert.equal(mouthFrame(timeline,{playing:false,elapsedMs:0}).mouthShape,null);
  const mesh={morphTargetDictionary:{viseme_aa:0,viseme_E:1},morphTargetInfluences:[0,0]};
  applyMouthFrame([mesh],'aa',.85,1);
  assert.ok(mesh.morphTargetInfluences[0]>.84);assert.equal(mesh.morphTargetInfluences[1],0);
  applyMouthFrame([mesh],null,0,1);assert.ok(mesh.morphTargetInfluences[0]<1e-8);
});
test('the existing avatar has all mouth targets used by playback',()=>{
  const data=readFileSync(new URL('../public/models/Avatar1.glb',import.meta.url));
  const length=data.readUInt32LE(12);
  const gltf=JSON.parse(data.subarray(20,20+length).toString());
  const names=new Set(gltf.meshes.flatMap(mesh=>mesh.extras?.targetNames??[]));
  for(const target of Object.values(mouthTargets)) assert.ok(names.has(target),target);
});
test('idle retargeting corrects the source root axes without mutating the original clip',()=>{
  const source=new AnimationClip('idle',1,[new VectorKeyframeTrack('Hips.position',[0],[0,0,1]),new QuaternionKeyframeTrack('Hips.quaternion',[0],[Math.SQRT1_2,0,0,Math.SQRT1_2]),new QuaternionKeyframeTrack('Armature.quaternion',[0],[-Math.SQRT1_2,0,0,Math.SQRT1_2])]);
  const result=retargetIdleClip(source);
  assert.equal(result.tracks.length,2);
  assert.ok(Math.abs(result.tracks[0].values[1]-1)<1e-6);
  assert.ok(Math.abs(result.tracks[1].values[0])<1e-6);
  assert.deepEqual([...source.tracks[0].values],[0,0,1]);
});
