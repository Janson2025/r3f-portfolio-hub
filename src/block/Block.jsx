// src/block/Block.jsx
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import Sticker from "../sticker/Sticker";
import params from "./params/block.json";

/**
 * Face rotations; position offset is computed per sticker to place it ON the surface.
 * Axis normals: front=z+, back=z-, right=x+, left=x-, top=y+, bottom=y-
 */
const FACE_ROT = {
  front:  [0, 0, 0],
  back:   [0, Math.PI, 0],
  right:  [0,  Math.PI / 2, 0],
  left:   [0, -Math.PI / 2, 0],
  top:    [-Math.PI / 2, 0, 0],
  bottom: [ Math.PI / 2, 0, 0],
};

// Unit normal per face to compute position offset
const FACE_NORMAL = {
  front:  [0, 0,  0.933],
  back:   [0, 0, -0.933],
  right:  [ 0.933, 0, 0],
  left:   [-0.933, 0, 0],
  top:    [0,  0.933, 0],
  bottom: [0, -0.933, 0],
};

export default function Block({
  position = [0, 0, 0],
  size = 1,
  stickers = [],
  onActivateSticker,
  frameReady,
}) {
  const group = useRef();

  useFrame((_, dt) => {
    if (group.current) group.current.rotation.y += dt * (params.idle?.speed ?? 0.1);
  });

  // Sticker visual proportions (relative to block size)
  const stickerSizeRatio = 0.9;  // width/height
  const stickerDepthRatio = 0.04; // thickness
  const epsilon = 0.002;          // avoid z-fighting

  return (
    <group ref={group} position={position}>
      {/* Beveled, smooth-shaded block body */}
      <RoundedBox args={[size, size, size]} radius={params.bevel ?? 0.05} smoothness={4}>
        <meshStandardMaterial
          color={params.material?.color ?? "#1b1e24"}
          roughness={params.material?.roughness ?? 0.9}
          metalness={params.material?.metalness ?? 0.1}
          flatShading={false}
        />
      </RoundedBox>

      {/* Stickers on faces */}
      {stickers.map((s) => {
        const rot = FACE_ROT[s.face];
        const n = FACE_NORMAL[s.face];
        if (!rot || !n) return null;

        const w = size * stickerSizeRatio;
        const h = size * stickerSizeRatio;
        const d = size * stickerDepthRatio;

        // Place sticker OUTSIDE the block surface: 0.5 (surface) + d/2 + epsilon
        const offset = (0.5 + stickerDepthRatio / 2 + epsilon) * size;
        const pos = [n[0] * offset, n[1] * offset, n[2] * offset];

        return (
          <group key={s.id} position={pos} rotation={rot}>
            <Sticker
              config={s}
              dims={[w, h, d]}
              onActivate={() => onActivateSticker(s.href)}
              frameReady={frameReady}
            />
          </group>
        );
      })}
    </group>
  );
}
