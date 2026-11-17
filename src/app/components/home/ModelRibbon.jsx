import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { chooseRibbonModels,ribbonBandPath } from '../../../features/home/modelRibbon.js';

import { supportsWebGL } from '../../../lib/webgl.js';
import SceneErrorBoundary from '../SceneErrorBoundary.jsx';
import LoadingCube from '../LoadingCube.jsx';
const ModelRibbonScene=lazy(()=>import('./ModelRibbonScene.jsx'));
const sessionModels=chooseRibbonModels();
export default function ModelRibbon(){
 const [available,setAvailable]=useState(false),[visible,setVisible]=useState(false),[band,setBand]=useState({width:1280,height:270});const host=useRef(null);
 useEffect(()=>{setAvailable(supportsWebGL());let intersecting=false;const update=()=>setVisible(intersecting&&!document.hidden);const observer=new IntersectionObserver(([entry])=>{intersecting=entry.isIntersecting;update();});observer.observe(host.current);document.addEventListener('visibilitychange',update);return()=>{observer.disconnect();document.removeEventListener('visibilitychange',update);};},[]);
 const [loaded,setLoaded]=useState([]);
 const modelReady=useCallback(id=>setLoaded(items=>items.includes(id)?items:[...items,id]),[]);

 useEffect(()=>{const observer=new ResizeObserver(()=>{const r=host.current.querySelector('.model-ribbon-viewport').getBoundingClientRect();setBand({width:r.width,height:r.height});});observer.observe(host.current);return()=>observer.disconnect();},[]);
 const fallback=<div className="ribbon-links">{sessionModels.map(item=><a key={item.id} href={item.href}>{item.title}<span>{item.technology}</span></a>)}</div>;
 return <section className="home-model-ribbon" ref={host}><div className="portfolio-container ribbon-heading"><p className="overline">A FEW DIMENSIONS TO EXPLORE</p></div><div className="model-ribbon-viewport"><svg className="ribbon-path-band" viewBox={`0 0 ${band.width} ${band.height}`} preserveAspectRatio="none" aria-hidden="true"><path d={ribbonBandPath(band.width,band.height)}/></svg>{available?<SceneErrorBoundary fallback={fallback} onError={()=>setLoaded(sessionModels.map(item=>item.id))}><Suspense fallback={null}><ModelRibbonScene items={sessionModels} playing={visible} onModelReady={modelReady}/></Suspense></SceneErrorBoundary>:fallback}{available&&loaded.length<sessionModels.length&&<div className="ribbon-loading-overlay"><LoadingCube label="Preparing a few ideas…" delay={500}/></div>}</div></section>;
}
