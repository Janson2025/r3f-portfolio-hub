import { useEffect,useMemo } from 'react';
import { useFrame,useThree } from '@react-three/fiber';
import { BufferGeometry,Float32BufferAttribute,DoubleSide } from 'three';
import { HELIX,helixPosition,helixSpan } from '../../../features/home/modelRibbon.js';
const segments=240;
export default function HelixBand({strand,clock,fill,edge}){
 const {viewport}=useThree();
 const geometry=useMemo(()=>{
  const body=new BufferGeometry(),upper=new BufferGeometry(),lower=new BufferGeometry(),indices=[];
  body.setAttribute('position',new Float32BufferAttribute(new Float32Array((segments+1)*6),3));
  for(let i=0;i<segments;i++){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}body.setIndex(indices);
  for(const line of [upper,lower])line.setAttribute('position',new Float32BufferAttribute(new Float32Array((segments+1)*3),3));
  return {body,upper,lower};
 },[]);
 useEffect(()=>()=>Object.values(geometry).forEach(g=>g.dispose()),[geometry]);
 useFrame(()=>{
  const span=helixSpan(viewport.width);
  for(let i=0;i<=segments;i++){
   const p=helixPosition((i/segments-.5)*span,viewport.width,clock.current,strand);
   geometry.body.attributes.position.setXYZ(i*2,p.x,p.y-HELIX.halfWidth,p.z);
   geometry.body.attributes.position.setXYZ(i*2+1,p.x,p.y+HELIX.halfWidth,p.z);
   geometry.upper.attributes.position.setXYZ(i,p.x,p.y+HELIX.halfWidth,p.z+.012);
   geometry.lower.attributes.position.setXYZ(i,p.x,p.y-HELIX.halfWidth,p.z+.012);
  }
  for(const g of Object.values(geometry))g.attributes.position.needsUpdate=true;
  geometry.body.computeBoundingSphere();
 });
 const block=event=>event.stopPropagation();
 return <group><mesh geometry={geometry.body} frustumCulled={false} onClick={block} onPointerOver={block}><meshBasicMaterial color={fill} toneMapped={false} side={DoubleSide}/></mesh>{[geometry.upper,geometry.lower].map((g,i)=><line key={i} geometry={g} frustumCulled={false} raycast={()=>null}><lineBasicMaterial color={edge} toneMapped={false}/></line>)}</group>;
}
