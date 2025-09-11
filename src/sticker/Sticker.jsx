// src/sticker/Sticker.jsx
import * as THREE from "three";
import { useRef, useState, useEffect, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshPortalMaterial, RoundedBox } from "@react-three/drei";

export default function Sticker({ config, dims=[0.9,0.9,0.9], onActivate, frameReady }) {
  const mat = useRef();
  const inner = useRef();

  useFrame((_, dt) => {
    if (inner.current) inner.current.rotation.y += dt * (config.idle?.spin ?? 0.0);
  });

  const [targetBlend, setTargetBlend] = useState(0);
  const [animating, setAnimating] = useState(false);
  const watchdogRef = useRef(null);

  useEffect(() => () => {
    if (watchdogRef.current) clearTimeout(watchdogRef.current);
  }, []);

  const start = useCallback(() => {
    setAnimating(true);
    setTargetBlend(1);
  }, []);

  const isPortal = config.type === "portal";

  return (
    <group
      onClick={start}
      onPointerOver={(e) => { document.body.style.cursor = "pointer"; e.stopPropagation(); }}
      onPointerOut={() => (document.body.style.cursor = "auto")}
    >
      <RoundedBox args={dims} radius={config.bevel ?? 0.1} smoothness={2}>
        {isPortal ? (
          <MeshPortalMaterial ref={mat} side={THREE.DoubleSide} blend={0}>
            <color attach="background" args={["#333333"]} />
            <ambientLight intensity={0.75} />
            <directionalLight position={[1.2,1.6,1.2]} intensity={1} />
            <mesh ref={inner}>
              <boxGeometry args={[0.5,0.5,0.5]} />
              <meshNormalMaterial />
            </mesh>
          </MeshPortalMaterial>
        ) : (
          <meshStandardMaterial
            color={config.preview?.color ?? "#888"}
            roughness={0.8}
            metalness={0.2}
            flatShading={false}
          />
        )}
      </RoundedBox>
    </group>
  );
}
