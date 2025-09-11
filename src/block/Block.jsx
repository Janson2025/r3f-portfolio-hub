// src/block/Block.jsx
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import Sticker from "../sticker/Sticker";
import params from "./params/block.json";

const FACE = {
  front:  { pos: [0, 0,  0.5], rot: [0, 0, 0] },
  back:   { pos: [0, 0, -0.5], rot: [0, Math.PI, 0] },
  right:  { pos: [ 0.5, 0, 0], rot: [0,  Math.PI/2, 0] },
  left:   { pos: [-0.5, 0, 0], rot: [0, -Math.PI/2, 0] },
  top:    { pos: [0,  0.5, 0], rot: [-Math.PI/2, 0, 0] },
  bottom: { pos: [0, -0.5, 0], rot: [ Math.PI/2, 0, 0] },
};

export default function Block({ position=[0,0,0], size=1, stickers=[], onActivateSticker, frameReady }) {
  const group = useRef();

  // Example block idle (can move to a hook later)
  useFrame((_, dt) => {
    if (group.current) group.current.rotation.y += dt * (params.idle?.speed ?? 0.1);
  });

  return (
    <group ref={group} position={position}>
      {/* Block body */}
      <mesh>
        <boxGeometry args={[size, size, size]} />
        <meshStandardMaterial
          color={params.material?.color ?? "#1b1e24"}
          roughness={params.material?.roughness ?? 0.9}
          metalness={params.material?.metalness ?? 0.1}
        />
      </mesh>

      {/* Stickers on faces */}
      {stickers.map((s) => {
        const t = FACE[s.face];
        if (!t) return null;

        // Thin "sticker" (flattened along face normal)
        const depth = 0.06;                          // thickness of sticker
        const dims  = [size * 0.98, size * 0.98, depth];

        return (
          <group key={s.id} position={t.pos.map(v => v * size)} rotation={t.rot}>
            <Sticker
              config={s}
              dims={dims}
              onActivate={() => onActivateSticker(s.href)}
              frameReady={frameReady}
            />
          </group>
        );
      })}
    </group>
  );
}
