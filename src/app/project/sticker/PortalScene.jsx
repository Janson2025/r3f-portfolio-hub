// src/sticker/PortalScene.jsx
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { ResolveMesh, ResolveLights } from "./meshes/index.jsx";

/**
 * Props:
 *  - bgColor: string hex
 *  - mesh: { type: string, props?: Record<string, any> }
 *  - spin?: { speed?: number, axis?: [x,y,z] }
 *  - lights?: { preset?: string } | { ambient?: number, dirs?: [{position, intensity}, ...] }
 *  - distance?: number   // NEW: moves object along -Z; positive pushes it deeper
 */
export default function PortalScene({
  bgColor = "#ffffff",
  mesh = { type: "icosa", props: {} },
  spin = { speed: 0.6, axis: [0, 1, 0] },
  lights,
  distance = 0, // world units; 0 keeps prior behavior
}) {
  const g = useRef();

  const axis = useMemo(() => {
    const a = spin?.axis ?? [0, 1, 0];
    return [a[0] ?? 0, a[1] ?? 1, a[2] ?? 0];
  }, [spin?.axis]);

  useFrame((_, dt) => {
    const spd = spin?.speed ?? 0.6;
    if (!spd || !g.current) return;
    g.current.rotation.x += axis[0] * spd * dt;
    g.current.rotation.y += axis[1] * spd * dt;
    g.current.rotation.z += axis[2] * spd * dt;
  });

  return (
    <>
      <color attach="background" args={[bgColor]} />
      <ResolveLights lights={lights} />

      {/* Push the whole mesh group along -Z by `distance` */}
      <group ref={g} position={[0, 0, -distance]}>
        <ResolveMesh type={mesh?.type} props={mesh?.props} />
      </group>
    </>
  );
}
