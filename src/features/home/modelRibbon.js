import { ribbonConfig } from './ribbonConfig.js';
import { safeExternalUrl } from '../../lib/urls.js';
export const ribbonModels=ribbonConfig.models;
export function chooseRibbonModels(items=ribbonModels,random=Math.random,count=4){const copy=[...items];for(let i=copy.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}return copy.slice(0,count);}
export function ribbonPosition(phase,width,time=0){const p=((phase%1)+1)%1,x=(p-.5)*(width+2);return {x,y:Math.sin(p*Math.PI*4)*.45+Math.sin(time*1.7+p*8)*.08};}

export function ribbonBandPath(width,height){const span=Math.max(width/65,15)+2,points=[];for(let x=-30;x<=width+42;x+=12){const phase=(x-width/2)/(span*65)+.5;points.push([x,height/2-Math.sin(phase*Math.PI*4)*.45*65]);}return 'M'+points.map(([x,y])=>`${x},${y-53}`).join(' L')+' L'+points.slice().reverse().map(([x,y])=>`${x},${y+53}`).join(' L')+' Z';}

/** One randomized selection per page session, partitioned without duplicates. */
export function chooseRibbonStrands(items=ribbonModels,random=Math.random,count=4){
 const chosen=chooseRibbonModels(items,random,Math.min(items.length,count*2));
 const split=Math.ceil(chosen.length/2);return [chosen.slice(0,split),chosen.slice(split)];
}
export const HELIX={cycles:2,amplitude:.95,depth:2.1,halfWidth:.62,waveSpeed:.42,itemSpeed:.026};
const edgePadding=Math.max(5.2,Math.abs(ribbonConfig.label.offsetX)+ribbonConfig.label.width/2+.3,...ribbonModels.map(item=>{const transform=ribbonTransform(item);return Math.hypot(...transform.position)+ribbonConfig.modelSize*transform.scale*Math.sqrt(3)/2+.3;}));
export function helixSpan(width){return Math.max(width,15)+edgePadding*2;}
export function helixPosition(x,width,time=0,strand=0){
 const angle=x/helixSpan(width)*Math.PI*2*HELIX.cycles-time*HELIX.waveSpeed,side=strand===0?1:-1;
 return {x,y:side*HELIX.amplitude*Math.sin(angle),z:side*HELIX.depth*Math.cos(angle)};
}
export function helixItemX(index,count,width,time=0,strand=0){
 const direction=strand===0?1:-1,phase=((index/Math.max(1,count)+direction*time*HELIX.itemSpeed)%1+1)%1;
 return (phase-.5)*helixSpan(width);
}

function vector(value,fallback){return Array.isArray(value)&&value.length===3&&value.every(Number.isFinite)?[...value]:[...fallback];}
export function ribbonTransform(item){
 const defaults=ribbonConfig.defaults;
 return {orientation:['fixed','camera','path'].includes(item.orientation)?item.orientation:defaults.orientation,forwardAxis:vector(item.forwardAxis,defaults.forwardAxis),position:vector(item.position,defaults.position),rotation:vector(item.rotation,defaults.rotation).map(degrees=>degrees*Math.PI/180),scale:Number.isFinite(item.scale)&&item.scale>0?Math.min(item.scale,4):defaults.scale};
}
export function resolveRibbonPreview(item,{projects=[],products=[],services=[]}={}){
 const records=item.kind==='product'?products:item.kind==='service'?services:projects;
 const record=records.find(record=>record.id===item.contentId||record.slug===item.contentId);
 const fallback=record?(item.kind==='project'?`#/projects/${record.slug}`:'#/offerings'):'#/projects';
 const href=typeof item.href==='string'&&/^#\/(?:projects(?:\/[a-z0-9-]+)?|offerings)(?:\?[^\s]*)?$/.test(item.href)?item.href:safeExternalUrl(item.href)||fallback;
 return {...item,href,title:record?.title??item.title,summary:record?.summary??item.summary??'Explore this project and how it was built.',image:record?.image??item.image??null};
}
/** Exact maximum of this strip's depth across a flat card/object footprint.
 * A center-only depth can put a label through its own curved ribbon.
 */
export function ribbonFrontDepth(x,halfExtent,width,time,strand){
 const frequency=Math.PI*2*HELIX.cycles/helixSpan(width),center=x*frequency-time*HELIX.waveSpeed+(strand===0?0:Math.PI);
 const a=center-Math.abs(halfExtent)*frequency,b=center+Math.abs(halfExtent)*frequency,turn=Math.PI*2;
 const containsPeak=Math.ceil(a/turn)<=Math.floor(b/turn);
 return HELIX.depth*(containsPeak?1:Math.max(Math.cos(a),Math.cos(b)));
}
export function ribbonSpeed(current,hovered,delta){
 const {stopRate,resumeRate,stopThreshold}=ribbonConfig.hover,target=hovered?0:1;
 const next=target+(current-target)*Math.exp(-(hovered?stopRate:resumeRate)*Math.min(Math.max(delta,0),.05));
 return Math.abs(next-target)<stopThreshold?target:next;
}
export function ribbonTooltipPosition(point,viewport,box){
 const margin=12,left=Math.max(margin,Math.min(viewport.width-box.width-margin,point.x+16));
 const below=point.y+18,above=point.y-box.height-18;
 return {left,top:Math.max(margin,Math.min(viewport.height-box.height-margin,below+box.height+margin<=viewport.height?below:above))};
}

export function helixTangent(x,width,time=0,strand=0){
 const frequency=Math.PI*2*HELIX.cycles/helixSpan(width),angle=x*frequency-time*HELIX.waveSpeed,side=strand===0?1:-1,direction=strand===0?1:-1;
 return [direction,direction*side*HELIX.amplitude*frequency*Math.cos(angle),-direction*side*HELIX.depth*frequency*Math.sin(angle)];
}
