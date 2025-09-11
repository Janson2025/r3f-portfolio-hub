// src/scene/SceneRoot.jsx
import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls } from "@react-three/drei";
import GridCube from "../grid/GridCube";
import useOverlayController from "./interactions/useOverlayController";
import ProjectOverlay from "./ProjectOverlay";

export default function SceneRoot() {
  const {
    visible,
    ready,
    setReady,
    targetUrl,
    targetOrigin,
    show,
    hide,
    controlsDisabled,
  } = useOverlayController();

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <Canvas camera={{ position: [3, 3, 3], fov: 50 }}>
        <color attach="background" args={["#22222f"]} />
        {/* You can move these to scene/params later */}
        <ambientLight intensity={0.6} />
        <Environment preset="sunset" />
        <directionalLight position={[3, 4, 2]} intensity={1.1} />

        <GridCube
          onActivateSticker={(href) => show(href)}  // supports any project href
          frameReady={ready}
        />

        <OrbitControls enabled={!controlsDisabled} />
      </Canvas>

      {!visible && !ready && (
        <div className="absolute bottom-4 left-4 rounded-md bg-black/50 px-3 py-1 text-xs text-white backdrop-blur">
          Preloading project…
        </div>
      )}

      <ProjectOverlay
        targetUrl={targetUrl}
        targetOrigin={targetOrigin}
        visible={visible}
        onReady={() => setReady(true)}
        onBack={() => hide()}
      />
    </div>
  );
}
