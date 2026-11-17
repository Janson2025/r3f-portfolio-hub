import { Suspense,useMemo,useRef } from 'react';
import { Canvas,useFrame,useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Box3,Color,Vector3 } from 'three';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { helixItemX,helixPosition,ribbonFrontDepth,ribbonSpeed,ribbonTransform,helixTangent } from '../../../features/home/modelRibbon.js';
import { orientationQuaternion } from '../../../features/home/ribbonOrientation.js';
import { ribbonConfig } from '../../../features/home/ribbonConfig.js';
import { useTheme } from '../../../lib/themes/useTheme.js';
import SceneErrorBoundary from '../SceneErrorBoundary.jsx';
import HelixBand from './HelixBand.jsx';
import RibbonLabel from './RibbonLabel.jsx';
function Model({item,onReady,transform}){
 const {scene}=useGLTF(item.url);const rendered=useRef(0),{invalidate}=useThree();
 useFrame(()=>{if(rendered.current<3){rendered.current++;if(rendered.current===3)onReady(item.id);else invalidate();}});
 const {model,scale,center}=useMemo(()=>{const model=clone(scene);model.updateMatrixWorld(true);const bounds=new Box3().setFromObject(model),size=bounds.getSize(new Vector3());return {model,scale:ribbonConfig.modelSize/Math.max(size.x,size.y,size.z),center:bounds.getCenter(new Vector3()).negate().toArray()};},[scene]);
 return <group position={transform.position} rotation={transform.rotation} scale={transform.scale}><group scale={scale}><group position={center}><primitive object={model} dispose={null}/></group></group></group>;
}
function Helix({strands,playing,hover,onModelReady,onItemEnter,onItemLeave,onActivate,theme}){
 const models=useRef({}),labels=useRef({}),time=useRef(0),speed=useRef(1),{viewport,camera}=useThree();
 const transforms=useMemo(()=>Object.fromEntries(strands.flat().map(item=>[item.id,ribbonTransform(item)])),[strands]);
 useFrame((_,delta)=>{
  speed.current=ribbonSpeed(speed.current,!!(hover.current.pointer||hover.current.focus),delta);
  if(playing)time.current+=Math.min(delta,.05)*speed.current;
  strands.forEach((items,strand)=>items.forEach((item,index)=>{
   const transform=transforms[item.id],x=helixItemX(index,items.length,viewport.width,time.current,strand),p=helixPosition(x,viewport.width,time.current,strand),label=helixPosition(x+ribbonConfig.label.offsetX,viewport.width,time.current,strand);
   const radius=ribbonConfig.modelSize*transform.scale*Math.sqrt(3)/2+Math.hypot(...transform.position);
   const modelDepth=ribbonFrontDepth(x,radius,viewport.width,time.current,strand)+radius+.1;
   const labelDepth=ribbonFrontDepth(label.x,ribbonConfig.label.width/2,viewport.width,time.current,strand)+.05;
   const model=models.current[item.id];
   if(model){model.position.set(p.x,p.y+Math.sin(time.current*1.7+index)*.06,modelDepth);orientationQuaternion(transform,camera.quaternion,helixTangent(x,viewport.width,time.current,strand),model.quaternion);}
   labels.current[item.id]?.position.set(label.x,label.y,labelDepth);
  }));
 },-2);
 const fill=new Color(theme.colors.canvas).lerp(new Color('#000000'),.12),second=fill.clone().lerp(new Color(theme.colors.accent),.055);
 const events=item=>({onClick:event=>{event.stopPropagation();onActivate(item);},onPointerOver:event=>{event.stopPropagation();onItemEnter(item,event);},onPointerOut:()=>onItemLeave(item.id)});
 return <><HelixBand strand={0} clock={time} fill={fill} edge={theme.colors['border-strong']}/><HelixBand strand={1} clock={time} fill={second} edge={theme.colors['border-strong']}/>{strands.map(items=>items.map(item=><group key={item.id}><group ref={node=>models.current[item.id]=node} {...events(item)}><SceneErrorBoundary fallback={null} onError={()=>onModelReady(item.id)}><Suspense fallback={null}><Model item={item} transform={transforms[item.id]} onReady={onModelReady}/></Suspense></SceneErrorBoundary></group><group ref={node=>labels.current[item.id]=node} {...events(item)}><RibbonLabel item={item} colors={theme.colors}/></group></group>))}</>;
}
export default function ModelRibbonScene(props){
 const theme=useTheme();return <Canvas orthographic camera={{position:[0,0,12],zoom:65,near:.1,far:40}} dpr={[1,1.25]} gl={{alpha:true}} frameloop={props.playing?'always':'demand'} onPointerLeave={()=>props.onItemLeave()} aria-label="Two intertwining ribbons. Select a model or its label to view its project or offering."><ambientLight intensity={1.6}/><directionalLight position={[3,5,5]} intensity={2.2}/><Helix {...props} theme={theme}/></Canvas>;
}
