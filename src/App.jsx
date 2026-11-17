import { useEffect,useLayoutEffect } from 'react';
import { capturePlace,restorePage } from './lib/placeMemory.js';
import { suspendAudio,resumeAudio,disposeAudio } from './lib/audio.js';
import Header from './app/components/Header.jsx';
import Footer from './app/components/Footer.jsx';
import HomePage from './app/views/HomePage.jsx';
import ProjectsPage from './app/views/ProjectsPage.jsx';
import ProjectPage from './app/views/ProjectPage.jsx';
import AboutView from './app/views/AboutView.jsx';
import ContactPage from './app/views/ContactPage.jsx';
import OfferingsPage from './app/views/OfferingsPage.jsx';
import PrivacyPage from './app/views/PrivacyPage.jsx';
import NotFoundPage from './app/views/NotFoundPage.jsx';
import { useRoute } from './lib/useRoute.js';
import { getProject } from './features/projects/queries.js';
const titles = {'/':'Developer, Designer & Maker','/projects':'Projects','/about':'About','/contact':'Contact','/offerings':'Products & services','/privacy':'Privacy','/explore':'Explore in 3D','/admin':'Owner area'};
export default function App() {
  const {path,params}=useRoute();
  const slug=path.startsWith('/projects/') ? path.slice(10) : null;
  useEffect(()=>{
    document.title=`${slug ? getProject(slug)?.title ?? 'Project not found' : titles[path] ?? 'Page not found'} — James Call`;
    document.getElementById('main-content')?.focus({preventScroll:true});
    let robots=document.querySelector('meta[name="robots"]');
    if(!robots) { robots=document.createElement('meta'); robots.name='robots'; document.head.appendChild(robots); }
    robots.content=path.startsWith('/admin')?'noindex,nofollow':'index,follow';
  },[path,slug]);
  useLayoutEffect(()=>{restorePage();const frame=requestAnimationFrame(restorePage);return()=>cancelAnimationFrame(frame);},[path,slug]);
  useEffect(()=>{
    const click=event=>{if(event.target.closest('a[href]'))capturePlace();};
    const hide=()=>{capturePlace();suspendAudio();};
    const show=()=>{restorePage();resumeAudio();};
    const visibility=()=>{if(document.hidden)suspendAudio();else resumeAudio();};
    let scrollTimer;const scroll=()=>{clearTimeout(scrollTimer);scrollTimer=setTimeout(capturePlace,180);};window.addEventListener('scroll',scroll,{passive:true});
    document.addEventListener('click',click,true);window.addEventListener('pagehide',hide);window.addEventListener('pageshow',show);document.addEventListener('visibilitychange',visibility);
    return()=>{clearTimeout(scrollTimer);window.removeEventListener('scroll',scroll);document.removeEventListener('click',click,true);window.removeEventListener('pagehide',hide);window.removeEventListener('pageshow',show);document.removeEventListener('visibilitychange',visibility);disposeAudio();};
  },[]);
  useEffect(()=>{
    let embedded=false;
    try { embedded=window.top!==window.self; } catch { embedded=true; }
    document.documentElement.classList.toggle('in-iframe',embedded);
    return ()=>document.documentElement.classList.remove('in-iframe');
  },[]);
  let page;
  if(path==='/') page=<HomePage/>;
  else if(path==='/projects') page=<ProjectsPage params={params}/>;
  else if(slug) page=<ProjectPage slug={slug}/>;
  else if(path==='/about') page=<AboutView/>;
  else if(path==='/contact') page=<ContactPage/>;
  else if(path==='/offerings') page=<OfferingsPage/>;
  else if(path==='/privacy') page=<PrivacyPage/>;
  else if(path==='/explore') page=<ProjectsPage params={params}/>;
  else if(path==='/admin') page=<div className="portfolio-container portfolio-page portfolio-prose"><p className="overline">OWNER AREA</p><h1>Publishing, next.</h1><p>Owner editing is not enabled. This page has no authentication, private records, or content mutations. Future editing requires server-side owner checks and database policies.</p></div>;
  else page=<NotFoundPage/>;
  return <div className={`site-shell ${path==='/projects'||path==='/explore'?'site-shell--projects':''}`}><a className="portfolio-skip" href="#main-content" onClick={event=>{event.preventDefault();document.getElementById('main-content')?.focus();}}>Skip to content</a><Header path={path}/><main id="main-content" tabIndex={-1}>{page}</main><Footer/></div>;
}
