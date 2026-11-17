import { createContext, useContext, useSyncExternalStore } from 'react';
export const MotionContext=createContext({reducedMotion:false,ambientMotion:false});
export function useMotion() { return useContext(MotionContext); }
function subscribe(callback) {const media=window.matchMedia('(prefers-reduced-motion: reduce)');media.addEventListener('change',callback);return ()=>media.removeEventListener('change',callback);}
export function useReducedMotion() {return useSyncExternalStore(subscribe,()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches,()=>false);}
