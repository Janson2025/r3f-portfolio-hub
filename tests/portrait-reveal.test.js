import test from 'node:test';
import assert from 'node:assert/strict';
import { containRect,dropFrame,RaindropField } from '../src/features/portrait/revealMath.js';
import { portraitRevealConfig as config } from '../src/features/portrait/portraitRevealConfig.js';
import { PortraitMaskController } from '../src/features/portrait/PortraitMaskController.js';
const random=()=>{let seed=1234;return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};};
test('both original sources fit the same photo-ratio frame without clipping or stretching',()=>{
 for(const width of [150,375,430]){
  const height=width*config.frame.height/config.frame.width;
  for(const [w,h] of [[1018,1544],[1122,1402]]){
   const r=containRect(w,h,width,height);assert.equal(r.sx,0);assert.equal(r.sy,0);assert.equal(r.sw,w);assert.equal(r.sh,h);
   assert.ok(Math.abs(r.dw/r.dh-w/h)<1e-8);assert.ok(r.dx>=-1e-8&&r.dy>=-1e-8&&r.dx+r.dw<=width+1e-8&&r.dy+r.dh<=height+1e-8);
  }
  const pencil=containRect(1122,1402,width,height);assert.ok(pencil.dy>0);
 }
 assert.equal(containRect(0,100,100,100),null);
});
test('cluster openings fit inside the portrait including their maximum hover growth',()=>{
 for(const [width,height] of [[446,430],[150,185]]){const field=new RaindropField(random());field.resize(width,height);for(let i=0;i<100;i++)field.spawn('cluster');for(const drop of field.drops.cluster){const r=drop.size*(1+config.growth)*config.hoverScale;assert.ok(drop.x>=r&&drop.x+r<=width);assert.ok(drop.y>=r&&drop.y+r<=height);}assert.equal(field.drops.cluster.length,field.activeLimit('cluster'));}
});
test('hover emits at the pointer, falling drops move down, and hover grows existing openings temporarily',()=>{
 const field=new RaindropField(random());field.resize(375,430);const initial=field.drops.drizzle.length;field.hoverSettings={...config.hoverDrops,revealBothChance:1};field.setPointer({x:.8,y:.2});const drop=field.drops.drizzle.filter(drop=>!drop.satellite).at(-1),startY=drop.y;
 assert.ok(Math.abs(drop.x-300)<=9);assert.ok(Math.abs(drop.y-86)<=4);assert.equal(drop.falling,true);
 for(let i=0;i<180;i++)field.advance(33.34);assert.ok(drop.y>startY);assert.ok(field.drops.drizzle.length>initial+10);assert.ok(field.hover>.99);
 assert.ok(dropFrame(drop,field.hover).radius>dropFrame(drop,0).radius*1.4);
 field.setPointer(null);for(let i=0;i<240;i++)field.advance(33.34);assert.ok(field.hover<.001);
});
test('continuous animation stays bounded, fades expired drops, and safely resizes its field',()=>{
 const field=new RaindropField(random());field.resize(446,430);field.setPointer({x:.5,y:.3});
 for(let i=0;i<3000;i++){field.advance(33.34);for(const kind of ['drizzle','cluster'])assert.ok(field.drops[kind].length<=config[kind].limit);}
 const drop={size:10,age:20000,life:2500,fade:1/config.opacityRate,growthDuration:900,smearDuration:0,smearDistance:0};assert.equal(dropFrame(drop,1).opacity,0);
 field.resize(150,185);for(const drops of Object.values(field.drops))for(const drop of drops)assert.ok(Number.isFinite(drop.x)&&Number.isFinite(drop.y)&&drop.size>0);
});
test('canvas controller starts only one loop, cancels when paused/disposed and restores compositing',t=>{
 const before=Object.fromEntries(['window','ResizeObserver','requestAnimationFrame','cancelAnimationFrame'].map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
 t.after(()=>{for(const [key,value] of Object.entries(before)){if(value)Object.defineProperty(globalThis,key,value);else delete globalThis[key];}});
 let id=0,disconnected=0;const frames=new Map();globalThis.window={devicePixelRatio:3};globalThis.requestAnimationFrame=callback=>{frames.set(++id,callback);return id;};globalThis.cancelAnimationFrame=id=>frames.delete(id);globalThis.ResizeObserver=class{observe(){}disconnect(){disconnected++;}};
 const context=()=>({setTransform(){},save(){},restore(){},translate(){},scale(){},stroke(){},clearRect(){},drawImage(...args){this.lastDraw=args;},fillRect(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){},createRadialGradient:()=>({addColorStop(){}})}),contexts=[context(),context()],canvases=contexts.map(ctx=>({getContext:()=>ctx}));
 const controller=new PortraitMaskController({host:{getBoundingClientRect:()=>({width:400,height:430})},middle:canvases[0],top:canvases[1],image:{naturalWidth:1122,naturalHeight:1402},getBackground:()=>'#111720'});
 assert.equal(canvases[0].width,600);assert.equal(canvases[0].height,canvases[1].height);
 assert.deepEqual(contexts[0].lastDraw.slice(1,5),[0,0,1122,1402]);controller.setActive(true);controller.setActive(true);assert.equal(frames.size,1);controller.setActive(false);assert.equal(frames.size,0);controller.setActive(true);controller.dispose();assert.equal(frames.size,0);assert.equal(disconnected,1);
 for(const ctx of contexts){assert.equal(ctx.globalCompositeOperation,'source-over');assert.equal(ctx.globalAlpha,1);}
});

test('a falling drop decelerates to a fixed position, finishes growing, then fades there',()=>{
 const field=new RaindropField(random(),config.satellites,{...config.pressure,enabled:false});field.resize(375,570);const drop=field.spawn('drizzle',{x:.5,y:.2});
 // Keep the one observed drop, and let normal spawning exercise the same field loop.
 const initialY=drop.y;drop.size=60;drop.growthDuration=drop.smearDuration+60*config.growth/config.growthRate;
 for(let i=0;i<6;i++)field.advance(50);const earlyY=drop.y;assert.ok(earlyY>initialY);assert.ok(dropFrame(drop).smear>0);
 for(let i=0;i<8;i++)field.advance(50);const settledY=drop.y,settledRadius=dropFrame(drop).radius;
 assert.ok(Math.abs(settledY-(initialY+drop.smearDistance))<1e-8);assert.equal(dropFrame(drop).smear,0);
 for(let i=0;i<24;i++)field.advance(50);assert.equal(drop.y,settledY);assert.ok(dropFrame(drop).radius>settledRadius);assert.equal(dropFrame(drop).opacity,1);
 for(let i=0;i<90;i++)field.advance(50);assert.equal(drop.y,settledY);assert.ok(dropFrame(drop).opacity>0&&dropFrame(drop).opacity<1);
 for(let i=0;i<120;i++)field.advance(50);assert.ok(!field.drops.drizzle.includes(drop));
});
test('settled drop position remains correct after resizing the shared artwork frame',()=>{
 const field=new RaindropField(random());field.resize(375,570);const drop=field.spawn('drizzle',{x:.5,y:.3});for(let i=0;i<20;i++)field.advance(50);
 const settled=drop.y;field.resize(150,228);assert.ok(Math.abs(drop.y-settled*.4)<1e-8);const resizedY=drop.y;for(let i=0;i<20;i++)field.advance(50);assert.equal(drop.y,resizedY);
});
