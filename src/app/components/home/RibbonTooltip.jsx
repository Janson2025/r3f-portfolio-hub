import { useLayoutEffect,useRef,useState } from 'react';
import { createPortal } from 'react-dom';
import { ribbonTooltipPosition } from '../../../features/home/modelRibbon.js';
export default function RibbonTooltip({preview,id}){
 const element=useRef(null),[placement,setPlacement]=useState(null);
 useLayoutEffect(()=>{
  const box=element.current.getBoundingClientRect();
  setPlacement({...ribbonTooltipPosition(preview,{width:innerWidth,height:innerHeight},box),preview});
 },[preview]);
 const {item}=preview,positioned=placement?.preview===preview;
 // Never paint a portal at a provisional origin, even on a changed hover target.
 const style={left:placement?.left??preview.x,top:placement?.top??preview.y,visibility:positioned?'visible':'hidden'};
 return createPortal(<div id={id} ref={element} role="tooltip" className="ribbon-project-tooltip" style={style}>{item.image?<img src={item.image} alt=""/>:<div className="ribbon-tooltip-monogram" aria-hidden="true">{item.title.slice(0,2)}</div>}<span className="ribbon-tooltip-kind">{item.kind==='product'?'Product':item.kind==='service'?'Service':'Project'}</span><strong>{item.title}</strong><p>{item.summary}</p></div>,document.body);
}
