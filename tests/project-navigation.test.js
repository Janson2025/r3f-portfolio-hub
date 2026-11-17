import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { getDirectionalProjectNavigation } from '../src/app/project/scene/cube/projectNavigation.js';
import { focusedPose, projectedStickerFrame, zoomToFov } from '../src/app/project/scene/cube/projectFocus.js';

function surface() {
  const root = new THREE.Group(); root.userData.halfExtent = 1;
  const faces = { front: [[0,0,1],[0,1,0]], back: [[0,0,-1],[0,1,0]], left: [[-1,0,0],[0,1,0]], right: [[1,0,0],[0,1,0]], top: [[0,1,0],[0,0,-1]], bottom: [[0,-1,0],[0,0,1]] };
  for (const [face,[n,u]] of Object.entries(faces)) {
    const normal = new THREE.Vector3(...n), up = new THREE.Vector3(...u), right = new THREE.Vector3().crossVectors(up,normal);
    for(let row=0;row<2;row++) for(let col=0;col<2;col++) {
      const node = new THREE.Object3D(); node.name = `${face}:${row}:${col}`;
      node.position.copy(normal).addScaledVector(right,col-.5).addScaledVector(up,.5-row);
      node.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(right,up,normal));
      node.userData.projectSticker = { id:node.name,title:node.name,width:1,height:1 };
      root.add(node);
    }
  }
  root.updateWorldMatrix(true,true); return root;
}
function sticker(root,id) {
  const object = root.getObjectByName(id); root.updateWorldMatrix(true,true);
  const quaternion = object.getWorldQuaternion(new THREE.Quaternion());
  return { ...object.userData.projectSticker, position:object.getWorldPosition(new THREE.Vector3()),quaternion,
    right:new THREE.Vector3(1,0,0).applyQuaternion(quaternion),up:new THREE.Vector3(0,1,0).applyQuaternion(quaternion) };
}
test('four arrows follow physical rows and wrap across cube edges',()=>{
  const root=surface(), nav=getDirectionalProjectNavigation(root,'front:0:0');
  assert.equal(nav.right.id,'front:0:1'); assert.equal(nav.down.id,'front:1:0');
  assert.equal(nav.up.id,'top:1:0'); assert.equal(nav.left.id,'left:0:1');
});
test('navigation skips an empty lane slot without jumping diagonally',()=>{
  const root=surface();root.remove(root.getObjectByName('front:0:1'));
  assert.equal(getDirectionalProjectNavigation(root,'front:0:0').right.id,'right:0:0');
  assert.equal(getDirectionalProjectNavigation(root,'front:0:0',['front:0:0','front:1:0']).right,null);
});
test('whole-cube rotation and translation do not change physical adjacency',()=>{
  const root=surface();root.rotation.set(.4,-.7,.3);root.position.set(3,2,-4);
  const nav=getDirectionalProjectNavigation(root,'front:0:0');
  assert.equal(nav.right.id,'front:0:1');assert.equal(nav.up.id,'top:1:0');
});
test('default 0% camera zoom maps to an 18 degree field of view',()=>{
  assert.equal(zoomToFov(0),18);assert.equal(zoomToFov(100),75);assert.equal(zoomToFov(-20),18);
});
test('focus centers the actual selected portal with room for arrows in wide and narrow canvases',()=>{
  for(const viewport of [{width:650,height:700},{width:375,height:320},{width:800,height:300}]) {
    const root=surface();root.rotation.set(.4,-.7,.3);
    const pose=focusedPose(root,sticker(root,'left:0:1'),viewport);
    root.quaternion.copy(pose.quaternion);root.updateWorldMatrix(true,true);
    const focused=sticker(root,'left:0:1');
    assert.ok(focused.position.distanceTo(pose.target)<1e-6);
    const camera=new THREE.PerspectiveCamera(18,viewport.width/viewport.height,.01,100);
    camera.position.copy(pose.cameraPosition);camera.lookAt(pose.target);camera.updateMatrixWorld(true);
    const projected=focused.position.clone().project(camera);
    assert.ok(Math.abs(projected.x)<1e-6 && Math.abs(projected.y)<1e-6);
    const frame=projectedStickerFrame(focused,camera,viewport);
    assert.ok(frame.left>35 && frame.right<viewport.width-35);
    assert.ok(frame.top>35 && frame.bottom<viewport.height-35);
  }
});
