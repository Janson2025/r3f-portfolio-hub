// src/sticker/meshes/meshes.jsx

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

/** Normal-material primitives */
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

/** Registry + resolver */
export const MESH_REGISTRY = {
  icosa: Icosa,
  torusKnot: TorusKnot,
  wbox: WBox,
  cube: Cube,
  cylinder: Cylinder,
};

export function ResolveMesh({ type = "icosa", props = {} }) {
  const Comp = MESH_REGISTRY[type] ?? Icosa;
  return <Comp {...props} />;
}
