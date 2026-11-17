import { useEffect, useRef } from 'react';
import { isTrustedProjectMessage } from '../../../lib/overlay.js';
export default function ProjectOverlay({targetUrl,targetOrigin,title='Project demo',projectSlug,visible,onReady,onBack}) {
  const frame=useRef(null),backButton=useRef(null),lastLink=useRef(null);
  useEffect(()=>{
    const previous=document.activeElement;
    backButton.current?.focus();
    return ()=>{window.requestAnimationFrame(()=>{if(previous?.isConnected) previous.focus({preventScroll:true});});};
  },[]);
  useEffect(()=>{
    const onMessage=event=>{
      if(!isTrustedProjectMessage(event,targetOrigin,frame.current?.contentWindow)) return;
      if(event.data.type==='project-ready') onReady?.();
      if(event.data.type==='back-from-project') onBack?.();
    };
    window.addEventListener('message',onMessage);
    return ()=>window.removeEventListener('message',onMessage);
  },[targetOrigin,onReady,onBack]);
  if(!visible||!targetUrl) return null;
  return <section className="project-demo-overlay" role="dialog" aria-modal="true" aria-label={`${title} embedded demo`}>
    <span tabIndex={0} className="visually-hidden" onFocus={()=>lastLink.current?.focus()}/>
    <div className="project-demo-toolbar"><button ref={backButton} className="portfolio-button secondary" onClick={()=>onBack?.()}>← Back to cube</button><strong>{title}</strong><a className="portfolio-link" href={`#/projects/${projectSlug}`}>Project details</a><a ref={lastLink} className="portfolio-link" href={targetUrl} target="_blank" rel="noopener noreferrer">Open demo in new tab ↗</a></div>
    <p className="demo-notice">If this site cannot be embedded, use “Open demo in new tab.” Press Escape from the hub controls to return.</p>
    <iframe ref={frame} title={`${title} live demo`} src={targetUrl} onLoad={()=>onReady?.()} loading="eager" referrerPolicy="no-referrer" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"/>
    <span tabIndex={0} className="visually-hidden" onFocus={()=>backButton.current?.focus()}/>
  </section>;
}
