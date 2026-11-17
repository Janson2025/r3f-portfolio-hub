import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import SceneErrorBoundary from '../SceneErrorBoundary.jsx';
import LoadingCube from '../LoadingCube.jsx';
import { supportsWebGL } from '../../../lib/webgl.js';
import ProjectNavigationArrows from '../../project/scene/ProjectNavigationArrows.jsx';
import { workspacePlace } from '../../../lib/placeMemory.js';
import { shouldEnterIdle } from '../../../features/projects/interactionPolicy.js';
const importSceneRoot=()=>import('../../project/scene/SceneRoot.jsx');
export default function ProjectCubePanel({projects,selection,onSelect,onActivate,overlayOpen}){
 const [available,setAvailable]=useState(null),[attempt,setAttempt]=useState(0),[ready,setReady]=useState(false),[navigation,setNavigation]=useState(null),[frame,setFrame]=useState(null),[transitioning,setTransitioning]=useState(true),[mode,setMode]=useState(()=>{const p=workspacePlace();return p.href===location.hash&&p.mode==='cube'?'cube':'project';}),[idle,setIdle]=useState(false);
 const panel=useRef(null),latest=useRef({}),wheel=useRef({at:0,delta:0,lastStep:0}),lastActivity=useRef(performance.now()),recoveries=useRef(0);
 const SceneRoot=useMemo(()=>lazy(importSceneRoot),[attempt]);
 latest.current={projects,selection,onSelect,overlayOpen,mode};
 useEffect(()=>{lastActivity.current=performance.now();setIdle(false);},[overlayOpen]);
 useEffect(()=>{setAvailable(supportsWebGL());},[attempt]);
 const changeReady=useCallback(value=>setReady(value),[]);
 const unavailable=useCallback(()=>{setReady(false);if(recoveries.current++<2){setAttempt(n=>n+1);setTransitioning(true);}else setAvailable(false);},[]);
 useEffect(()=>{if(mode==='project')setTransitioning(true);if(selection.source.startsWith('list-')){setMode('project');setIdle(false);lastActivity.current=performance.now();}},[selection.id,selection.sequence,selection.source]);
 useEffect(()=>{
  const element=panel.current.closest('.project-workspace')??panel.current;
  const activity=()=>{lastActivity.current=performance.now();setIdle(false);};
  const interval=setInterval(()=>{if(shouldEnterIdle(performance.now()-lastActivity.current,document.hidden,latest.current.overlayOpen)){setMode('cube');setIdle(true);}},1000);
  const visibility=()=>{lastActivity.current=performance.now();setIdle(false);};
  for(const type of ['pointermove','pointerdown','wheel','keydown','touchstart'])element.addEventListener(type,activity,{passive:true});
  document.addEventListener('visibilitychange',visibility);
  return()=>{clearInterval(interval);for(const type of ['pointermove','pointerdown','wheel','keydown','touchstart'])element.removeEventListener(type,activity);document.removeEventListener('visibilitychange',visibility);};
 },[]);
 useEffect(()=>{
  const element=panel.current;
  const handle=event=>{
   const state=latest.current;if(state.mode!=='project'||event.ctrlKey||event.metaKey||state.overlayOpen||!available||event.target.closest('button,a,input,select'))return;
   const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?element.clientHeight:1);if(!delta||state.projects.length<2)return;
   event.preventDefault();const now=performance.now(),w=wheel.current;if(now-w.at>180||Math.sign(delta)!==Math.sign(w.delta))w.delta=0;w.at=now;w.delta+=delta;
   if(Math.abs(w.delta)<65||now-w.lastStep<240)return;w.delta=0;w.lastStep=now;
   const index=state.projects.findIndex(p=>p.id===state.selection.id),next=(index+Math.sign(delta)+state.projects.length)%state.projects.length;state.onSelect(state.projects[next].id,'cube-wheel');
  };element.addEventListener('wheel',handle,{passive:false});return()=>element.removeEventListener('wheel',handle);
 },[available]);
 useEffect(()=>{if(!available||ready)return;const timeout=setTimeout(unavailable,15000);return()=>clearTimeout(timeout);},[available,ready,attempt,unavailable]);
 const selectCube=(id,source)=>{setIdle(false);setMode('project');setTransitioning(true);onSelect(id,source);};
 const active=projects.find(p=>p.id===selection.id),loading=available===null||(available&&!ready);
 const fallback=<div className="project-cube-fallback" role="status"><h2>3D is unavailable here.</h2><p>Every project and demo remains available in the list.</p><button className="portfolio-button secondary" onClick={()=>{recoveries.current=0;setAvailable(null);setAttempt(n=>n+1);}}>Retry 3D</button></div>;
 return <section ref={panel} className="project-cube-panel" aria-label="Interactive project cube" data-view-mode={mode} data-scene-ready={ready&&!transitioning}>
  {available?<SceneErrorBoundary key={attempt} fallback={fallback} onError={unavailable}><Suspense fallback={null}><SceneRoot mode={mode} idle={idle} selection={selection} eligibleIds={projects.map(p=>p.id)} onSelect={selectCube} onActivate={onActivate} disabled={overlayOpen} onUnavailable={unavailable} onReadyChange={changeReady} onNavigationChange={setNavigation} onFrameChange={setFrame} onTransitionChange={setTransitioning}/></Suspense></SceneErrorBoundary>:available===false?fallback:null}
  {loading&&<div className={`scene-loading-layer${ready?' is-transitioning':''}`}><LoadingCube label={ready?'Moving to your project…':'Preparing the project cube…'} delay={ready?500:200}/></div>}
  {available&&<button className="cube-mode-button" disabled={!ready||transitioning||overlayOpen} onClick={()=>{setIdle(false);setTransitioning(true);setMode(m=>m==='project'?'cube':'project');}}>{mode==='project'?'Cube view':'Project view'} <span aria-hidden="true">↗</span></button>}
  {ready&&mode==='project'&&selection.id&&<ProjectNavigationArrows navigation={navigation} frame={frame} onNavigate={onSelect} disabled={transitioning||overlayOpen}/>}
  {ready&&mode==='project'&&frame&&active&&!transitioning&&<button key={active.id} className="focused-project-title" style={{left:(frame.left+frame.right)/2,top:Math.min(frame.height-72,frame.bottom-18),maxWidth:Math.min(330,frame.width*.57)}} onClick={()=>onActivate(active.id)} disabled={overlayOpen}><span className="project-title-label">{active.title}</span><span aria-hidden="true">↗</span></button>}
 </section>;
}
