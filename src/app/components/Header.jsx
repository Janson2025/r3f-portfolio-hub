import { useEffect, useRef, useState } from 'react';
import Logo from './Logo.jsx';
import Nav from './Nav.jsx';
import AudioToggle from './AudioToggle.jsx';
export default function Header({ path }) {
  const [open,setOpen]=useState(false);
  const menuRef=useRef(null);
  useEffect(()=>{if(!open)return;const close=event=>{if(event.key==='Escape'){setOpen(false);menuRef.current?.focus();}};window.addEventListener('keydown',close);return ()=>window.removeEventListener('keydown',close);},[open]);
  return <header className="site-header"><div className="portfolio-container portfolio-header"><a className="brand" href="#/" aria-label="James Call home"><Logo size={28}/><span>James Call<span className="accent-dot">.</span></span></a><div className="header-controls"><AudioToggle/><button ref={menuRef} className="portfolio-menu" aria-expanded={open} aria-controls="portfolio-navigation" onClick={()=>setOpen(!open)}>Menu {open?'−':'+'}</button></div><Nav path={path} open={open} onNavigate={()=>setOpen(false)}/></div></header>;
}
