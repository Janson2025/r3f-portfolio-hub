// FadingDiskPlane.jsx
import React, { useMemo } from "react";
import RadialFadeStandardMaterial from "./RadialFadeStandardMaterial";

/**
 * A plane that is opaque in the middle (a disk) and fades to transparent toward the edges.
 * Control fade with props: radius, feather, center, color, opacity.
 */
export function FadingDiskPlane({
  width = 4,
  height = 3,
  color = "#000000",
  opacity = 1,
  radius = 0.3,     // start of fade (as fraction of half-height)
  feather = 0.25,   // width of fade band
  center = [0.5, 0.5],
  ...props
}) {
  const aspect = useMemo(() => width / height, [width, height]);

  return (
    <mesh>
        <planeGeometry args={[1.5, 1.5]} />
        <RadialFadeStandardMaterial
            color="#000000"
            metalness={1}
            roughness={0.0}
            envMapIntensity={1}
            radius={0.0}
            feather={0.5}
            center={[0.5, 0.5]}
            aspect={3/3}
        />
    </mesh>
  );
}