import { lazy,Suspense,useCallback,useEffect,useMemo,useRef,useState } from 'react';
import { supportsWebGL } from '../../../lib/webgl.js';
import { useIntroductionPlayback } from '../../../features/about/useIntroductionPlayback.js';
import { bubbleSchedule,visibleBubbles } from '../../../features/about/bubbles.js';
import { biographyTopics } from '../../../features/about/topics.js';
import { playSound } from '../../../lib/audio.js';
import SceneErrorBoundary from '../SceneErrorBoundary.jsx';
import LoadingCube from '../LoadingCube.jsx';
const AboutAvatarCanvas=lazy(()=>import('./AboutAvatarCanvas.jsx'));
export default function AvatarIntroduction({text,topics=biographyTopics,floating=false,compact=false}){
 const [available,setAvailable]=useState(null),[ready,setReady]=useState(false),[message,setMessage]=useState({id:'bio',title:'About me',text});
 const interaction=useRef({inside:false,x:0,y:0,pokeId:0,action:'neutral'});
 const speech=useIntroductionPlayback(message.text,ready,false,message.id),schedule=useMemo(()=>bubbleSchedule(speech.timeline),[speech.timeline]),bubbles=visibleBubbles(schedule,speech.timeline,speech.elapsedMs);
 const onReady=useCallback(()=>setReady(true),[]),unavailable=useCallback(()=>setAvailable(false),[]);
 useEffect(()=>setAvailable(supportsWebGL()),[]);useEffect(()=>{if(available===false)speech.showAll();},[available,speech.showAll]);
 const poke=useCallback(()=>{speech.showAll();interaction.current.pokeId++;playSound('poke');},[speech.showAll]);
 const explain=topic=>{speech.showAll();setMessage({id:`${topic.id}:${Date.now()}`,title:topic.title,text:topic.text});};
 const fallback=<p className="avatar-unavailable">The animated introduction is unavailable. The complete biography is available alongside it.</p>;
 return <section className={`avatar-conversation${floating?' avatar-conversation--float':''}${compact?' avatar-conversation--compact':''}`} aria-label="James’s introduction">
  <div className="avatar-question-strip" role="group" aria-label="Questions for James">{[{id:'intro',title:'About me',text},...topics].map(topic=><button key={topic.id} onClick={()=>explain(topic)}>{topic.title} <span aria-hidden="true">↗</span></button>)}</div>
  <div className="avatar-stage"><div className="about-avatar-environment">{available?<SceneErrorBoundary fallback={fallback} onError={unavailable}><Suspense fallback={null}><AboutAvatarCanvas timeline={speech.timeline} playback={speech.playback} interaction={interaction} reducedMotion={false} onPoke={poke} onReady={onReady} onUnavailable={unavailable}/></Suspense></SceneErrorBoundary>:available===false?fallback:null}{available!==false&&!ready&&<div className="avatar-loading-overlay"><LoadingCube label="Preparing James’s introduction…" delay={500}/></div>}</div>
   <div className="speech-bubbles" aria-hidden="true">{bubbles.map(bubble=><div key={`${message.id}:${bubble.id}`} className={`speech-bubble speech-bubble--${bubble.id%3}`} style={{opacity:bubble.opacity}}>{bubble.text}</div>)}</div>
  </div><p className="introduction-note">Select a question to change the conversation. Voice narration is being explored.</p>
  {message.id!=='bio'&&<p className="visually-hidden" aria-live="polite">{message.title}. {message.text}</p>}
  {!floating&&<div className="avatar-full-biography portfolio-prose"><h2>About me</h2><p>{text}</p></div>}
 </section>;
}
