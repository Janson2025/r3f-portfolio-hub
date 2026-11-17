/** Times are seconds: the supplied ~8.2s clip's 0:04–0:05 and 0:06–0:07 ranges. */
export const soundConfig={
 slide:{url:'/audio/freesound_community-rocks-sliding-101019.mp3',clips:[{start:4,end:5},{start:6,end:7}],volume:.8,fadeIn:.008,fadeOut:.025,minGap:.08,maxVoices:1,maxDuration:.22,dragThresholdRadians:Math.PI/4,maxDelayMs:350},
};
export function chooseSlideExcerpt(bufferDuration,random=Math.random){
 const clips=soundConfig.slide.clips.map(clip=>({offset:clip.start,duration:Math.min(clip.end-clip.start,bufferDuration-clip.start,soundConfig.slide.maxDuration)})).filter(clip=>Number.isFinite(clip.offset)&&clip.offset>=0&&Number.isFinite(clip.duration)&&clip.duration>0);
 return clips.length?clips[Math.min(clips.length-1,Math.floor(Math.max(0,random())*clips.length))]:null;
}
