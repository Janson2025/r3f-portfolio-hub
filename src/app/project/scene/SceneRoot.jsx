import { useRef } from 'react';
import PortfolioCanvas from './PortfolioCanvas.jsx';

export default function SceneRoot({ mode, idle, selection, eligibleIds, onSelect, onActivate, disabled, onUnavailable, onReadyChange, onNavigationChange, onFrameChange, onTransitionChange }) {
  const gridRef = useRef(null);
  const cameraControlRef = useRef(null);
  return <div className="scene-viewport" inert={disabled}>
    <PortfolioCanvas mode={mode} idle={idle} onReadyChange={onReadyChange} gridRef={gridRef} cameraControlRef={cameraControlRef} selection={selection}
      onNavigationChange={onNavigationChange} onFrameChange={onFrameChange} onTransitionChange={onTransitionChange}
      eligibleIds={eligibleIds} onSelect={onSelect} onActivate={onActivate} disabled={disabled} onUnavailable={onUnavailable} />
  </div>;
}
