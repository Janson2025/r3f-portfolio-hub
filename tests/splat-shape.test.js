import test from 'node:test';
import assert from 'node:assert/strict';
import { portraitRevealConfig as config } from '../src/features/portrait/portraitRevealConfig.js';
import { makeSplatSpikes,splatContourRadius,maximumContourRadius,splatResolution } from '../src/features/portrait/splatShape.js';
import { RaindropField } from '../src/features/portrait/revealMath.js';
const random=()=>{let seed=539;return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};};
test('splats have narrow persistent tips with stable, finite contours inside the render bound',()=>{
 const drop={spikes:makeSplatSpikes(()=>.5),noise:new Float32Array(config.segments),largeNoise:new Float32Array(config.largeBlobSegments)};
 const radii=Array.from({length:config.segments},(_,i)=>splatContourRadius(drop,i,1));
 const peaks=radii.filter((value,i)=>value>1.025&&value>radii[(i+1)%radii.length]&&value>radii[(i+radii.length-1)%radii.length]);assert.equal(peaks.length,config.contour.spikes);
 assert.ok(Math.max(...radii)>1.075);for(const value of radii)assert.ok(value>0&&value<=maximumContourRadius);
 assert.deepEqual(radii,Array.from({length:config.segments},(_,i)=>splatContourRadius(drop,i,1)));
});
test('large splats can emit adjacent smaller satellites that do not recursively multiply',()=>{
 const field=new RaindropField(random(),{...config.satellites,chance:1});field.resize(375,570);field.drops.drizzle=[];
 const parent=field.createDrop('drizzle',{x:187,y:240,size:55,falling:true});field.spawnSatellites('drizzle',parent);
 const children=field.drops.drizzle.filter(drop=>drop.satellite);assert.ok(children.length>=config.satellites.minCount&&children.length<=config.satellites.maxCount);
 for(const child of children){assert.ok(child.size<parent.size*.3);const distance=Math.hypot(child.x-parent.x,child.y-parent.y);assert.ok(distance>=parent.size*(1+config.growth)*config.satellites.minDistance-1e-6);assert.ok(distance<=parent.size*(1+config.growth)*config.satellites.maxDistance+1e-6);}
 const count=field.drops.drizzle.length;field.spawnSatellites('drizzle',children[0]);assert.equal(field.drops.drizzle.length,count);
 const small=field.createDrop('drizzle',{x:187,y:240,size:20,falling:true});field.spawnSatellites('drizzle',small);assert.equal(field.drops.drizzle.length,count+1);
});
test('satellite probability/enable settings and the existing population cap are respected',()=>{
 for(const settings of [{enabled:false,chance:1},{enabled:true,chance:0}]){
  const field=new RaindropField(random(),{...config.satellites,...settings});field.resize(375,570);assert.ok(field.drops.drizzle.every(drop=>!drop.satellite));
 }
 const field=new RaindropField(random(),{...config.satellites,chance:1,threshold:0});field.resize(375,570);field.drops.drizzle=[];
 for(let i=0;i<100;i++)field.spawn('drizzle',{x:.5,y:.5});assert.equal(field.drops.drizzle.length,field.activeLimit('drizzle'));assert.ok(field.drops.drizzle.some(drop=>drop.satellite));
});

test('large outlines have a much finer angular tip base while small droplets use fewer points',()=>{
 assert.ok(splatResolution(60)>=256);assert.ok(splatResolution(6)<splatResolution(20)&&splatResolution(20)<splatResolution(60));
 const shape=makeSplatSpikes(()=>.5),tip=shape.findIndex(value=>value>config.contour.minExtension);
 assert.equal(shape[(tip+shape.length-1)%shape.length],0);assert.equal(shape[(tip+1)%shape.length],0);
 assert.ok(720/shape.length<3); // Full triangular base is under 3 degrees (formerly 11.25).
 for(const size of [6,20,60]){const segments=splatResolution(size),spikes=makeSplatSpikes(()=>.5,segments);assert.equal(spikes.length,segments);assert.ok([...spikes].filter(value=>value>0).length>=20);}
});
