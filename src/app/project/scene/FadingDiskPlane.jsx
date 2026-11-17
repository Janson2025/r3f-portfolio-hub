import { useMemo } from 'react';
import { Color, Vector2 } from 'three';

export function FadingDiskPlane({ width = 3, height = 3, color = '#17212b', opacity = 0.3, radius = 0.22, feather = 0.28, ...props }) {
  const uniforms = useMemo(() => ({ uColor: { value: new Color(color) }, uOpacity: { value: opacity }, uRadius: { value: radius }, uFeather: { value: feather }, uAspect: { value: new Vector2(width / height, 1) } }), [color, opacity, radius, feather, width, height]);
  return <mesh {...props} raycast={() => null}>
    <planeGeometry args={[width, height]} />
    <shaderMaterial transparent depthWrite={false} uniforms={uniforms}
      vertexShader={'varying vec2 vDiskUv; void main(){vDiskUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}'}
      fragmentShader={'varying vec2 vDiskUv; uniform vec3 uColor; uniform float uOpacity; uniform float uRadius; uniform float uFeather; uniform vec2 uAspect; void main(){float d=length((vDiskUv-0.5)*uAspect);float a=1.0-smoothstep(uRadius,uRadius+uFeather,d);gl_FragColor=vec4(uColor,a*uOpacity);}'} />
  </mesh>;
}
