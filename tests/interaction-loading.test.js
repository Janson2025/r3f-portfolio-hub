import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {initialLoaderCube,loaderMoves,applyLoaderMove,loaderFrame} from '../src/lib/loadingCube.js';
import {recenterLoopScroll,nearestReadingCard} from '../src/features/projects/loopScroll.js';
import {skillExamples,resolveSkillExample} from '../src/features/about/skillExamples.js';
import {chooseRibbonModels,ribbonModels,ribbonPosition} from '../src/features/home/modelRibbon.js';
import {swimOffset} from '../src/features/products/swim.js';
import {shouldEnterIdle,portalShouldPlay,IDLE_AFTER_MS} from '../src/features/projects/interactionPolicy.js';
import {supportsWebGL} from '../src/lib/webgl.js';
import {products,services} from '../src/data/offerings.js';

test('mini cube preset scrambles and exactly solves all eight cubies and face orientations',()=>{
 const start=initialLoaderCube();let cube=start;
 for(const move of loaderMoves.slice(0,4))cube=applyLoaderMove(cube,move);
 assert.notDeepEqual(cube,start);
 for(const move of loaderMoves.slice(4))cube=applyLoaderMove(cube,move);
 assert.deepEqual(cube,start);
 assert.equal(new Set(cube.map(c=>c.position.join(','))).size,8);
 assert.equal(loaderFrame(5.8).move,null);assert.ok(loaderFrame(5.8).spin>170&&loaderFrame(5.8).spin<190);
 assert.deepEqual(loaderFrame(7.5).cubies,start);assert.equal(loaderFrame(8.2).move[0],'x');
});
test('loop recentering preserves content phase in both directions with bounded copies',()=>{
 for(const middle of [1,3])for(const scroll of [0,50,750,1250,1750,3000,5000]){
  const result=recenterLoopScroll(scroll,1000,middle);
  assert.ok(result>=(middle-.5)*1000&&result<=(middle+.5)*1000);
  assert.equal(((result-scroll)%1000+1000)%1000,0);
 }
 assert.equal(recenterLoopScroll(50,0),50);
 assert.equal(nearestReadingCard([{id:'a',top:-100,height:150},{id:'b',top:80,height:200}],500),'b');
});
test('visible skills resolve to factual project routes or this portfolio and Astro is absent',()=>{
 const projects=JSON.parse(readFileSync(new URL('../src/data/projects.json',import.meta.url)));
 const labels=Object.values(skillExamples).flat().map(x=>x.label);
 for(const excluded of ['Astro','Figma','Notion','Zod','Supabase','Express','TypeScript'])assert.ok(!labels.includes(excluded));
 for(const skill of Object.values(skillExamples).flat()){
  const example=resolveSkillExample(skill,projects,'/images/closeup-profile.png');
  assert.ok(example?.href.startsWith('#/'));assert.ok(example.title&&example.summary);
  if(example.image)assert.ok(existsSync(new URL(`../public${example.image}`,import.meta.url)));
 }
});
test('idle and preview rules distinguish cube hover, continuous focus and overlay state',()=>{
 assert.equal(shouldEnterIdle(IDLE_AFTER_MS+1,false,false),true);
 assert.equal(shouldEnterIdle(IDLE_AFTER_MS-1,false,false),false);
 assert.equal(shouldEnterIdle(90000,true,false),false);assert.equal(shouldEnterIdle(90000,false,true),false);
 assert.equal(portalShouldPlay({mode:'cube',hovered:true}),true);
 assert.equal(portalShouldPlay({mode:'project',selected:true,activationEnabled:true,hovered:false}),true);
 assert.equal(portalShouldPlay({mode:'project',selected:false,activationEnabled:true,hovered:true}),false);
 assert.equal(portalShouldPlay({mode:'cube',hovered:true,previewsEnabled:false}),false);
});
test('fish swim changes the tail while keeping the nose stable and ribbon selection is bounded',()=>{
 assert.equal(swimOffset(-2,-2,2,1),0);
 assert.notEqual(swimOffset(2,-2,2,1),swimOffset(2,-2,2,1.2));
 const selection=chooseRibbonModels(ribbonModels,()=>.3,4);assert.equal(selection.length,4);assert.equal(new Set(selection.map(m=>m.id)).size,4);
 for(const model of selection)assert.ok(existsSync(new URL(`../public${model.url}`,import.meta.url)));
 const a=ribbonPosition(.25,20,0),b=ribbonPosition(1.25,20,0);assert.deepEqual(a,b);
});
test('successful WebGL capability probes are cached without leaking repeated test contexts',()=>{
 let calls=0,releases=0;const doc={createElement:()=>{calls++;return{getContext:()=>({getExtension:()=>({loseContext(){releases++;}})})};}};
 assert.equal(supportsWebGL(doc),true);assert.equal(supportsWebGL(doc),true);assert.equal(calls,1);assert.equal(releases,1);
});
test('product references use the relocated media and the supplied swimming clip',()=>{
 const product=products[0];assert.equal(product.model,'/products-and-services/moore_idol/Moore_Idol.glb');
 const buffer=readFileSync(new URL(`../public${product.model}`,import.meta.url));
 const gltf=JSON.parse(buffer.subarray(20,20+buffer.readUInt32LE(12)).toString());
 assert.ok(gltf.animations.some(clip=>clip.name==='slow swim.007'&&clip.channels.length));
 assert.ok(product.image.startsWith('/products-and-services/'));assert.ok(product.gif.startsWith('/products-and-services/'));
 for(const service of services)assert.ok(service.image.startsWith('/products-and-services/'));
});
