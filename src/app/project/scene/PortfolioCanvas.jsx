import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { MotionContext, useMotion } from '../../../lib/motion.jsx';
import { useTheme } from "../../../lib/themes/useTheme.js";

import { Canvas } from "@react-three/fiber";


import ProjectCubeRig from "./cube/ProjectCubeRig.jsx";

function ContextLossGuard({ onUnavailable, onReadyChange }) {
  const { gl } = useThree();
  const frames=useRef(0),timer=useRef(null);
  useFrame(()=>{if(!gl.getContext().isContextLost()&&frames.current<3){frames.current++;if(frames.current===3)onReadyChange?.(true);}});
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = event => {event.preventDefault();frames.current=0;onReadyChange?.(false);clearTimeout(timer.current);timer.current=setTimeout(()=>onUnavailable?.(),4000);};
    const restored=()=>{clearTimeout(timer.current);frames.current=0;};
    canvas.addEventListener("webglcontextlost", lost);
    canvas.addEventListener('webglcontextrestored',restored);
    return () => {clearTimeout(timer.current);canvas.removeEventListener("webglcontextlost", lost);canvas.removeEventListener('webglcontextrestored',restored);};
  }, [gl, onUnavailable,onReadyChange]);
  return null;
}

export default function PortfolioCanvas({
  mode, idle, onReadyChange, onUnavailable, gridRef, cameraControlRef, selection, eligibleIds, onSelect, onActivate, disabled, onNavigationChange, onFrameChange, onTransitionChange,
}) {
  const theme = useTheme();
  const motion=useMotion();
  return (
    <Canvas
      dpr={[1, 1.25]}
      fallback={<p>WebGL is unavailable. Use the project list below.</p>}
      tabIndex={0}
      aria-label={mode === 'cube' ? 'Cube view. Drag a face to turn a slice; drag empty space to rotate the cube.' : 'Project view. Scroll to browse or use the directional arrows. Select the focused portal to open its project.'}
      camera={{
        position: [0, 1.5, 6],
        fov: 18,
      }}
      shadows
    >
      <color
        attach="background"
        args={[theme.colors["scene-background"]]}
      />

      <ambientLight intensity={0.3} />

      <directionalLight
        position={[5, 8, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-camera-near={0.5}
        shadow-camera-far={40}
      />

      <hemisphereLight intensity={0.6} color="#ffffff" groundColor="#53617a" />
      <ContextLossGuard onUnavailable={onUnavailable} onReadyChange={onReadyChange}/>


      {/* Portfolio avatar
      <group
        position={[-1.25, -0.25, 3.0]}
        rotation={[0, 0.75, 0]}
      >
        <Avatar />

        <group
          position={[0, 0, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <FadingDiskPlane />
        </group>
      </group> */}



      <MotionContext.Provider value={{...motion,cubeMode:mode,previewsEnabled:!disabled}}><ProjectCubeRig mode={mode} idle={idle} gridRef={gridRef} cameraControlRef={cameraControlRef} selection={selection}
        onNavigationChange={onNavigationChange} onFrameChange={onFrameChange} onTransitionChange={onTransitionChange}
        eligibleIds={eligibleIds} onSelect={onSelect} onActivate={onActivate} disabled={disabled} /></MotionContext.Provider>
    </Canvas>
  );
}
