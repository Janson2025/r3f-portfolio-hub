import { useEffect, useRef, useState } from 'react';
import { workspacePlace,patchWorkspace } from '../../../lib/placeMemory.js';
import { recenterLoopScroll, nearestReadingCard } from '../../../features/projects/loopScroll.js';

export default function ProjectList({ projects, selection, onSelect, onOpenProject, reducedMotion }) {
  const saved=useRef(workspacePlace()),restored=useRef(false);
  const [expanded,setExpanded]=useState(()=>new Set(saved.current.expanded??[]));
  const list=useRef(null),cards=useRef(new Map()),syncing=useRef(false),timer=useRef(null),settle=useRef(null),hover=useRef(null);
  const count=projects.length>1?(projects.length<4?7:3):1,middle=Math.floor(count/2),key=projects.map(p=>p.id).join('|');
  const latest=useRef({});latest.current={projects,selection,onSelect};
  useEffect(()=>{
    const container=list.current;
    syncing.current=true;
    const place=saved.current;restored.current=place.href===location.hash&&Number.isFinite(place.scrollTop);
    container.scrollTop=restored.current?place.scrollTop:(container.querySelector('.project-loop-group')?.offsetHeight??0)*middle;
    settle.current=setTimeout(()=>{syncing.current=false;},150);
    return()=>{clearTimeout(timer.current);clearTimeout(settle.current);clearTimeout(hover.current);};
  },[key,middle]);
  useEffect(()=>{
    const container=list.current,group=container.querySelector('.project-loop-group');
    if(!group)return;
    let previous={group:group.offsetHeight,container:container.clientHeight};
    const observer=new ResizeObserver(()=>{
      const next={group:group.offsetHeight,container:container.clientHeight};
      if(Math.abs(next.group-previous.group)<1&&Math.abs(next.container-previous.container)<1)return;
      previous=next;
      const card=cards.current.get(`${middle}:${latest.current.selection.id}`);if(!card)return;
      syncing.current=true;clearTimeout(timer.current);clearTimeout(settle.current);
      container.scrollTop+=card.getBoundingClientRect().top-container.getBoundingClientRect().top-container.clientHeight*.4+card.offsetHeight/2;
      settle.current=setTimeout(()=>{syncing.current=false;},180);
    });
    observer.observe(group);observer.observe(container);return()=>observer.disconnect();
  },[key,middle]);
  useEffect(()=>{
    if(restored.current){restored.current=false;return;}
    if(['list-scroll','list-hover','list-click'].includes(selection.source)||!selection.id)return;
    const container=list.current;
    const matches=[...cards.current.values()].filter(node=>node.dataset.projectId===selection.id);
    const bounds=container.getBoundingClientRect();
    const card=matches.sort((a,b)=>Math.abs(a.getBoundingClientRect().top-bounds.top-container.clientHeight*.4)-Math.abs(b.getBoundingClientRect().top-bounds.top-container.clientHeight*.4))[0];
    if(!card)return;
    syncing.current=true;clearTimeout(timer.current);clearTimeout(settle.current);
    container.scrollTo({top:container.scrollTop+card.getBoundingClientRect().top-bounds.top-container.clientHeight*.4+card.offsetHeight/2,behavior:reducedMotion?'instant':'smooth'});
    settle.current=setTimeout(()=>{syncing.current=false;},800);
  },[selection.id,selection.sequence,selection.source,reducedMotion]);
  function onScroll(){
    const container=list.current;
    if(syncing.current){clearTimeout(settle.current);settle.current=setTimeout(()=>{syncing.current=false;},130);return;}
    const height=container.querySelector('.project-loop-group')?.offsetHeight??0;
    const next=count>1?recenterLoopScroll(container.scrollTop,height,middle):container.scrollTop;
    if(Math.abs(next-container.scrollTop)>1)container.scrollTop=next;
    clearTimeout(timer.current);
    timer.current=setTimeout(()=>{
      const bounds=container.getBoundingClientRect();
      const values=[...cards.current.values()].map(card=>({id:card.dataset.projectId,top:card.getBoundingClientRect().top-bounds.top,height:card.offsetHeight}));
      const id=nearestReadingCard(values,container.clientHeight);
      if(id)latest.current.onSelect(id,'list-scroll');
    },90);
  }
  const activate=project=>{onSelect(project.id,'list-click');onOpenProject(project);};
  const selectHover=project=>{clearTimeout(hover.current);if(!syncing.current&&latest.current.selection.id!==project.id)hover.current=setTimeout(()=>onSelect(project.id,'list-hover'),130);};
  const interrupt=()=>{syncing.current=false;clearTimeout(settle.current);};
  return <div ref={list} className="project-reading-list" aria-label="Projects" tabIndex={0} onScroll={onScroll} onWheel={interrupt} onTouchStart={interrupt} onKeyDown={interrupt} onMouseLeave={()=>clearTimeout(hover.current)}>
    {!projects.length&&<div className="project-list-empty"><h2>No matching projects</h2><p>Try another category or technology.</p></div>}
    {Array.from({length:count},(_,copy)=><div className="project-loop-group" key={copy} aria-hidden={copy!==middle?true:undefined}>{projects.map(project=>{
      const active=selection.id===project.id,tabIndex=copy===middle?0:-1,isExpanded=expanded.has(project.id);
      return <article key={project.id} ref={node=>{const id=`${copy}:${project.id}`;if(node)cards.current.set(id,node);else cards.current.delete(id);}} className={`project-list-entry${active?' is-active':''}${isExpanded?' is-expanded':''}`} data-project-id={project.id} aria-current={active&&copy===middle?'true':undefined}
        onMouseEnter={()=>selectHover(project)} onFocusCapture={()=>{if(selection.id!==project.id)onSelect(project.id,'list-hover');}} onMouseDown={e=>{if(copy!==middle)e.preventDefault();}}
        onClick={event=>{if(!event.target.closest('a,button'))activate(project);}}>
        <div className="project-entry-overview"><button className="project-entry-thumbnail" tabIndex={tabIndex} onClick={()=>activate(project)} aria-label={`Open ${project.title}`}>{project.image?<img src={project.image} alt={project.imageAlt||project.title} loading="lazy"/>:<span aria-hidden="true">{project.title.split(' ').map(w=>w[0]).slice(0,2).join('')}</span>}</button>
          <div className="project-entry-copy"><div className="project-list-meta"><span>{project.discipline}</span>{active&&<span>On the cube</span>}</div><h2><button className="project-select-title" tabIndex={tabIndex} onClick={()=>activate(project)}>{project.title}</button></h2><div className="work-tags">{project.tags.map(tag=><span key={tag}>{tag}</span>)}</div><button className="project-more-details" tabIndex={tabIndex} aria-expanded={isExpanded} aria-controls={`summary-${copy}-${project.id}`} onClick={()=>setExpanded(previous=>{const next=new Set(previous);if(next.has(project.id))next.delete(project.id);else next.add(project.id);patchWorkspace({expanded:[...next]});return next;})}><span aria-hidden="true">{isExpanded?'⌄':'›'}</span> {isExpanded?'Less details':'More details'}</button><p id={`summary-${copy}-${project.id}`}>{project.summary}</p></div>
        </div>
      </article>;
    })}</div>)}
  </div>;
}
