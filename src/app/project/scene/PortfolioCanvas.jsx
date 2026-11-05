
import { Canvas } from "@react-three/fiber";
import {
  Environment,
  ContactShadows,
} from "@react-three/drei";

import { Avatar } from "./Avatar";
import { FadingDiskPlane } from "./FadingDiskPlane";
import CubeRig from "./cube/CubeRig";

export default function PortfolioCanvas({
  gridRef,
  cameraControlRef,

  onSelectProject,
  onActivateSticker,
  onTransitionComplete,
  onReturnToCube,

  selectedProject,
  isProjectView,
  isTransitioning = false,

  frameReady,
  controlsEnabled,

  activationEnabled,
  activationProjectId,
}) {
  const handlePointerMissed = () => {
    if (!isProjectView || isTransitioning) return;

    onReturnToCube?.();
  };

  return (
    <Canvas
      camera={{
        position: [0, 1.5, 6],
        fov: 47.5,
      }}
      shadows
      onPointerMissed={handlePointerMissed}
    >
      <color
        attach="background"
        args={["#22222f"]}
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

      <Environment preset="sunset" />

      {/* Portfolio avatar */}
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
      </group>

      <ContactShadows
        position={[0, 0.001, 0]}
        opacity={0.6}
        scale={24}
        blur={2.8}
        far={8}
      />

      <CubeRig
        gridRef={gridRef}
        cameraControlRef={cameraControlRef}
        onSelectProject={onSelectProject}
        onActivateSticker={onActivateSticker}
        onTransitionComplete={onTransitionComplete}
        selectedProject={selectedProject}
        isProjectView={isProjectView}
        frameReady={frameReady}
        controlsEnabled={controlsEnabled}
        activationEnabled={activationEnabled}
        activationProjectId={activationProjectId}
      />
    </Canvas>
  );
}
