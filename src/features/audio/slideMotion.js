import { soundConfig } from './soundConfig.js';
/** One hit for one significant displacement, not a backlog of crossed thresholds. */
export function shouldPlayDragSlide(angle,lastSoundAngle=0){
 return Number.isFinite(angle)&&Number.isFinite(lastSoundAngle)&&Math.abs(angle-lastSoundAngle)>=soundConfig.slide.dragThresholdRadians;
}
