import { portraitRevealConfig as config } from './portraitRevealConfig.js';
/** Use fewer samples for mini drops while retaining thin tips on larger outlines. */
export function splatResolution(referenceRadius){return Math.round(config.segments/(referenceRadius<12?4:referenceRadius<28?2:1));}
/** Precompute angular spikes once; contours do not shimmer randomly between frames. */
export function makeSplatSpikes(random=Math.random,segments=config.segments){
 const shape=new Float32Array(segments),{minExtension,maxExtension}=config.contour;
 const spikes=Math.max(6,Math.round(config.contour.spikes*segments/config.segments));
 for(let i=0;i<spikes;i++){
  const index=((Math.round((i+random()*.5)*segments/spikes)%segments)+segments)%segments;
  const height=minExtension+random()*(maxExtension-minExtension);shape[index]=Math.max(shape[index],height);
 }
 return shape;
}
export function splatContourRadius(drop,index,progress){
 const phase=index*drop.largeNoise.length/drop.noise.length,left=Math.floor(phase),fraction=phase-left;
 const coarse=drop.largeNoise[left]*(1-fraction)+drop.largeNoise[(left+1)%drop.largeNoise.length]*fraction;
 const large=config.blobJitterLarge+config.jitterChange*progress,small=config.blobJitterSmall+config.jitterChange*progress;
 const retained=1-(1-config.contour.retention)*progress;
 return Math.max(.2,1+coarse*large+drop.noise[index]*small+drop.spikes[index]*retained);
}
export const maximumContourRadius=1+config.contour.maxExtension+config.blobJitterLarge+config.blobJitterSmall;
