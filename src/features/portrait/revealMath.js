import { portraitRevealConfig as config } from './portraitRevealConfig.js';
import { makeSplatSpikes,maximumContourRadius,splatResolution } from './splatShape.js';
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
/** Entire source rectangle, scaled uniformly into one shared frame; never crop or stretch. */
export function containRect(sourceWidth,sourceHeight,width,height){
 if(![sourceWidth,sourceHeight,width,height].every(value=>Number.isFinite(value)&&value>0))return null;
 const scale=Math.min(width/sourceWidth,height/sourceHeight),dw=sourceWidth*scale,dh=sourceHeight*scale;
 return {sx:0,sy:0,sw:sourceWidth,sh:sourceHeight,dx:(width-dw)/2,dy:(height-dh)/2,dw,dh};
}
export function dropFrame(drop,hover=0){
 const progress=clamp(drop.age/drop.growthDuration,0,1),slide=drop.smearDuration?clamp(drop.age/drop.smearDuration,0,1):1;
 const fadeStart=Math.max(drop.life,drop.growthDuration);
 const natural=clamp(1-(drop.fadeAge??Math.max(0,drop.age-fadeStart))/drop.fade,0,1);
 const retire=drop.retireAge==null?1:drop.retireStart*(1-clamp(drop.retireAge/drop.retireDuration,0,1)**2*(3-2*clamp(drop.retireAge/drop.retireDuration,0,1)));
 return {radius:drop.size*(1+progress*config.growth)*(1+hover*(config.hoverScale-1)),opacity:Math.min(natural,retire),smear:slide<1?drop.smearDistance*config.smear.trailFactor*Math.sin(Math.PI*slide):0,progress};
}
function moveDrop(drop){const t=drop.smearDuration?clamp(drop.age/drop.smearDuration,0,1):1;drop.y=drop.startY+drop.smearDistance*(1-(1-t)**3);}
function gaussian(random){return Math.sqrt(-2*Math.log(Math.max(.000001,1-random())))*Math.cos(2*Math.PI*random());}
export class RaindropField{
 constructor(random=Math.random,satellites=config.satellites,pressure=config.pressure){this.pressureSettings=pressure;this.pressure={cluster:0,drizzle:0};this.retiring={cluster:[],drizzle:[]};this.hoverSettings=config.hoverDrops;this.hoverElapsed=0;this.hoverBirths=0;this.random=random;this.satellites=satellites;this.width=0;this.height=0;this.unit=1;this.drops={cluster:[],drizzle:[]};this.elapsed={cluster:0,drizzle:0};this.wait={cluster:config.cluster.initialInterval,drizzle:config.drizzle.initialInterval};this.pointer=null;this.focused=false;this.hover=0;}
 resize(width,height){
  if(!(width>0&&height>0))return;
  const oldWidth=this.width,oldHeight=this.height,oldUnit=this.unit;
  this.width=width;this.height=height;this.unit=Math.min(width,height)/375;
  if(oldWidth){for(const drops of [...Object.values(this.drops),...Object.values(this.retiring)])for(const drop of drops){drop.x*=width/oldWidth;drop.startY*=height/oldHeight;drop.smearDistance*=height/oldHeight;drop.size*=this.unit/oldUnit;moveDrop(drop);}}
  else for(const kind of ['cluster','drizzle'])for(let i=0;i<config[kind].initial;i++){const drop=this.spawn(kind);if(drop){drop.age=this.random()*drop.life*.3;drop.lifeAge=drop.age;moveDrop(drop);}}
 }
 setPointer(point){const before=this.pointer;this.pointer=point?{x:clamp(point.x,0,1),y:clamp(point.y,0,1)}:null;if(this.pointer&&!before&&this.width){this.emitHoverDrop(this.pointer);this.hoverElapsed=0;}}
 setFocused(value){this.focused=value;}
 spawn(kind,point=null,continuous=false){
  const settings=config[kind],random=this.random,list=this.drops[kind];if(!this.width||!this.ensureRoom(kind,continuous))return null;
  let size=(settings.minRadius+random()*(settings.maxRadius-settings.minRadius))*this.unit,x,y;
  if(point){x=clamp(point.x*this.width+(random()-.5)*18*this.unit,0,this.width);y=clamp(point.y*this.height+(random()-.5)*8*this.unit,0,this.height);}
  else if(kind==='cluster'){
   const margin=settings.safeMargin*this.unit,extent=(1+config.growth)*config.hoverScale*maximumContourRadius;
   size=Math.min(size,(Math.min(this.width,this.height)/2-margin)/extent);
   const safe=size*extent+margin;
   x=clamp(this.width/2+gaussian(random)*settings.centerSpread*this.unit,safe,this.width-safe);
   y=clamp(this.height*.45+gaussian(random)*settings.centerSpread*this.unit,safe,this.height-safe);
  }else{
   const angle=random()*Math.PI*2,distance=random()*Math.min(settings.maxDistance*this.unit,Math.hypot(this.width/2,this.height/2));
   x=clamp(this.width/2+Math.cos(angle)*distance,0,this.width);y=clamp(this.height/2+Math.sin(angle)*distance,0,this.height);
  }
  const drop=this.createDrop(kind,{x,y,size,falling:kind==='drizzle'||!!point,continuous});
  if(drop)this.spawnSatellites(kind,drop);
  return drop;
 }
 createDrop(kind,{x,y,size,falling,satellite=false,continuous=false}){
  const settings=config[kind],list=this.drops[kind],random=this.random;if(!this.ensureRoom(kind,continuous))return null;
  const smearDuration=falling?config.smear.duration:0,segments=splatResolution(size/this.unit);
  const smearDistance=falling?Math.min(((config.smear.minTravel+random()*(config.smear.maxTravel-config.smear.minTravel))*this.unit,Math.max(0,this.height-y-size))*0.01):0;
  const drop={x,y,startY:y,size,satellite,spikes:makeSplatSpikes(random,segments),age:0,lifeAge:0,fadeAge:0,life:settings.life,fade:1/config.opacityRate,falling,smearDuration,smearDistance,growthDuration:smearDuration+size*config.growth/(config.growthRate*this.unit),noise:Float32Array.from({length:segments},()=>random()*2-1),largeNoise:Float32Array.from({length:config.largeBlobSegments},()=>random()*2-1)};
  list.push(drop);return drop;
 }
 spawnSatellites(kind,parent){
  const settings=this.satellites,random=this.random;
  if(this.pressure[kind]>.6||!settings.enabled||parent.satellite||parent.size<this.unit*settings.threshold||random()>=settings.chance)return;
  const count=settings.minCount+Math.floor(random()*(settings.maxCount-settings.minCount+1));
  for(let i=0;i<count&&this.drops[kind].length<this.activeLimit(kind);i++){
   const size=clamp(parent.size*(settings.minScale+random()*(settings.maxScale-settings.minScale)),settings.minRadius*this.unit,settings.maxRadius*this.unit);
   const angle=(i/count+random()*.2)*Math.PI*2,distance=parent.size*(1+config.growth)*(settings.minDistance+random()*(settings.maxDistance-settings.minDistance));
   const x=parent.x+Math.cos(angle)*distance,y=parent.y+Math.sin(angle)*distance,extent=size*(1+config.growth)*config.hoverScale*maximumContourRadius;
   // Skip out-of-frame candidates instead of moving them away from their parent.
   if(x<extent||x+extent>this.width||y<extent||y+extent>this.height)continue;
   this.createDrop(kind,{x,y,size,falling:parent.falling,satellite:true});
  }
 }
 activeLimit(kind){return config[kind].limit-(this.pressureSettings.enabled?this.pressureSettings.reserve:0);}
 ensureRoom(kind,continuous=false){
  if(this.drops[kind].length<this.activeLimit(kind))return true;
  const settings=this.pressureSettings;
  if(!continuous||!settings.enabled||this.retiring[kind].length>=settings.reserve)return false;
  const list=this.drops[kind];let oldest=0;
  for(let i=1;i<list.length;i++){const a=dropFrame(list[i]).opacity,b=dropFrame(list[oldest]).opacity;if(a<b||a===b&&list[i].age>list[oldest].age)oldest=i;}
  const [drop]=list.splice(oldest,1);drop.retireStart=dropFrame(drop).opacity;drop.retireAge=0;drop.retireDuration=settings.retireMs;this.retiring[kind].push(drop);return true;
 }
 emitHoverDrop(point){
  const both=this.random()<this.hoverSettings.revealBothChance,parent=this.spawn('cluster',point,true);if(!parent)return null;
  parent.revealMode=both?'both':'pencil';this.hoverBirths++;
  if(both){
   const twin=this.createDrop('drizzle',{x:parent.x,y:parent.startY,size:parent.size,falling:parent.falling,continuous:true});
   if(twin){for(const key of ['noise','largeNoise','spikes','smearDistance','smearDuration','growthDuration'])twin[key]=parent[key];twin.revealMode='both';}
  }
  return parent;
 }
 advance(delta){
  const dt=clamp(delta,0,60),target=this.pointer||this.focused?1:0,settings=this.pressureSettings;
  this.hover=target+(this.hover-target)*Math.exp(-dt/config.rampDuration);
  for(const kind of ['cluster','drizzle']){
   const raw=settings.enabled?clamp((this.drops[kind].length/this.activeLimit(kind)-settings.startAt)/(1-settings.startAt),0,1):0;
   this.pressure[kind]+=(raw-this.pressure[kind])*(1-Math.exp(-dt/settings.rampMs));
   const holdRate=1+this.pressure[kind]*(settings.holdAcceleration-1),fadeRate=1+this.pressure[kind]*(settings.fadeAcceleration-1);
   for(const list of [this.drops[kind],this.retiring[kind]])for(const drop of list){
    const beforeAge=drop.age,beforeLife=drop.lifeAge;drop.age+=dt;drop.lifeAge+=dt*holdRate;
    const hold=Math.max(0,(drop.life-beforeLife)/holdRate,drop.growthDuration-beforeAge);
    if(hold<dt)drop.fadeAge+=(dt-hold)*fadeRate;
    if(drop.retireAge!=null)drop.retireAge+=dt;moveDrop(drop);
   }
   this.drops[kind]=this.drops[kind].filter(drop=>dropFrame(drop).opacity>0);
   this.retiring[kind]=this.retiring[kind].filter(drop=>dropFrame(drop).opacity>0);
  }
  if(target){
   this.hoverElapsed+=dt;let emitted=0;
   while(this.hoverElapsed>=this.hoverSettings.interval&&emitted++<2){this.hoverElapsed-=this.hoverSettings.interval;this.emitHoverDrop(this.pointer??{x:.5,y:.45});}
   this.elapsed.cluster=0;this.elapsed.drizzle=0;
  }else{
   this.hoverElapsed=0;
   for(const kind of ['cluster','drizzle']){
    const layer=config[kind];this.elapsed[kind]+=dt;let spawned=0;
    while(this.elapsed[kind]>=this.wait[kind]&&spawned++<3){this.elapsed[kind]-=this.wait[kind];this.spawn(kind);this.wait[kind]=Math.max(layer.hoverInterval,layer.interval+(this.random()-.5)*layer.intervalVariance);}
   }
  }
 }
}
