import { useEffect,useRef,useState } from 'react';
import { profile } from '../../data/profile.js';
import { copyText } from '../../lib/copyText.js';
import { safeExternalUrl } from '../../lib/urls.js';
import SocialIcon from '../components/SocialIcon.jsx';
const socials=[['github','GitHub','github'],['youtube','YouTube','youtube'],['facebook','Facebook','facebook'],['X','X','X'],['TIKTOK','TikTok','tiktok'],['linkedin','LinkedIn','linkedin']];
export default function ContactPage(){
 const [status,setStatus]=useState(''),timer=useRef(null),alive=useRef(true);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;clearTimeout(timer.current);};},[]);
 const copy=async()=>{const ok=await copyText(profile.email);if(!alive.current)return;setStatus(ok?'Email copied.':'Copy unavailable. Select the address to copy it manually.');clearTimeout(timer.current);timer.current=setTimeout(()=>setStatus(''),3000);};
 return <div className="portfolio-container portfolio-page contact-page"><header className="contact-heading"><div><p className="overline">START A CONVERSATION</p><h1>Let’s connect<span className="accent-dot">.</span></h1></div><img className="contact-profile" src={profile.image} alt="James Call"/></header><p className="page-intro">Have an interesting idea, a project, or an opportunity? Here’s where to find me.</p><section className="empty-panel contact-details"><h2>Find me online</h2>{profile.email&&<button className="copy-email" onClick={copy} aria-label={`Copy email address ${profile.email}`}><span>{profile.email}</span><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4"/></svg></button>}<p className="copy-email-status" role="status" aria-live="polite">{status}</p><nav className="contact-socials" aria-label="Social profiles">{socials.map(([key,label,icon])=>{const href=safeExternalUrl(profile[key]);return href?<a key={key} href={href} target="_blank" rel="noopener noreferrer" aria-label={`${label} (opens in a new tab)`} title={label}><SocialIcon name={icon}/></a>:null;})}</nav></section></div>;
}
