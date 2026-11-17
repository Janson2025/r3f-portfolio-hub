import { Suspense, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Avatar } from '../../project/scene/Avatar.jsx';



function AvatarCamera({ onUnavailable, playback, interaction, reducedMotion }) {
  const { camera, size, gl } = useThree();
  useEffect(() => {
    camera.position.set(0, 1.55, size.width / size.height < 0.75 ? 1.85 : 1.65);
    camera.lookAt(0, 1.48, 0); camera.updateProjectionMatrix();
  }, [camera, size.width, size.height]);
  useEffect(() => {
    const lost = event => { event.preventDefault(); onUnavailable(); };
    gl.domElement.addEventListener('webglcontextlost', lost);
    return () => gl.domElement.removeEventListener('webglcontextlost', lost);
  }, [gl, onUnavailable]);
  useFrame((_, delta) => {
    const greeting = !reducedMotion && playback.current.playing && playback.current.elapsedMs < -300;
    const narrow = size.width / size.height < 0.75;
    const action=interaction.current.action,wide=['dance','duck'].includes(action);
    const distance = wide ? 3.8 : greeting ? (narrow ? 3 : 2.6) : (narrow ? 1.85 : 1.65);
    camera.position.z += (distance - camera.position.z) * (1 - Math.exp(-7 * delta));
    camera.lookAt(greeting ? -0.14 : 0, wide ? 1 : 1.48, 0);
  });
  return null;
}

export default function AboutAvatarCanvas({ timeline, playback, interaction, reducedMotion, onPoke, onReady, onUnavailable }) {

  return <Canvas tabIndex={0} onPointerMove={event=>{const r=event.currentTarget.getBoundingClientRect();interaction.current.inside=true;interaction.current.x=Math.max(-1,Math.min(1,(event.clientX-r.left)/r.width*2-1));interaction.current.y=Math.max(-1,Math.min(1,1-(event.clientY-r.top)/r.height*2));}} onPointerLeave={()=>{interaction.current.inside=false;}} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();onPoke();}}} dpr={[1, 1.25]} gl={{ alpha: true }} camera={{ position: [0, 1.55, 1.65], fov: 32 }} aria-label="James’s animated avatar. Click the avatar, or press Enter, to surprise him.">

    <ambientLight intensity={1.3} /><hemisphereLight intensity={1.2} groundColor="#7b8a9e" />
    <directionalLight position={[2, 4, 4]} intensity={2} />
    <AvatarCamera onUnavailable={onUnavailable} playback={playback} interaction={interaction} reducedMotion={reducedMotion} />
    <Suspense fallback={null}><Avatar onPoke={onPoke} timeline={timeline} playback={playback} interaction={interaction} reducedMotion={reducedMotion} onReady={onReady} /></Suspense>
  </Canvas>;
}
