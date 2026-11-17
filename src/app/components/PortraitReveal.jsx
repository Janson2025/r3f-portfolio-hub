import { useEffect,useRef,useState } from 'react';
import { useTheme } from '../../lib/themes/useTheme.js';
import { useReducedMotion } from '../../lib/motion.jsx';
import { profile } from '../../data/profile.js';
import { portraitRevealConfig } from '../../features/portrait/portraitRevealConfig.js';
function loadPencil(src,signal){
 return new Promise((resolve,reject)=>{
  const image=new Image();
  const cleanup=()=>{image.onload=null;image.onerror=null;signal.removeEventListener('abort',abort);};
  const abort=()=>{cleanup();image.removeAttribute('src');reject(new Error('Portrait load cancelled'));};
  image.onload=()=>{cleanup();resolve(image);};image.onerror=()=>{cleanup();reject(new Error('Pencil portrait unavailable'));};
  if(signal.aborted){abort();return;}signal.addEventListener('abort',abort,{once:true});image.src=src;
 });
}
export default function PortraitReveal({className='',href,children,eager=false,cropToContent=false}){
 const host=useRef(null),artwork=useRef(null),middle=useRef(null),top=useRef(null),engine=useRef(null),pointer=useRef(null),focused=useRef(false),background=useRef('');
 const theme=useTheme(),reduced=useReducedMotion(),staticMode=reduced&&portraitRevealConfig.respectReducedMotion,[ready,setReady]=useState(false),[status,setStatus]=useState('waiting'),[panelHeight,setPanelHeight]=useState(0);background.current=theme.colors.canvas;
 useEffect(()=>{
  if(!cropToContent)return;const update=()=>{const height=Math.round(host.current.getBoundingClientRect().height);setPanelHeight(previous=>Math.abs(previous-height)>1?height:previous);};
  const observer=new ResizeObserver(update);observer.observe(host.current);update();return()=>observer.disconnect();
 },[cropToContent]);
 useEffect(()=>{
  setReady(false);if(staticMode){setStatus('reduced-motion');return;}
  const abort=new AbortController();let disposed=false,intersecting=false,started=false,timer;
  const activity=()=>{const active=intersecting&&!document.hidden;if(!active){pointer.current=null;engine.current?.setPointer(null);}engine.current?.setActive(active);};
  const prepare=async()=>{
   if(started||disposed||document.hidden)return;started=true;setStatus('loading');
   timer=setTimeout(()=>abort.abort(),12000);
   try{
    const [{PortraitMaskController},image]=await Promise.all([import('../../features/portrait/PortraitMaskController.js'),loadPencil(portraitRevealConfig.pencilImage,abort.signal)]);
    if(disposed||abort.signal.aborted)return;
    engine.current=new PortraitMaskController({host:artwork.current,middle:middle.current,top:top.current,image,getBackground:()=>background.current});
    engine.current.setPointer(pointer.current);engine.current.setFocused(focused.current);setReady(true);setStatus('ready');activity();
   }catch(error){if(!disposed){setReady(false);setStatus('error');console.warn('Portrait reveal could not initialize:',error);}}finally{clearTimeout(timer);}
  };
  const observer=new IntersectionObserver(([entry])=>{intersecting=entry.isIntersecting;if(intersecting)prepare();activity();});observer.observe(artwork.current);
  const visibility=()=>{if(!document.hidden&&intersecting)prepare();activity();};document.addEventListener('visibilitychange',visibility);
  return()=>{disposed=true;clearTimeout(timer);abort.abort();observer.disconnect();document.removeEventListener('visibilitychange',visibility);engine.current?.dispose();engine.current=null;};
 },[staticMode]);
 const move=event=>{if(event.pointerType==='touch')return;const box=artwork.current.getBoundingClientRect();pointer.current={x:(event.clientX-box.left)/box.width,y:(event.clientY-box.top)/box.height};engine.current?.setPointer(pointer.current);};
 const leave=()=>{pointer.current=null;engine.current?.setPointer(null);};
 const Root=href?'a':'div',visible=ready&&!staticMode;
 return <Root ref={host} href={href} className={`portrait-reveal ${cropToContent?'portrait-reveal--cropped':''} ${className}`} style={cropToContent?{'--portrait-panel-height':`${panelHeight||430}px`,'--portrait-ratio':portraitRevealConfig.frame.width/portraitRevealConfig.frame.height}:undefined} data-reveal-ready={visible||undefined} data-reveal-state={status} onPointerLeave={leave} onFocus={()=>{focused.current=true;engine.current?.setFocused(true);}} onBlur={()=>{focused.current=false;engine.current?.setFocused(false);}}>
  <div className="portrait-reveal-viewport"><div ref={artwork} className="portrait-reveal-artwork" style={{aspectRatio:`${portraitRevealConfig.frame.width} / ${portraitRevealConfig.frame.height}`}} onPointerEnter={move} onPointerMove={move} onPointerLeave={leave}>
  <img src={profile.image} alt="James Call" loading={eager?'eager':'lazy'} fetchPriority={eager?'high':'auto'}/>
  <canvas ref={middle} className="portrait-mask portrait-mask--pencil" aria-hidden="true" style={{visibility:visible?'visible':'hidden'}}/>
  <canvas ref={top} className="portrait-mask portrait-mask--cluster" aria-hidden="true" style={{visibility:visible?'visible':'hidden'}}/>
  </div></div>
  {children}
 </Root>;
}
