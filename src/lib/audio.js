import { useSyncExternalStore } from 'react';
import { soundConfig,chooseSlideExcerpt } from '../features/audio/soundConfig.js';
let enabled=false,context=null,ambient=null,master=null,generation=0,slideBuffer=null,slideContext=null,slideLoading=null,loadController=null,lastSlide=-Infinity,slideRequest=0;
const listeners=new Set(),voices=new Set();
const publish=()=>listeners.forEach(fn=>fn());
export function audioEnabled(){return enabled;}
export function useAudioEnabled(){return useSyncExternalStore(fn=>{listeners.add(fn);return()=>listeners.delete(fn);},audioEnabled,()=>false);}
function stopVoice(voice,fade=0){
 voices.delete(voice);try{if(fade&&context?.state==='running'){const now=context.currentTime;voice.gain.gain.cancelScheduledValues(now);voice.gain.gain.setValueAtTime(voice.gain.gain.value,now);voice.gain.gain.linearRampToValueAtTime(0,now+fade);voice.node.stop(now+fade);}else voice.node.stop();}catch{}
}
function stopEffects(){slideRequest++;for(const voice of [...voices])stopVoice(voice);lastSlide=-Infinity;}
function ownVoice(node,gain,kind){const voice={node,gain,kind};voices.add(voice);node.onended=()=>{voices.delete(voice);node.disconnect();gain.disconnect();};return voice;}
function loadSlideBuffer(current){
 if(slideBuffer&&slideContext===current)return Promise.resolve(slideBuffer);
 if(slideLoading&&slideContext===current)return slideLoading;
 slideContext=current;const controller=new AbortController();loadController=controller;
 const promise=fetch(soundConfig.slide.url,{signal:controller.signal}).then(response=>{if(!response.ok)throw new Error('Slide sound unavailable');return response.arrayBuffer();}).then(data=>current.decodeAudioData(data)).then(buffer=>{if(context===current)slideBuffer=buffer;return buffer;}).finally(()=>{if(slideLoading===promise){slideLoading=null;loadController=null;}});
 slideLoading=promise;return promise;
}
export async function setAudioEnabled(value){
 const ticket=++generation;
 if(!value){enabled=false;stopEffects();loadController?.abort();ambient?.forEach(node=>{try{node.stop();}catch{}});ambient=null;if(context&&context.state!=='closed')await context.suspend();publish();return false;}
 const Audio=globalThis.window?.AudioContext||globalThis.window?.webkitAudioContext;if(!Audio)return false;
 try{
  context??=new Audio();const current=context;master??=current.createGain();master.gain.value=.14;master.disconnect();master.connect(current.destination);await current.resume();if(ticket!==generation||current!==context)return false;
  enabled=true;if(!ambient){ambient=[110,164.81].map(frequency=>{const node=current.createOscillator(),gain=current.createGain();node.type='sine';node.frequency.value=frequency;gain.gain.value=.018;node.connect(gain).connect(master);node.onended=()=>{node.disconnect();gain.disconnect();};node.start();return node;});}
  publish();void loadSlideBuffer(current).catch(()=>{});return true;
 }catch{return false;}
}
async function playSlide(){
 const current=context,ticket=generation,requested=Date.now(),settings=soundConfig.slide;
 if(current.currentTime-lastSlide<settings.minGap)return;lastSlide=current.currentTime;const requestId=++slideRequest;
 const buffer=await loadSlideBuffer(current);
 if(requestId!==slideRequest||!enabled||context!==current||generation!==ticket||current.state!=='running'||Date.now()-requested>settings.maxDelayMs)return;
 const clip=chooseSlideExcerpt(buffer.duration);if(!clip)return;
 const existing=[...voices].filter(voice=>voice.kind==='slide');while(existing.length>=settings.maxVoices)stopVoice(existing.shift(),.015);
 const start=current.currentTime,node=current.createBufferSource(),gain=current.createGain(),end=start+clip.duration;
 node.buffer=buffer;gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(settings.volume,start+Math.min(settings.fadeIn,clip.duration/4));gain.gain.setValueAtTime(settings.volume,Math.max(start+clip.duration/2,end-settings.fadeOut));gain.gain.linearRampToValueAtTime(0,end);
 node.connect(gain).connect(master);ownVoice(node,gain,'slide');node.start(start,clip.offset,clip.duration);
}
export function playSound(kind){
 if(!enabled||!context||context.state!=='running')return;
 if(kind==='slide')return playSlide().catch(()=>{});
 const start=context.currentTime,node=context.createOscillator(),gain=context.createGain();
 node.type='sine';node.frequency.setValueAtTime(520,start);node.frequency.exponentialRampToValueAtTime(180,start+.13);
 gain.gain.setValueAtTime(.001,start);gain.gain.exponentialRampToValueAtTime(.3,start+.012);gain.gain.exponentialRampToValueAtTime(.001,start+.18);
 node.connect(gain).connect(master);ownVoice(node,gain,'poke');node.start();node.stop(start+.2);
}
export function suspendAudio(){generation++;stopEffects();if(context&&context.state==='running')context.suspend().catch(()=>{});}
export function resumeAudio(){if(enabled&&context?.state==='suspended')context.resume().catch(()=>{});}
export function disposeAudio(){generation++;enabled=false;stopEffects();loadController?.abort();loadController=null;slideLoading=null;slideBuffer=null;slideContext=null;ambient?.forEach(node=>{try{node.stop();}catch{}});ambient=null;context?.close().catch(()=>{});context=null;master=null;publish();}
