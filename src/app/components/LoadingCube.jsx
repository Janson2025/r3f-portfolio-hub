import { useEffect, useRef } from 'react';
import { startLoadingCube } from '../../lib/loadingCube.js';
export default function LoadingCube({ label='Loading…', delay=250 }) {
  const cube=useRef(null);
  useEffect(()=>startLoadingCube(cube.current),[]);
  return <div className="loading-cube" role="status" style={{'--loader-delay':`${delay}ms`}}><div className="mini-cube-stage" ref={cube} aria-hidden="true"/><span>{label}</span></div>;
}
