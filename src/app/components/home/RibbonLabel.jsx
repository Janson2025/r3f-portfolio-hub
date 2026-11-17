import { useEffect,useMemo } from 'react';
import { CanvasTexture,SRGBColorSpace } from 'three';
import { ribbonConfig } from '../../../features/home/ribbonConfig.js';
/** A full card is pickable, including the space between its lines of text. */
export default function RibbonLabel({item,colors}){
 const texture=useMemo(()=>{
  const canvas=document.createElement('canvas');canvas.width=720;canvas.height=224;const ctx=canvas.getContext('2d');
  ctx.beginPath();ctx.roundRect(3,3,714,218,28);ctx.fillStyle=colors.surface;ctx.fill();ctx.lineWidth=3;ctx.strokeStyle=colors['border-strong'];ctx.stroke();
  ctx.textBaseline='middle';ctx.fillStyle=colors.text;ctx.font='600 46px system-ui, sans-serif';ctx.fillText(item.technology,30,81,660);
  ctx.fillStyle=colors['text-muted'];ctx.font='33px system-ui, sans-serif';ctx.fillText(item.title+' \u2197',30,153,660);
  const result=new CanvasTexture(canvas);result.colorSpace=SRGBColorSpace;return result;
 },[item,colors]);
 useEffect(()=>()=>texture.dispose(),[texture]);
 return <mesh><planeGeometry args={[ribbonConfig.label.width,ribbonConfig.label.height]}/><meshBasicMaterial map={texture} transparent alphaTest={.025} depthWrite={false} toneMapped={false}/></mesh>;
}
