import { portraitRevealConfig as config } from './portraitRevealConfig.js';
import { containRect,dropFrame,RaindropField } from './revealMath.js';
import { splatContourRadius,maximumContourRadius } from './splatShape.js';
const angleTables=new Map();
function anglesFor(count){if(!angleTables.has(count))angleTables.set(count,Array.from({length:count},(_,i)=>[Math.cos(i/count*Math.PI*2),Math.sin(i/count*Math.PI*2)]));return angleTables.get(count);}
function eraseDrops(ctx,drops,hover){
 ctx.globalCompositeOperation='destination-out';
 for(const drop of drops){
  const {radius,opacity,smear,progress}=dropFrame(drop,hover);if(opacity<=0)continue;
  ctx.save();ctx.globalAlpha=opacity;ctx.translate(drop.x,drop.y-smear/2);ctx.scale(1,1+smear/(2*radius));ctx.beginPath();
  anglesFor(drop.noise.length).forEach(([cos,sin],i)=>{const r=radius*splatContourRadius(drop,i,progress);i?ctx.lineTo(cos*r,sin*r):ctx.moveTo(cos*r,sin*r);});ctx.closePath();
  const gradient=ctx.createRadialGradient(0,0,radius*config.gradientInnerStop,0,0,radius*maximumContourRadius);gradient.addColorStop(0,'#000');gradient.addColorStop(config.gradientInnerStop,'#000');gradient.addColorStop(config.gradientOuterStop,`rgba(0,0,0,${config.contour.edgeOpacity})`);gradient.addColorStop(1,'transparent');ctx.strokeStyle='rgba(0,0,0,.2)';ctx.lineWidth=config.contour.edgeFeather*2;ctx.lineJoin='round';ctx.stroke();ctx.fillStyle=gradient;ctx.fill();ctx.restore();
 }
 ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
}
export class PortraitMaskController{
 constructor({host,middle,top,image,getBackground}){
  this.host=host;this.middle=middle;this.top=top;this.image=image;this.getBackground=getBackground;this.contexts=[middle.getContext('2d'),top.getContext('2d')];
  if(this.contexts.some(ctx=>!ctx))throw new Error('2D portrait canvas unavailable');
  this.field=new RaindropField();this.active=false;this.frame=null;this.previous=0;
  this.resize=()=>{const box=host.getBoundingClientRect();if(!box.width||!box.height)return;this.width=box.width;this.height=box.height;const dpr=Math.min(config.maxDpr,window.devicePixelRatio||1);
   [middle,top].forEach((canvas,i)=>{canvas.width=Math.ceil(box.width*dpr);canvas.height=Math.ceil(box.height*dpr);this.contexts[i].setTransform(dpr,0,0,dpr,0,0);});this.field.resize(box.width,box.height);this.draw();};
  this.resize();this.observer=new ResizeObserver(this.resize);this.observer.observe(host);
 }
 draw(){
  if(!this.width||!this.height)return;
  const [middle,top]=this.contexts,w=this.width,h=this.height,crop=containRect(this.image.naturalWidth,this.image.naturalHeight,w,h);
  if(!crop)return;
  middle.fillStyle=this.getBackground();middle.fillRect(0,0,w,h);middle.drawImage(this.image,crop.sx,crop.sy,crop.sw,crop.sh,crop.dx,crop.dy,crop.dw,crop.dh);eraseDrops(middle,[...this.field.drops.drizzle,...this.field.retiring.drizzle],this.field.hover);
  top.fillStyle=this.getBackground();top.fillRect(0,0,w,h);eraseDrops(top,[...this.field.drops.cluster,...this.field.retiring.cluster],this.field.hover);
 }
 setPointer(point){this.field.setPointer(point);}
 setFocused(value){this.field.setFocused(value);}
 setActive(value){
  if(this.active===value)return;this.active=value;
  if(!value){cancelAnimationFrame(this.frame);this.frame=null;this.previous=0;return;}
  const tick=now=>{if(!this.active)return;if(!this.previous)this.previous=now;const dt=now-this.previous;if(dt>=1000/config.fps){this.field.advance(dt);this.draw();this.previous=now;}this.frame=requestAnimationFrame(tick);};
  this.frame=requestAnimationFrame(tick);
 }
 dispose(){this.setActive(false);this.observer.disconnect();this.contexts.forEach(ctx=>ctx.clearRect(0,0,this.width,this.height));}
}
