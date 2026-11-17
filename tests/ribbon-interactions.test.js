import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync,existsSync } from 'node:fs';
import { ribbonConfig } from '../src/features/home/ribbonConfig.js';
import { ribbonModels,ribbonTransform,resolveRibbonPreview,ribbonFrontDepth,ribbonSpeed,ribbonTooltipPosition,helixPosition,helixSpan } from '../src/features/home/modelRibbon.js';
import { products,services } from '../src/data/offerings.js';
const projects=JSON.parse(readFileSync(new URL('../src/data/projects.json',import.meta.url)));
test('every ribbon object resolves a real preview and the project or offering destination',()=>{
 for(const item of ribbonModels){const resolved=resolveRibbonPreview(item,{projects,products,services});assert.ok(resolved.title&&resolved.summary&&resolved.image,item.id);assert.ok(existsSync(new URL('../public'+resolved.image,import.meta.url)),item.id);assert.equal(resolved.href,item.kind==='project'?`#/projects/${item.contentId}`:'#/offerings');}
 const service=resolveRibbonPreview({kind:'service',contentId:services[0].id},{services});assert.equal(service.title,services[0].title);assert.equal(service.href,'#/offerings');
 assert.equal(resolveRibbonPreview({kind:'product',contentId:products[0].id,href:products[0].url},{products}).href,products[0].url);
 for(const href of ['javascript:alert(1)','//evil.test','http://example.com','#/admin'])assert.equal(resolveRibbonPreview({kind:'product',contentId:products[0].id,href},{products}).href,'#/offerings');
});
test('per-model offsets, degree rotations and scale are independent and reject malformed values',()=>{
 const item={position:[1,-.2,.3],rotation:[0,90,180],scale:1.3},result=ribbonTransform(item);assert.deepEqual(result.position,item.position);assert.deepEqual(result.rotation,[0,Math.PI/2,Math.PI]);assert.equal(result.scale,1.3);result.position[0]=9;assert.equal(item.position[0],1);
 const bad=ribbonTransform({position:[1,NaN,0],rotation:[0,0],scale:-1});assert.deepEqual(bad.position,ribbonConfig.defaults.position);assert.equal(bad.scale,1);assert.ok(bad.rotation.every(Number.isFinite));
});
test('flat labels stay in front of every part of their own curved ribbon across their footprint',()=>{
 const half=ribbonConfig.label.width/2;
 for(const width of [6,20])for(const strand of [0,1])for(const time of [0,.7,4.8,20])for(let x=-helixSpan(width)/2;x<helixSpan(width)/2;x+=.5){
  const front=ribbonFrontDepth(x,half,width,time,strand)+.05;
  for(let t=-half;t<=half;t+=.1)assert.ok(front>helixPosition(x+t,width,time,strand).z);
 }
 // The opposing strip can still be in front at a crossing.
 assert.ok(ribbonFrontDepth(0,half,20,0,1)+.05<helixPosition(0,20,0,0).z);
 assert.ok(helixSpan(20)/2-10>=ribbonConfig.label.offsetX+half+.29);
});
test('hover eases through a crawl to an exact stop, then resumes smoothly with no clock jump',()=>{
 let speed=1,previous=1,visitedCrawl=false;
 for(let i=0;i<100;i++){speed=ribbonSpeed(speed,true,1/60);assert.ok(speed<=previous);if(speed>0&&speed<.05)visitedCrawl=true;previous=speed;}
 assert.equal(speed,0);assert.ok(visitedCrawl);
 const first=ribbonSpeed(speed,false,1/60);assert.ok(first>0&&first<.1);speed=first;
 for(let i=0;i<150;i++){const next=ribbonSpeed(speed,false,1/60);assert.ok(next>=speed&&next<=1);speed=next;}
 assert.equal(speed,1);assert.equal(ribbonSpeed(1,true,0),1);
});
test('preview tooltip fits beside the pointer at desktop and phone edges',()=>{
 for(const viewport of [{width:1280,height:800},{width:390,height:844}])for(const point of [{x:0,y:0},{x:viewport.width-2,y:viewport.height-2}]){
  const box={width:290,height:260},p=ribbonTooltipPosition(point,viewport,box);assert.ok(p.left>=12&&p.top>=12);assert.ok(p.left+box.width<=viewport.width-12);assert.ok(p.top+box.height<=viewport.height-12);
 }
});
