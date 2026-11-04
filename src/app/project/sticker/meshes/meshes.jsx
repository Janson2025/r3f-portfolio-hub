
import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { Box3, Vector3 } from "three";
import { clone } from "three/addons/utils/SkeletonUtils.js";

/** ---------- Mesh components ---------- */

export function Icosa({ radius = 0.5, detail = 1, ...mat }) {
  return (
    <mesh>
      <icosahedronGeometry args={[radius, detail]} />
      <meshStandardMaterial
        roughness={0.5}
        metalness={0.1}
        {...mat}
      />
    </mesh>
  );
}

export function TorusKnot({
  radius = 0.28,
  tube = 0.1,
  tubularSegments = 128,
  radialSegments = 16,
  p = 2,
  q = 3,
  ...mat
}) {
  return (
    <mesh>
      <torusKnotGeometry
        args={[radius, tube, tubularSegments, radialSegments, p, q]}
      />
      <meshStandardMaterial
        roughness={0.4}
        metalness={0.2}
        {...mat}
      />
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

export function Cylinder({
  radiusTop = 0.4,
  radiusBottom = 0.4,
  height = 1,
  radialSegments = 32,
}) {
  return (
    <mesh>
      <cylinderGeometry
        args={[radiusTop, radiusBottom, height, radialSegments]}
      />
      <meshNormalMaterial />
    </mesh>
  );
}

export function plane({ size = 1 }) {
  return (
    <mesh>
      <planeGeometry args={[0.70, 0.50]} />
      <meshStandardMaterial color="#ffffff" />
    </mesh>
  );
}

/**
 * GLB loader
 *
 * Responsibilities:
 * 1. Load the cached GLTF scene.
 * 2. Clone it so individual instances do not mutate the cached scene.
 * 3. Calculate a stable centering offset from its original bounds.
 * 4. Apply JSON transforms independently of the centering offset.
 *
 * Position, rotation, and scale are controlled by stickers.json.
 *
 * center:
 *   true  - Center horizontally (X/Z), preserving original Y position.
 *   false - Use the original model origin without centering.
 */
export function GLB({
  url,
  scale = 1,
  rotation = [0, 0, 0],
  position = [0, 0, 0],
  center = true,
  ...rest
}) {
  const { scene } = useGLTF(url);

  // Clone the cached scene.
  // SkeletonUtils.clone also handles skinned meshes and skeletons.
  const model = useMemo(() => clone(scene), [scene]);

  // Calculate centering from the original, unscaled model.
  // Only X and Z are centered to preserve the existing disableY behavior.
  const centerOffset = useMemo(() => {
    if (!center) {
      return [0, 0, 0];
    }

    model.updateWorldMatrix(true, true);

    const bounds = new Box3().setFromObject(model);
    const boundsCenter = bounds.getCenter(new Vector3());

    return [
      -boundsCenter.x,
      0,
      -boundsCenter.z,
    ];
  }, [model, center]);

  return (
    <group
      position={position}
      rotation={rotation}
      scale={scale}
    >
      {/* Centering is independent of the JSON transforms. */}
      <group position={centerOffset}>
        <primitive
          object={model}
          {...rest}
        />
      </group>
    </group>
  );
}

// Optional preload
useGLTF.preload?.("/models/glucose.glb");

/** ---------- Registry + resolver ---------- */

export const MESH_REGISTRY = {
  icosa: Icosa,
  torusKnot: TorusKnot,
  wbox: WBox,
  cube: Cube,
  cylinder: Cylinder,
  plane: plane,
  glb: GLB,
};

export function ResolveMesh({ type = "icosa", props = {} }) {
  const Comp = MESH_REGISTRY[type] ?? Icosa;
  return <Comp {...props} />;
}
