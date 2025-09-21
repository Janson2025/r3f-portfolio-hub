// RadialFadeStandardMaterial.jsx
import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * MeshStandardMaterial + radial alpha fade in UV space.
 * - Works with lights, envMap, metalness/roughness, normalMap, etc.
 * - Controls: radius (start), feather (width), center [x,y], aspect (w/h)
 */
export default function RadialFadeStandardMaterial({
  radius = 0.35,
  feather = 0.2,
  center = [0.5, 0.5],
  aspect = 1,
  transparent = true,
  depthWrite = false,
  ...rest // color, metalness, roughness, envMap, normalMap, etc.
}) {
  const matRef = useRef();

  useEffect(() => {
    const mat = matRef.current;
    if (!mat) return;

    mat.onBeforeCompile = (shader) => {
      // Ensure the standard shader compiles with UVs so vUv exists
      shader.defines = { ...(shader.defines || {}), USE_UV: 1 };

      // Add our uniforms
      shader.uniforms.uRadius  = { value: radius };
      shader.uniforms.uFeather = { value: feather };
      shader.uniforms.uCenter  = { value: new THREE.Vector2(center[0], center[1]) };
      shader.uniforms.uAspect  = { value: aspect };

      // Inject uniform declarations into the fragment shader
      shader.fragmentShader =
        `
        uniform float uRadius;
        uniform float uFeather;
        uniform vec2  uCenter;
        uniform float uAspect;
        ` + shader.fragmentShader;

      // Multiply standard alpha by our radial mask
      shader.fragmentShader = shader.fragmentShader.replace(
        'vec4 diffuseColor = vec4( diffuse, opacity );',
        `
        vec4 diffuseColor = vec4( diffuse, opacity );
        vec2 p = vUv - uCenter;
        p.x *= uAspect;
        float d = length(p);
        float radialAlpha = smoothstep(uRadius + uFeather, uRadius, d);
        diffuseColor.a *= radialAlpha;
        `
      );

      // Keep a handle so we can update uniforms reactively
      mat.userData.shader = shader;
    };

    mat.needsUpdate = true; // trigger (re)compile
  }, []); // run once

  // Keep uniforms in sync with props after compile
  useEffect(() => {
    const sh = matRef.current?.userData?.shader;
    if (!sh) return;
    sh.uniforms.uRadius.value = radius;
    sh.uniforms.uFeather.value = feather;
    sh.uniforms.uCenter.value.set(center[0], center[1]);
    sh.uniforms.uAspect.value = aspect;
  }, [radius, feather, center, aspect]);

  return (
    <meshStandardMaterial
      ref={matRef}
      transparent={transparent}
      depthWrite={depthWrite}
      {...rest}
    />
  );
}
