import test from 'node:test';
import assert from 'node:assert/strict';
import { supportsWebGL } from '../src/lib/webgl.js';
test('3D capability detection safely handles unavailable or blocked WebGL',()=>{
  assert.equal(supportsWebGL({createElement:()=>({getContext:()=>null})}),false);
  assert.equal(supportsWebGL({createElement(){throw new Error('Unavailable');}}),false);
  let released=false;
  assert.equal(supportsWebGL({createElement:()=>({getContext:()=>({getExtension:()=>({loseContext(){released=true;}})})})}),true);
  assert.equal(released,true);
});
