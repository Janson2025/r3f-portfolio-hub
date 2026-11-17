import { lazy,Suspense,useCallback,useEffect,useMemo,useRef,useState } from 'react';
import { useReducedMotion } from '../../../lib/motion.jsx';
import { supportsWebGL } from '../../../lib/webgl.js';
import SceneErrorBoundary from '../SceneErrorBoundary.jsx';
import LoadingCube from '../LoadingCube.jsx';
const importScene=()=>import('./ProductScene.jsx');
export default function ProductPreview({product}){
 const reduced=useReducedMotion(),region=useRef(null),menu=useRef(null),failures=useRef(0);
 const [format,setFormat]=useState(reduced?'image':'3d'),[supported,setSupported]=useState(false),[mounted,setMounted]=useState(false),[active,setActive]=useState(false),[paused,setPaused]=useState(false),[failed,setFailed]=useState(false),[attempt,setAttempt]=useState(0),[ready,setReady]=useState(false),[modelReady,setModelReady]=useState(false),[angle,setAngle]=useState(0),[mode,setMode]=useState('render'),[open,setOpen]=useState(false),[notice,setNotice]=useState('');
 const ProductScene=useMemo(()=>lazy(importScene),[attempt]);
 const onReady=useCallback(()=>setReady(true),[]),onModelReady=useCallback(()=>setModelReady(true),[]),onLost=useCallback(()=>setReady(false),[]),onEnvironmentError=useCallback(()=>setNotice('Environment image unavailable. The model can still be inspected.'),[]);
 const onFailure=useCallback(()=>{setReady(false);setModelReady(false);if(failures.current++<1)setAttempt(n=>n+1);else setFailed(true);},[]);
 useEffect(()=>{setSupported(supportsWebGL());},[]);
 useEffect(()=>{if(format==='3d'&&supported)setMounted(true);},[format,supported]);
 useEffect(()=>{let visible=false;const update=()=>setActive(visible&&!document.hidden);const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;update();},{rootMargin:'80px'});observer.observe(region.current);document.addEventListener('visibilitychange',update);return()=>{observer.disconnect();document.removeEventListener('visibilitychange',update);};},[]);
 useEffect(()=>{if(!mounted||failed||ready&&modelReady)return;const timer=setTimeout(onFailure,18000);return()=>clearTimeout(timer);},[mounted,failed,ready,modelReady,attempt,onFailure]);
 useEffect(()=>{if(!open)return;const close=e=>{if(e.key==='Escape'){setOpen(false);menu.current?.querySelector('button')?.focus();}else if(e.type==='pointerdown'&&!menu.current?.contains(e.target))setOpen(false);};window.addEventListener('keydown',close);window.addEventListener('pointerdown',close);return()=>{window.removeEventListener('keydown',close);window.removeEventListener('pointerdown',close);};},[open]);
 const retry=async()=>{setFailed(false);setReady(false);setModelReady(false);setNotice('');failures.current=0;try{const module=await importScene();module.resetProductAssets(product);}catch{}setAttempt(n=>n+1);};
 return <div className="product-preview" ref={region}>
  <div className="product-preview-media">
   {mounted&&!failed&&<div className="product-canvas-layer" hidden={format!=='3d'}><SceneErrorBoundary key={attempt} onError={onFailure} fallback={null}><Suspense fallback={null}><ProductScene product={product} playing={active&&!paused&&format==='3d'} angle={angle} mode={mode} onReady={onReady} onModelReady={onModelReady} onLost={onLost} onFailure={onFailure} onEnvironmentError={onEnvironmentError}/></Suspense></SceneErrorBoundary></div>}
   {(format!=='3d'||!supported||failed)&&<img src={format==='gif'?product.gif:product.image} alt="Moore Idol fish in black, white and yellow"/>}
   {format==='3d'&&supported&&!failed&&(!ready||!modelReady)&&<div className="product-loading-overlay"><LoadingCube label="Preparing model inspector…" delay={300}/></div>}
   {format==='3d'&&failed&&<div className="product-preview-error" role="status"><p>The 3D preview could not start. The product image and listing are still available.</p><button onClick={retry}>Retry 3D preview</button></div>}
   {format==='3d'&&supported&&!failed&&<div className="model-inspector" ref={menu}><button className="layers-button" aria-label="Model inspector" aria-expanded={open} onClick={()=>setOpen(value=>!value)}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="m3 8 9-5 9 5-9 5zM3 12l9 5 9-5M3 16l9 5 9-5"/></svg></button>{open&&<fieldset className="inspector-options"><legend>Preview mode</legend>{[['render','Render'],['wireframe','Wireframe']].map(([value,label])=><label key={value}><input type="radio" name={`preview-${product.id}`} checked={mode===value} onChange={()=>setMode(value)}/>{label}</label>)}</fieldset>}</div>}
  </div>
  <div className="product-preview-controls" aria-label="Product preview format">{[['3d','3D preview'],['gif','Animation GIF'],['image','Image']].map(([id,label])=><button key={id} disabled={id==='3d'&&!supported} aria-pressed={format===id} onClick={()=>{setFormat(id);setOpen(false);}}>{label}</button>)}{format==='3d'&&supported&&!failed&&<button onClick={()=>setPaused(value=>!value)}>{paused?'Play motion':'Pause motion'}</button>}</div>
  <p className="product-preview-note">{notice|| (format==='3d'&&supported&&!failed?'Drag to orbit · swimming animation + idle bob':format==='gif'?'Supplied animation preview':'Product thumbnail')}</p>
  {format==='3d'&&supported&&!failed&&<label className="product-rotation-slider">Rotate model <input aria-label="Rotate fish model" type="range" min="-180" max="180" step="1" value={Math.round(angle*180/Math.PI)} onChange={e=>setAngle(Number(e.target.value)*Math.PI/180)}/><output>{Math.round(angle*180/Math.PI)}°</output></label>}
 </div>;
}
