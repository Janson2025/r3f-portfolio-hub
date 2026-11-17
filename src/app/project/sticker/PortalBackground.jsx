import { Component, Suspense, useMemo, useEffect } from 'react';
import { useTexture } from '@react-three/drei';
import { BackSide, SRGBColorSpace } from 'three';

class BackgroundBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}

function TexturedHemisphere({ config }) {
  const source = useTexture(config.image);
  const texture = useMemo(() => {
    const copy = source.clone();
    copy.colorSpace = SRGBColorSpace;
    copy.needsUpdate = true;
    return copy;
  }, [source]);
  useEffect(() => () => texture.dispose(), [texture]);
  // The rear hemisphere surrounds the preview. BackSide renders its interior;
  // it never participates in pointer selection or rotates with the model.
  return <mesh position={config.position} rotation={config.rotation} raycast={() => null} renderOrder={-1}>
    <sphereGeometry args={[config.radius, 48, 32, Math.PI * 1.5 - Math.PI * config.coverage / 2, Math.PI * config.coverage, Math.PI * (1 - config.coverage) / 2, Math.PI * config.coverage]} />
    <meshBasicMaterial map={texture} side={BackSide} toneMapped={false} depthWrite={false}
      transparent={config.opacity < 1} opacity={config.opacity} />
  </mesh>;
}

export default function PortalBackground({ config }) {
  if (!config?.image) return null;
  return <BackgroundBoundary key={config.image}><Suspense fallback={null}><TexturedHemisphere config={config} /></Suspense></BackgroundBoundary>;
}
