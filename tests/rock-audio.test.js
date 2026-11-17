import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { soundConfig,chooseSlideExcerpt } from '../src/features/audio/soundConfig.js';
import { setAudioEnabled,audioEnabled,playSound,disposeAudio } from '../src/lib/audio.js';
function fixture(t,decode=async()=>({duration:8.229})){
 const previousWindow=Object.getOwnPropertyDescriptor(globalThis,'window'),previousFetch=globalThis.fetch;let fetches=0,contexts=0;const sources=[];
 const parameter=()=>({value:0,setValueAtTime(v){this.value=v;},linearRampToValueAtTime(v){this.value=v;},exponentialRampToValueAtTime(v){this.value=v;},cancelScheduledValues(){}});
 const node=()=>({connect(target){return target;},disconnect(){},start(...args){this.started=args;},stop(){this.stopped=true;this.onended?.();}});
 class Audio{constructor(){contexts++;this.state='suspended';this.currentTime=0;this.destination=node();Audio.current=this;}createGain(){return{...node(),gain:parameter()};}createOscillator(){return{...node(),frequency:parameter()};}createBufferSource(){const source=node();sources.push(source);return source;}decodeAudioData(data){return decode(data);}async resume(){this.state='running';}async suspend(){this.state='suspended';}async close(){this.state='closed';}}
 globalThis.window={AudioContext:Audio};globalThis.fetch=async()=>{fetches++;return{ok:true,arrayBuffer:async()=>new ArrayBuffer(8)};};
 t.after(()=>{disposeAudio();globalThis.fetch=previousFetch;if(previousWindow)Object.defineProperty(globalThis,'window',previousWindow);else delete globalThis.window;});
 return {sources,Audio,get fetches(){return fetches;},get contexts(){return contexts;}};
}
test('configured excerpts select the requested 4–5 and 6–7 second ranges as short single hits',()=>{
 assert.ok(existsSync(new URL('../public'+soundConfig.slide.url,import.meta.url)));assert.deepEqual(chooseSlideExcerpt(8.229,()=>0),{offset:4,duration:.22});assert.deepEqual(chooseSlideExcerpt(8.229,()=>.99),{offset:6,duration:.22});assert.equal(chooseSlideExcerpt(3),null);
});
test('muted slides do not create audio or fetch; enabled slices use one decoded asset and stop on mute',async t=>{
 const env=fixture(t);disposeAudio();await playSound('slide');assert.equal(env.contexts,0);assert.equal(env.fetches,0);
 assert.equal(await setAudioEnabled(true),true);await playSound('slide');assert.equal(env.fetches,1);assert.equal(env.sources.length,1);assert.ok([4,6].includes(env.sources[0].started[1]));assert.equal(env.sources[0].started[2],.22);
 env.Audio.current.currentTime+=.2;await playSound('slide');assert.equal(env.fetches,1);assert.equal(env.sources.length,2);assert.ok(env.sources[0].stopped,'the next movement replaces the old hit');
 await setAudioEnabled(false);assert.equal(audioEnabled(),false);assert.ok(env.sources.every(source=>source.stopped));const count=env.sources.length;await playSound('slide');assert.equal(env.sources.length,count);
});
test('muting during decoding prevents late slide playback',async t=>{
 let resolveDecode;const gate=new Promise(resolve=>{resolveDecode=resolve;}),env=fixture(t,()=>gate);disposeAudio();await setAudioEnabled(true);const pending=playSound('slide');await setAudioEnabled(false);resolveDecode({duration:8.229});await pending;assert.equal(env.sources.length,0);
});

test('several moves during decoding produce only the latest hit, never queued playback',async t=>{
 let resolveDecode;const gate=new Promise(resolve=>{resolveDecode=resolve;}),env=fixture(t,()=>gate);disposeAudio();await setAudioEnabled(true);
 const first=playSound('slide');env.Audio.current.currentTime+=.12;const second=playSound('slide');resolveDecode({duration:8.229});await Promise.all([first,second]);assert.equal(env.sources.length,1);
});
