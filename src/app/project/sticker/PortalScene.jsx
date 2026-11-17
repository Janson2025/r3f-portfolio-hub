import PortalBackground from "./PortalBackground.jsx";
import { useMotion } from "../../../lib/motion.jsx";
// src/sticker/PortalScene.jsx
import { useRef, useMemo, Suspense } from "react";
import SceneErrorBoundary from '../../components/SceneErrorBoundary.jsx';
import { useFrame } from "@react-three/fiber";
import { ResolveMesh, ResolveLights } from "./meshes/index.jsx";
import { makeAnimator } from "./meshPortalObjectAnimation.js";

/**
 * Props:
 *  - bgColor: string hex
 *  - mesh: { type: string, props?: Record<string, any> }
 *  - lights?: { preset?: string } | { ambient?: number, dirs?: [{position, intensity}, ...] }
 *  - distance?: number
 *  - animation?: { type: "idle"|"spin"|"none", params?: object }
 *  - playing?: boolean   // ← when false, animation does not advance
 *
 * Back-compat: if `spin` prop is provided, it’s mapped to animation={type:"spin"}
 */
export default function PortalScene({
  bgColor = "#ffffff",
  mesh = { type: "icosa", props: {} },
  lights,
  distance = 0,
  animation,
  background,
  // Deprecated (kept for older sticker entries)
  spin,
  playing = false,
}) {
  const { reducedMotion, ambientMotion } = useMotion();
  const g = useRef();

  const resolvedAnimation = useMemo(() => {
    // Map legacy `spin` into new system if present and no explicit animation provided
    if (!animation && spin) {
      return { type: "spin", params: { speed: spin.speed ?? 0.6, axis: spin.axis ?? [0, 1, 0] } };
    }
    // default to idle if not specified
    return animation ?? { type: "idle", params: {} };
  }, [animation, spin]);

  const animator = useMemo(
    () => makeAnimator(resolvedAnimation),
    [resolvedAnimation?.type, JSON.stringify(resolvedAnimation?.params || {})]
  );

  useFrame((_, dt) => {
    // Cheap: animator early-returns when not playing
    animator(g.current, dt, playing && !reducedMotion);
  });

  return (
    <>
      <color attach="background" args={[bgColor]} />
      <ResolveLights lights={lights} />
      <PortalBackground config={background} />

      <group ref={g} position={[0, 0, -distance]}>
        <SceneErrorBoundary fallback={<mesh><icosahedronGeometry args={[.3,0]}/><meshStandardMaterial color="#8dabff"/></mesh>}><Suspense fallback={<mesh><boxGeometry args={[.25,.25,.25]}/><meshStandardMaterial wireframe color="#8dabff"/></mesh>}><ResolveMesh type={mesh?.type} props={mesh?.props} playing={playing && !reducedMotion} /></Suspense></SceneErrorBoundary>
      </group>
    </>
  );
}
