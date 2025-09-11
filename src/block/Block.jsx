// src/block/Block.jsx
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import Sticker from "../sticker/Sticker";
import params from "./params/block.json";

const FACE = {
  front:  { pos: [0, 0,  0.05], rot: [0, 0, 0] },
  back:   { pos: [0, 0, -0.05], rot: [0, Math.PI, 0] },
  right:  { pos: [ 0.05, 0, 0], rot: [0,  Math.PI/2, 0] },
  left:   { pos: [-0.05, 0, 0], rot: [0, -Math.PI/2, 0] },
  top:    { pos: [0,  0.05, 0], rot: [-Math.PI/2, 0, 0] },
  bottom: { pos: [0, -0.05, 0], rot: [ Math.PI/2, 0, 0] },
};

export default function Block({ position=[0,0,0], size=1, stickers=[], onActivateSticker, frameReady }) {
  const group = useRef();

  useFrame((_, dt) => {
    if (group.current) group.current.rotation.y += dt * (params.idle?.speed ?? 0.1);
  });

  return (
    <group ref={group} position={position}>
      {/* Beveled block body */}
      <RoundedBox args={[size, size, size]} radius={params.bevel ?? 0.05} smoothness={4}>
        <meshStandardMaterial
          color={params.material?.color ?? "#444444"}
          roughness={params.material?.roughness ?? 0.9}
          metalness={params.material?.metalness ?? 0.1}
          flatShading={false}
        />
      </RoundedBox>

      {/* Stickers */}
      {stickers.map((s) => {
        const t = FACE[s.face];
        if (!t) return null;

        const depth = 0.95; // sticker thickness
        const dims = [size * 0.95, size * 0.95, depth];

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
