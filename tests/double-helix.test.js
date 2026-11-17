import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { chooseRibbonStrands,helixPosition,helixItemX,helixSpan,HELIX } from '../src/features/home/modelRibbon.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
test('session ribbon selections have disjoint models and all local assets exist',()=>{
 const strands=chooseRibbonStrands(undefined,()=>.37),items=strands.flat();assert.equal(strands[0].length,4);assert.equal(strands[1].length,4);assert.equal(new Set(items.map(i=>i.url)).size,8);
 for(const item of items)assert.ok(existsSync(new URL('../public'+item.url,import.meta.url)),item.url);
});
test('helix crossings alternate which ribbon is in front',()=>{
 const width=20,span=helixSpan(width);for(let i=0;i<4;i++){const x=i*span/(HELIX.cycles*2),a=helixPosition(x,width),b=helixPosition(x,width,0,1);near(a.y,b.y);assert.equal(a.z>b.z,i%2===0);}
});
test('both strands are mirrored and loops travel in opposite directions without a visible wrap',()=>{
 for(const width of [6,20]){const a=helixPosition(3,width,1),b=helixPosition(3,width,1,1);near(a.y,-b.y);near(a.z,-b.z);
  assert.ok(helixItemX(1,4,width,.01)>helixItemX(1,4,width,0));assert.ok(helixItemX(1,4,width,.01,1)<helixItemX(1,4,width,0,1));
  near(helixItemX(1,4,width,1/HELIX.itemSpeed),helixItemX(1,4,width,0));assert.ok(helixSpan(width)/2-width/2>=3.4);
 }
});
