import test from 'node:test';
import assert from 'node:assert/strict';
import { Group,Mesh,MeshStandardMaterial,BoxGeometry,AnimationClip,QuaternionKeyframeTrack,VectorKeyframeTrack,Bone } from 'three';
import { ownInspectorMaterials,applyInspectorMode } from '../src/features/products/inspector.js';
import { restoreCubeMoves,safeQuaternion } from '../src/lib/placeMemory.js';
import { interactionAction,interactionClip } from '../src/features/about/avatarAnimation.js';
import { audioEnabled,playSound,disposeAudio } from '../src/lib/audio.js';
import { createCubeEngine } from '../src/app/project/grid/engine/cubeEngine.js';

test('wireframe owns material copies, restores render colors and leaves cached source untouched',()=>{
 const source=new MeshStandardMaterial({color:'#e8c218'}),root=new Group(),geometry=new BoxGeometry();
 root.add(new Mesh(geometry,source),new Mesh(geometry,[source,source]));
 const owned=ownInspectorMaterials(root);assert.equal(owned.materials.length,1);assert.notEqual(root.children[0].material,source);
 applyInspectorMode(owned,'wireframe');assert.equal(root.children[0].material.wireframe,true);assert.equal(source.wireframe,false);assert.equal(source.color.getHexString(),'e8c218');
 applyInspectorMode(owned,'render');assert.equal(root.children[0].material.wireframe,false);assert.equal(root.children[0].material.color.getHexString(),'e8c218');
 let disposed=0;owned.materials[0].addEventListener('dispose',()=>disposed++);owned.dispose();assert.equal(disposed,1);geometry.dispose();source.dispose();
});
test('restored cube moves recover the state and stop safely at malformed data',()=>{
 const a=createCubeEngine(2),b=createCubeEngine(2),moves=[{axis:'x',layer:0,quarterTurns:1},{axis:'y',layer:1,quarterTurns:-1}];
 for(const move of moves)a.move(move);restoreCubeMoves(b,[...moves,{axis:'bad'},moves[0]]);assert.deepEqual(b.getState(),a.getState());
 assert.equal(restoreCubeMoves(b,null),b);
});
test('saved camera quaternion rejects corrupt values and normalizes valid rotations',()=>{
 const fallback=[0,0,0,1];for(const value of [null,{},[0,0,0,0],[NaN,0,0,1],[1,2]])assert.equal(safeQuaternion(value,fallback),fallback);
 assert.deepEqual(safeQuaternion([0,0,0,2],fallback),fallback);
});
test('poke takes precedence over dance, runs duck then nervous, then yields to idle',()=>{
 const state={pokeStart:10,duckDuration:1.5,nervousDuration:4,danceStart:9,danceDuration:3};
 assert.equal(interactionAction({...state,now:10}),'duck');assert.equal(interactionAction({...state,now:12}),'nervous');assert.equal(interactionAction({...state,now:16}),null);
 assert.equal(interactionAction({...state,pokeStart:null,now:10}),'dance');
});
test('interaction retarget preserves head gesture and clamps vertical motion without root drift',()=>{
 const source=new Group(),hips=new Bone(),head=new Bone();hips.name='Hips';head.name='Head';source.add(hips);hips.add(head);hips.position.y=1;
 const target=source.clone();source.animations=[new AnimationClip('duck',1,[new VectorKeyframeTrack('Hips.position',[0,1],[0,1,0,8,-10,9]),new QuaternionKeyframeTrack('Head.quaternion',[0,1],[0,0,0,1,0,.2,0,.98])])];
 const clip=interactionClip(source,target,'duck'),position=clip.tracks.find(t=>t.name==='Hips.position');assert.ok(clip.tracks.some(t=>t.name==='Head.quaternion'));
 assert.equal(position.values[3],0);assert.equal(position.values[5],0);assert.ok(position.values[4]>=.35-1e-6);assert.deepEqual(Array.from(source.animations[0].tracks[0].values),[0,1,0,8,-10,9]);
});
test('audio begins muted and interaction effects do not create a context while muted',()=>{
 assert.equal(audioEnabled(),false);assert.doesNotThrow(()=>{playSound('poke');playSound('slide');disposeAudio();});assert.equal(audioEnabled(),false);
});
