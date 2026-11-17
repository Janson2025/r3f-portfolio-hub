import { useMemo } from "react";
import { Path, Shape, Vector2 } from "three";

function square(path, halfWidth, centerX = 0) {
  path.moveTo(centerX - halfWidth, -halfWidth);
  path.lineTo(centerX + halfWidth, -halfWidth);
  path.lineTo(centerX + halfWidth, halfWidth);
  path.lineTo(centerX - halfWidth, halfWidth);
  path.closePath();
  return path;
}

const plateDepth = 0.04;
const plateOptions = { depth: plateDepth, bevelEnabled: false };
const tileOptions = {
  depth: 0.065,
  bevelEnabled: true,
  bevelSize: 0.022,
  bevelThickness: 0.022,
  bevelSegments: 3,
};

export function ShapeFall({ position, rotation, scale }) {
  const [plate, tile] = useMemo(() => {
    const plate = square(new Shape(), 0.48);
    plate.holes.push(square(new Path(), 0.169, 0.232));
    return [plate, square(new Shape(), 0.14)];
  }, []);

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <group rotation={[-Math.PI / 2, 0, 0]}>
        <mesh>
          <extrudeGeometry args={[plate, plateOptions]} />
          <meshStandardMaterial color="#ffffff" roughness={0.54} />
        </mesh>
        <mesh position={[-0.232, 0, plateDepth + tileOptions.bevelThickness]}>
          <extrudeGeometry args={[tile, tileOptions]} />
          <meshStandardMaterial color="#f365a4" roughness={0.34} />
        </mesh>
      </group>
    </group>
  );
}

// Trace the outside from the base to the rim, then return along the interior.
const bowlProfile = [
  [0, -0.23], [0.14, -0.23], [0.19, -0.22], [0.24, -0.195],
  [0.29, -0.155], [0.34, -0.10], [0.385, -0.03], [0.42, 0.05],
  [0.44, 0.13], [0.44, 0.145], [0.43, 0.155], [0.417, 0.15],
  [0.409, 0.13], [0.389, 0.06], [0.357, -0.01], [0.315, -0.075],
  [0.267, -0.126], [0.214, -0.162], [0.15, -0.181], [0, -0.181],
].map(([radius, height]) => new Vector2(radius, height));

export function FruitMerge({ position, rotation, scale }) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh>
        <latheGeometry args={[bowlProfile, 64]} />
        <meshStandardMaterial color="#c8d5e0" metalness={0.68} roughness={0.29} />
      </mesh>
      <mesh position={[0, 0.41, 0]}>
        <sphereGeometry args={[0.115, 32, 24]} />
        <meshStandardMaterial color="#ff801b" roughness={0.4} />
      </mesh>
    </group>
  );
}
