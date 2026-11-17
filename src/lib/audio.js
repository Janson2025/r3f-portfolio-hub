import { useSyncExternalStore } from 'react';
let enabled=false,context=null,ambient=null,master=null;
const listeners=new Set();
const publish=()=>listeners.forEach(fn=>fn());
export function audioEnabled(){return enabled;}
export function useAudioEnabled(){return useSyncExternalStore(fn=>{listeners.add(fn);return()=>listeners.delete(fn);},audioEnabled,()=>false);}
export async function setAudioEnabled(value){
 if(!value){enabled=false;ambient?.forEach(node=>{try{node.stop();}catch{}});ambient=null;if(context&&context.state!=='closed')await context.suspend();publish();return false;}
 const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return false;
 try{
  context??=new Audio();master??=context.createGain();master.gain.value=.14;master.disconnect();master.connect(context.destination);await context.resume();
  enabled=true;if(!ambient){ambient=[110,164.81].map(frequency=>{const node=context.createOscillator(),gain=context.createGain();node.type='sine';node.frequency.value=frequency;gain.gain.value=.018;node.connect(gain).connect(master);node.onended=()=>{node.disconnect();gain.disconnect();};node.start();return node;});}
  publish();return true;
 }catch{return false;}
}
export function playSound(kind){
 if(!enabled||!context||context.state!=='running')return;
 const start=context.currentTime,node=context.createOscillator(),gain=context.createGain();
 node.type=kind==='slide'?'triangle':'sine';node.frequency.setValueAtTime(kind==='slide'?170:520,start);node.frequency.exponentialRampToValueAtTime(kind==='slide'?70:180,start+.13);
 gain.gain.setValueAtTime(.001,start);gain.gain.exponentialRampToValueAtTime(kind==='slide'?.09:.3,start+.012);gain.gain.exponentialRampToValueAtTime(.001,start+.18);
 node.connect(gain).connect(master);node.start();node.stop(start+.2);node.onended=()=>{node.disconnect();gain.disconnect();};
}
export function suspendAudio(){if(context&&context.state==='running')context.suspend().catch(()=>{});}
export function resumeAudio(){if(enabled&&context?.state==='suspended')context.resume().catch(()=>{});}
export function disposeAudio(){enabled=false;ambient?.forEach(node=>{try{node.stop();}catch{}});ambient=null;context?.close().catch(()=>{});context=null;master=null;publish();}
