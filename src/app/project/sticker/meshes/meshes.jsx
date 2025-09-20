import { useGLTF, Center } from "@react-three/drei";

/** ---------- Mesh components ---------- */
export function Icosa({ radius = 0.5, detail = 1, ...mat }) {
  return (
    <mesh>
      <icosahedronGeometry args={[radius, detail]} />
      <meshStandardMaterial roughness={0.5} metalness={0.1} {...mat} />
    </mesh>
  );
}

export function TorusKnot({
  radius = 0.28, tube = 0.1, tubularSegments = 128, radialSegments = 16, p = 2, q = 3, ...mat
}) {
  return (
    <mesh>
      <torusKnotGeometry args={[radius, tube, tubularSegments, radialSegments, p, q]} />
      <meshStandardMaterial roughness={0.4} metalness={0.2} {...mat} />
    </mesh>
  );
}

export function WBox({ size = 0.6, ...mat }) {
  return (
    <mesh>
      <boxGeometry args={[size, size, size]} />
      <meshStandardMaterial wireframe {...mat} />
    </mesh>
  );
}

export function Cube({ size = 0.6 }) {
  return (
    <mesh>
      <boxGeometry args={[size, size, size]} />
      <meshNormalMaterial />
    </mesh>
  );
}

export function Cylinder({ radiusTop = 0.4, radiusBottom = 0.4, height = 1, radialSegments = 32 }) {
  return (
    <mesh>
      <cylinderGeometry args={[radiusTop, radiusBottom, height, radialSegments]} />
      <meshNormalMaterial />
    </mesh>
  );
}

export function plane ({ size = 1 }) {
  return (
    <mesh>
        <planeGeometry args={[0.70, 0.50]} />
        <meshStandardMaterial color='#ffffff' />
    </mesh>
  );
}

/** New: GLB loader (centered for tiny portals) */
export function GLB({ url, scale = 1, rotation = [0,0,0], position = [0,0,0], ...rest }) {
  const { scene } = useGLTF(url);
  return (
    <Center disableY>
      <primitive object={scene} scale={scale} rotation={rotation} position={position} {...rest} />
    </Center>
  );
}

// Optional preload
useGLTF.preload?.("/models/glucose.glb");

/** Registry + resolver */
export const MESH_REGISTRY = {
  icosa: Icosa,
  torusKnot: TorusKnot,
  wbox: WBox,
  cube: Cube,
  cylinder: Cylinder,
  plane: plane,
  glb: GLB, // <-- add this
};

export function ResolveMesh({ type = "icosa", props = {} }) {
  const Comp = MESH_REGISTRY[type] ?? Icosa;
  return <Comp {...props} />;
}
