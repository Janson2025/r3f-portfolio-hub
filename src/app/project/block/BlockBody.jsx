// src/block/BlockBody.jsx
import { RoundedBox } from "@react-three/drei";
import params from "./params/block.json";

/** The beveled cube body */
export default function BlockBody({ size = 1 }) {
  return (
    <RoundedBox args={[size, size, size]} radius={params.bevel ?? 0.05} smoothness={4}>
      <meshStandardMaterial
        color={params.material?.color ?? "#1b1e24"}
        roughness={params.material?.roughness ?? 0.9}
        metalness={params.material?.metalness ?? 0.1}
        flatShading={false}
      />
    </RoundedBox>
  );
}
