import test from 'node:test';
import assert from 'node:assert/strict';
import { Quaternion,Vector3,Euler } from 'three';
import { orientationQuaternion } from '../src/features/home/ribbonOrientation.js';
import { helixTangent,ribbonTransform,ribbonSpeed } from '../src/features/home/modelRibbon.js';
test('any configured forward axis aligns to either strand travel tangent',()=>{
 for(const axis of [[1,0,0],[0,0,1]])for(const strand of [0,1]){
  const transform=ribbonTransform({orientation:'path',forwardAxis:axis,rotation:[0,0,0]}),tangent=helixTangent(3,20,4,strand),q=orientationQuaternion(transform,new Quaternion(),tangent);
  assert.ok(new Vector3(...axis).applyQuaternion(q).distanceTo(new Vector3(...tangent).normalize())<1e-8);assert.equal(Math.sign(tangent[0]),strand===0?1:-1);
 }
});
test('camera mode follows camera orientation with independent asset rotation offsets',()=>{
 const camera=new Quaternion().setFromEuler(new Euler(.1,.3,.2)),transform=ribbonTransform({orientation:'camera',rotation:[0,-90,0]}),q=orientationQuaternion(transform,camera,[1,0,0]);assert.ok(q.angleTo(camera)<1e-7);
 const local=new Quaternion().setFromEuler(new Euler(...transform.rotation));assert.ok(new Vector3(1,0,0).applyQuaternion(local).distanceTo(new Vector3(0,0,1))<1e-8);
 assert.equal(ribbonTransform({orientation:'unknown'}).orientation,'fixed');assert.ok(orientationQuaternion(ribbonTransform({}),camera,[1,0,0]).equals(new Quaternion()));
});
test('hover transitions now take longer through slowdown and recovery',()=>{
 let down=1;for(let i=0;i<30;i++)down=ribbonSpeed(down,true,1/60);assert.ok(down>.05&&down<.12);
 let up=0;for(let i=0;i<30;i++)up=ribbonSpeed(up,false,1/60);assert.ok(up>.6&&up<.8);
});
