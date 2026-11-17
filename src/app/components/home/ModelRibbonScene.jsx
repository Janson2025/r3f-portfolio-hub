import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, useGLTF } from '@react-three/drei';
import { Box3, Vector3 } from 'three';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { ribbonPosition } from '../../../features/home/modelRibbon.js';
import SceneErrorBoundary from '../SceneErrorBoundary.jsx';

function Model({item,onReady}){
 const {scene}=useGLTF(item.url);
 const rendered=useRef(0);const {invalidate}=useThree();
 useFrame(()=>{if(rendered.current<3){rendered.current++;if(rendered.current===3)onReady(item.id);else invalidate();}});
 const {model,scale,center}=useMemo(()=>{const model=clone(scene);model.updateMatrixWorld(true);const bounds=new Box3().setFromObject(model),size=bounds.getSize(new Vector3());return {model,scale:1.25/Math.max(size.x,size.y,size.z),center:bounds.getCenter(new Vector3()).negate().toArray()};},[scene]);
 return <group rotation={item.rotation??[.1,.35,0]} scale={scale}><group position={center}><primitive object={model} dispose={null}/></group></group>;
}
function Ribbon({items,playing,onModelReady}){
 const models=useRef([]),labels=useRef([]),time=useRef(0);const {viewport}=useThree();
 useFrame((_,delta)=>{
  if(playing)time.current+=Math.min(delta,.05);
  const travelWidth=Math.max(viewport.width,15);
  items.forEach((item,index)=>{const phase=index/items.length+time.current*.022;
   const p=ribbonPosition(phase,travelWidth,time.current),label=ribbonPosition(phase+1.9/(travelWidth+2),travelWidth,time.current);
   if(models.current[index]){models.current[index].position.set(p.x,p.y,0);models.current[index].rotation.y=Math.sin(time.current*.6+index)*.22;}
   if(labels.current[index])labels.current[index].position.set(label.x,label.y,0);
  });
 });
 return <>{items.map((item,index)=><group key={item.id}><group ref={node=>models.current[index]=node}><SceneErrorBoundary fallback={null} onError={()=>onModelReady(item.id)}><Suspense fallback={null}><Model item={item} onReady={onModelReady}/></Suspense></SceneErrorBoundary></group><group ref={node=>labels.current[index]=node}><Html center><a className="ribbon-technology" href={item.href}><span>{item.technology}</span><small>{item.title} ↗</small></a></Html></group></group>)}</>;
}
export default function ModelRibbonScene({items,playing,onModelReady}){
 return <Canvas orthographic camera={{position:[0,0,10],zoom:65}} dpr={[1,1.25]} gl={{alpha:true}} frameloop={playing?'always':'demand'} aria-label="Looping models and technology examples"><ambientLight intensity={1.6}/><directionalLight position={[3,5,5]} intensity={2.2}/><Ribbon items={items} playing={playing} onModelReady={onModelReady}/></Canvas>;
}
