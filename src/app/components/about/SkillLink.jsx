import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
export default function SkillLink({ label, example }) {
  const id=useId(),link=useRef(null),timer=useRef(null);
  const [position,setPosition]=useState(null);
  useEffect(()=>()=>clearTimeout(timer.current),[]);
  const show=()=>{const r=link.current.getBoundingClientRect();setPosition({left:Math.max(12,Math.min(innerWidth-292,r.left)),top:r.bottom+215<innerHeight?r.bottom+10:Math.max(12,r.top-215)});};
  const hide=()=>{clearTimeout(timer.current);setPosition(null);};
  return <><a ref={link} className="about-skill-chip" href={example.href} aria-describedby={position?id:undefined} onMouseEnter={()=>{timer.current=setTimeout(show,180);}} onMouseLeave={hide} onFocus={show} onBlur={hide} onKeyDown={e=>{if(e.key==='Escape')hide();}}>{label} <span aria-hidden="true">↗</span></a>{position&&createPortal(<div id={id} className="skill-project-tooltip" role="tooltip" style={position}>{example.image&&<img src={example.image} alt=""/>}<strong>{example.title}</strong><p>{example.summary}</p></div>,document.body)}</>;
}
