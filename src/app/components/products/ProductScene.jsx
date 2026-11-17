import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, OrbitControls, useGLTF, useEnvironment } from '@react-three/drei';
import { AnimationMixer,Box3,LoopRepeat,Vector3 } from 'three';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { ownInspectorMaterials,applyInspectorMode } from '../../../features/products/inspector.js';
import { swimOffset } from '../../../features/products/swim.js';
import SceneErrorBoundary from '../SceneErrorBoundary.jsx';
import { Suspense } from 'react';

export function resetProductAssets(product){useGLTF.clear(product.model);useEnvironment.clear?.({files:product.environment});}
function RendererStatus({onReady,onLost,onFailure}){
 const {gl,invalidate}=useThree(),frames=useRef(0),timer=useRef(null);
 useFrame(()=>{if(!gl.getContext().isContextLost()&&frames.current<3){frames.current++;if(frames.current===3)onReady();else invalidate();}});
 useEffect(()=>{const canvas=gl.domElement;const lost=event=>{event.preventDefault();frames.current=0;onLost();clearTimeout(timer.current);timer.current=setTimeout(onFailure,4500);};const restored=()=>{clearTimeout(timer.current);frames.current=0;invalidate();};canvas.addEventListener('webglcontextlost',lost);canvas.addEventListener('webglcontextrestored',restored);return()=>{clearTimeout(timer.current);canvas.removeEventListener('webglcontextlost',lost);canvas.removeEventListener('webglcontextrestored',restored);};},[gl,invalidate,onReady,onLost,onFailure]);
 return null;
}
function Fish({product,playing,mode,onReady}){
 const {scene,animations}=useGLTF(product.model),group=useRef(null),time=useRef(0),frames=useRef(0),actions=useRef([]),pending=useRef(new Map());const {invalidate}=useThree();
 const resource=useMemo(()=>{const model=clone(scene);model.updateMatrixWorld(true);const bounds=new Box3().setFromObject(model),size=bounds.getSize(new Vector3()),owned=ownInspectorMaterials(model),deform=[];if(!animations.length)model.traverse(mesh=>{if(mesh.isMesh&&mesh.geometry?.attributes.position){mesh.geometry=mesh.geometry.clone();deform.push({geometry:mesh.geometry,base:mesh.geometry.attributes.position.array.slice(),min:bounds.min.z,max:bounds.max.z});}});return{model,owned,deform,scale:2.4/Math.max(size.x,size.y,size.z),center:bounds.getCenter(new Vector3()).negate().toArray()};},[scene,animations]);
 const mixer=useMemo(()=>new AnimationMixer(resource.model),[resource]);
 useEffect(()=>{actions.current=animations.map(clip=>mixer.clipAction(clip).setLoop(LoopRepeat,Infinity).play());return()=>{mixer.stopAllAction();mixer.uncacheRoot(resource.model);actions.current=[];};},[mixer,resource,animations]);
 useEffect(()=>{applyInspectorMode(resource.owned,mode);invalidate();},[resource,mode,invalidate]);
 useEffect(()=>{pending.current.delete(resource);return()=>{const token={};pending.current.set(resource,token);queueMicrotask(()=>{if(pending.current.get(resource)!==token)return;resource.owned.dispose();resource.deform.forEach(x=>x.geometry.dispose());resource.model.traverse(x=>{if(x.isSkinnedMesh)x.skeleton?.dispose();});pending.current.delete(resource);});};},[resource]);
 useFrame((_,raw)=>{if(frames.current<3){frames.current++;if(frames.current===3)onReady();else invalidate();}if(!playing)return;const delta=Math.min(raw,.05);mixer.update(delta);time.current+=delta;for(const item of resource.deform){const attribute=item.geometry.attributes.position;for(let i=0;i<item.base.length;i+=3)attribute.array[i]=item.base[i]+swimOffset(item.base[i+2],item.min,item.max,time.current);attribute.needsUpdate=true;}if(group.current){group.current.position.y=Math.sin(time.current*1.2)*.065;group.current.rotation.y=Math.sin(time.current*.8)*.12;group.current.rotation.z=Math.sin(time.current*1.2)*.025;}});
 return <group ref={group}><group scale={resource.scale}><group position={resource.center}><primitive object={resource.model} dispose={null}/></group></group></group>;
}
export default function ProductScene({product,playing,angle=0,mode='render',onReady,onLost,onFailure,onModelReady,onEnvironmentError}){
 return <Canvas dpr={[1,1.25]} frameloop={playing?'always':'demand'} camera={{position:[3.8,.3,1.2],fov:40}} tabIndex={0} aria-label="Moore Idol model inspector. Drag to orbit or use the rotation slider.">
  <color attach="background" args={[mode==='wireframe'?'#d8dfe6':'#06445a']}/>
  <SceneErrorBoundary fallback={null} onError={onEnvironmentError}><Suspense fallback={null}><Environment files={product.environment} background={mode==='render'} backgroundBlurriness={.12} environmentIntensity={.8}/></Suspense></SceneErrorBoundary>
  <ambientLight intensity={.65}/><directionalLight position={[3,5,4]} intensity={2.2}/>
  <RendererStatus onReady={onReady} onLost={onLost} onFailure={onFailure}/>
  <group rotation={[0,angle,0]}><Suspense fallback={null}><Fish product={product} playing={playing} mode={mode} onReady={onModelReady}/></Suspense></group>
  <OrbitControls makeDefault enablePan={false} minDistance={2.6} maxDistance={6} enableDamping={playing}/>
 </Canvas>;
}
