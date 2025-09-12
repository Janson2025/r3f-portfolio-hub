// src/sticker/PortalScene.jsx
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { ResolveMesh, ResolveLights } from "./meshes/index.jsx";

/**
 * Props:
 *  - bgColor: string hex
 *  - mesh: { type: string, props?: Record<string, any> }
 *  - spin?: { speed?: number, axis?: [x,y,z] }
 *  - lights?: { preset?: string } | { ambient?: number, dirs?: [{position, intensity}, ...] }
 */
export default function PortalScene({
  bgColor = "#ffffff",
  mesh = { type: "icosa", props: {} },
  spin = { speed: 0.6, axis: [0, 1, 0] },
  lights, // <— now resolved via registry
}) {
  const g = useRef();

  useFrame((_, dt) => {
    const spd = spin?.speed ?? 0.6;
    if (!spd || !g.current) return;
    const [ax, ay, az] = spin?.axis ?? [0, 1, 0];
    g.current.rotation.x += (ax ?? 0) * spd * dt;
    g.current.rotation.y += (ay ?? 0) * spd * dt;
    g.current.rotation.z += (az ?? 0) * spd * dt;
  });

  return (
    <>
      <color attach="background" args={[bgColor]} />
      <ResolveLights lights={lights} />
      <group ref={g}>
        <ResolveMesh type={mesh?.type} props={mesh?.props} />
      </group>
    </>
  );
}
