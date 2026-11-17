export const IDLE_AFTER_MS=35000;
export function shouldEnterIdle(elapsed,hidden,overlayOpen){return elapsed>IDLE_AFTER_MS&&!hidden&&!overlayOpen;}
export function portalShouldPlay({mode,selected,hovered,activationEnabled,previewsEnabled=true}){return previewsEnabled&&(mode==='cube'?Boolean(hovered):Boolean(selected&&activationEnabled));}
