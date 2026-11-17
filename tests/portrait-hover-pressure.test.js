import test from 'node:test';
import assert from 'node:assert/strict';
import { RaindropField,dropFrame } from '../src/features/portrait/revealMath.js';
import { portraitRevealConfig as config } from '../src/features/portrait/portraitRevealConfig.js';
const random=()=>{let seed=301;return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};};
test('hover selects about 60% matching two-layer drops and 40% pencil-only drops',()=>{
 const field=new RaindropField(random(),{...config.satellites,enabled:false});field.resize(375,570);let both=0;
 for(let i=0;i<500;i++){
  field.drops={cluster:[],drizzle:[]};field.retiring={cluster:[],drizzle:[]};const parent=field.emitHoverDrop({x:.5,y:.4});
  if(parent.revealMode==='both'){both++;const twin=field.drops.drizzle[0];assert.ok(twin);for(const key of ['x','startY','size','smearDistance','growthDuration'])assert.equal(twin[key],parent[key]);assert.equal(twin.spikes,parent.spikes);}
  else assert.equal(field.drops.drizzle.length,0);
 }
 assert.ok(both/500>.55&&both/500<.65,`${both}/500`);
});
test('a stationary pointer keeps emitting under sustained pressure within the total layer caps',()=>{
 const field=new RaindropField(random());field.resize(375,570);field.setPointer({x:.5,y:.4});let previous=0,peakPressure=0;
 for(let i=0;i<1000;i++){
  field.advance(40);peakPressure=Math.max(peakPressure,field.pressure.cluster);
  for(const kind of ['cluster','drizzle'])assert.ok(field.drops[kind].length+field.retiring[kind].length<=config[kind].limit);
  if(i%50===49){assert.ok(field.hoverBirths-previous>=40,'hover must keep emitting even near the cap');previous=field.hoverBirths;}
 }
 assert.ok(peakPressure>.1);assert.ok(field.hoverBirths>950);
 const births=field.hoverBirths;field.setPointer(null);for(let i=0;i<20;i++)field.advance(40);assert.equal(field.hoverBirths,births);
});
test('full-layer replacement crossfades old drops instead of abruptly removing them',()=>{
 const field=new RaindropField(random(),{...config.satellites,enabled:false});field.resize(375,570);field.drops.cluster=[];
 for(let i=0;i<field.activeLimit('cluster');i++){const drop=field.createDrop('cluster',{x:180,y:220,size:30,falling:false});drop.age=9000;drop.lifeAge=9000;drop.fadeAge=1000;}
 field.emitHoverDrop({x:.5,y:.4});assert.equal(field.retiring.cluster.length,1);const retired=field.retiring.cluster[0],initial=dropFrame(retired).opacity;assert.ok(initial>0);
 field.advance(45);assert.ok(dropFrame(retired).opacity>0&&dropFrame(retired).opacity<initial);
 for(let i=0;i<4;i++)field.advance(45);assert.ok(!field.retiring.cluster.includes(retired));
});
