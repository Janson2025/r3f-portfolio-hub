import { useCallback, useEffect, useRef, useState } from 'react';
import { getProjects } from '../../../../features/projects/queries.js';
import { useRoute } from '../../../../lib/useRoute.js';
import { replaceRoute } from '../../../../lib/routing.js';
import { overlayHref, resolveOverlayProject } from '../../../../lib/overlay.js';
import { safeExternalUrl } from '../../../../lib/urls.js';
import pubsub from '../../shared/pubsub.js';

export default function useOverlayController() {
  const route=useRoute();
  const project=resolveOverlayProject(window.location.hash,getProjects());
  const projectSlug=project?.id??null;
  const targetUrl=project?.links.find(link=>link.kind==='demo')?.url??null;
  const targetOrigin=targetUrl?new URL(targetUrl).origin:'';
  const visible=Boolean(project);
  const [ready,setReady]=useState(false);
  const previousTitle=useRef(null);
  const hide=useCallback(()=>{
    setReady(false);
    if(window.history.state?.portfolioOverlay) window.history.back();
    else { const values = Object.fromEntries(route.params); delete values.project; replaceRoute('/projects',{...values,focus:projectSlug}); }
  },[projectSlug,route.params.toString()]);
  const show=useCallback(input=>{
    const href=safeExternalUrl(typeof input==='string'?input:input?.href);
    const entry=getProjects().find(p=>p.links.some(link=>link.kind==='demo'&&link.url===href));
    if(!entry||!href) return;
    setReady(false);
    const values = Object.fromEntries(route.params);
    window.history.pushState({portfolioOverlay:true},'',overlayHref(entry.id, values));
    window.dispatchEvent(new Event('portfolio:navigate'));
  },[route.params.toString()]);
  useEffect(()=>{
    setReady(false);
    document.documentElement.classList.toggle('portal-open',visible);
    const root=document.getElementById('root');
    if(root) root.inert=visible;
    pubsub.emit('overlay:change',{visible,href:targetUrl,slug:projectSlug,title:project?.title});
    if(visible) {previousTitle.current=document.title;document.title=`${project.title} — James Call`;}
    return ()=>{
      document.documentElement.classList.remove('portal-open');
      if(root) root.inert=false;
      pubsub.emit('overlay:change',{visible:false});
      if(previousTitle.current) {document.title=previousTitle.current;previousTitle.current=null;}
    };
  },[visible,targetUrl,projectSlug,project?.title]);
  useEffect(()=>{
    if(!visible) return;
    const onKey=event=>{if(event.key==='Escape') hide();};
    window.addEventListener('keydown',onKey);
    return ()=>window.removeEventListener('keydown',onKey);
  },[visible,hide]);
  // Reading route also subscribes this hook to Back/Forward and hash updates.
  void route;
  return {visible,ready,setReady,targetUrl,targetOrigin,projectSlug,projectTitle:project?.title,show,hide,controlsDisabled:visible};
}
