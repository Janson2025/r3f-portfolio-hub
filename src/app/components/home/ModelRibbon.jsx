import { lazy,Suspense,useCallback,useEffect,useId,useRef,useState } from 'react';
import { chooseRibbonStrands,resolveRibbonPreview } from '../../../features/home/modelRibbon.js';
import { getProjects } from '../../../features/projects/queries.js';
import { products,services } from '../../../data/offerings.js';
import { capturePlace } from '../../../lib/placeMemory.js';
import { supportsWebGL } from '../../../lib/webgl.js';
import SceneErrorBoundary from '../SceneErrorBoundary.jsx';
import LoadingCube from '../LoadingCube.jsx';
import RibbonTooltip from './RibbonTooltip.jsx';
const ModelRibbonScene=lazy(()=>import('./ModelRibbonScene.jsx'));
const catalog={projects:getProjects(),products,services};
const sessionStrands=chooseRibbonStrands().map(items=>items.map(item=>resolveRibbonPreview(item,catalog))),sessionModels=sessionStrands.flat();
export default function ModelRibbon(){
 const [available,setAvailable]=useState(false),[visible,setVisible]=useState(false),[failed,setFailed]=useState(false),[loaded,setLoaded]=useState([]),[preview,setPreview]=useState(null);
 const host=useRef(null),hover=useRef({pointer:null,focus:null}),tooltipId=useId();
 const clear=useCallback(()=>{hover.current={pointer:null,focus:null};setPreview(null);},[]);
 const enter=useCallback((item,event)=>{const pointer=event.nativeEvent??event;if(pointer.pointerType==='touch')return;hover.current.pointer=item.id;setPreview({item,x:pointer.clientX,y:pointer.clientY,source:'pointer'});},[]);
 const leave=useCallback(id=>{if(!id||hover.current.pointer===id)hover.current.pointer=null;setPreview(previous=>previous?.source==='pointer'&&(!id||previous.item.id===id)?null:previous);},[]);
 const focus=(item,event)=>{const r=event.currentTarget.getBoundingClientRect();hover.current.focus=item.id;setPreview({item,x:r.left,y:r.bottom,source:'focus'});};
 const blur=item=>{if(hover.current.focus===item.id)hover.current.focus=null;setPreview(previous=>previous?.source==='focus'&&previous.item.id===item.id?null:previous);};
 const activate=useCallback(item=>{clear();capturePlace();location.assign(item.href);},[clear]);
 useEffect(()=>{
  setAvailable(supportsWebGL());let intersecting=false;
  const update=()=>{const active=intersecting&&!document.hidden;setVisible(active);if(!active)clear();};
  const observer=new IntersectionObserver(([entry])=>{intersecting=entry.isIntersecting;update();});observer.observe(host.current);
  const key=event=>{if(event.key==='Escape')setPreview(null);};
  document.addEventListener('visibilitychange',update);window.addEventListener('blur',clear);window.addEventListener('scroll',clear,{passive:true});window.addEventListener('keydown',key);window.addEventListener('resize',clear);
  return()=>{observer.disconnect();document.removeEventListener('visibilitychange',update);window.removeEventListener('blur',clear);window.removeEventListener('scroll',clear);window.removeEventListener('keydown',key);window.removeEventListener('resize',clear);};
 },[clear]);
 const modelReady=useCallback(id=>setLoaded(items=>items.includes(id)?items:[...items,id]),[]);
 const links=<div className={`ribbon-links${available&&!failed?' ribbon-links--accessible':''}`} aria-label="Models and project examples">{sessionModels.map(item=><a key={item.id} href={item.href} aria-describedby={preview?.item.id===item.id?tooltipId:undefined} onFocus={event=>focus(item,event)} onBlur={()=>blur(item)} onPointerEnter={event=>enter(item,event)} onPointerLeave={()=>leave(item.id)} onClick={clear}>{item.title}<span>{item.technology}</span></a>)}</div>;
 return <section className="home-model-ribbon" ref={host} aria-label="Two intertwining ribbons of models and technologies" onPointerLeave={()=>leave()}><div className="portfolio-container ribbon-heading"><p className="overline">A FEW DIMENSIONS TO EXPLORE</p></div><div className="model-ribbon-viewport" data-item-hovered={preview?.source==='pointer'||undefined}>{available&&!failed&&<SceneErrorBoundary fallback={null} onError={()=>{setFailed(true);clear();}}><Suspense fallback={null}><ModelRibbonScene strands={sessionStrands} playing={visible} hover={hover} onItemEnter={enter} onItemLeave={leave} onActivate={activate} onModelReady={modelReady}/></Suspense></SceneErrorBoundary>}{(!available||failed)&&links}{available&&!failed&&loaded.length<sessionModels.length&&<div className="ribbon-loading-overlay"><LoadingCube label="Preparing a few ideas..." delay={500}/></div>}<div className="ribbon-edge ribbon-edge--left" aria-hidden="true"/><div className="ribbon-edge ribbon-edge--right" aria-hidden="true"/></div>{available&&!failed&&links}{preview&&<RibbonTooltip preview={preview} id={tooltipId}/>}</section>;
}
