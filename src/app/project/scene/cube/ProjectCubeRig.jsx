import { workspacePlace,patchWorkspace,safeQuaternion } from '../../../../lib/placeMemory.js';
import { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import GridCube from '../../grid/GridCube.jsx';
import DragRotate from '../interactions/DragRotate.jsx';
import gridParams from '../../grid/params/grid.json';
import { useMotion } from '../../../../lib/motion.jsx';
import { focusedPose, projectedStickerFrame } from './projectFocus.js';
import { getDirectionalProjectNavigation } from './projectNavigation.js';
import { cubePermissions, easeTransition, transitionDuration } from './viewModes.js';

const initialRotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 5.5, -Math.PI / 2.75, 0.25));
export default function ProjectCubeRig({ gridRef, selection, eligibleIds, onSelect, onActivate, disabled, idle = false, mode = 'project', onNavigationChange, onFrameChange, onTransitionChange }) {
  const group = useRef(null), move = useRef(null), request = useRef(true);
  const overview = useRef(new THREE.Quaternion().fromArray(safeQuaternion(workspacePlace().cubeQuaternion,initialRotation.toArray()))), previousMode = useRef(mode);
  const target = useRef(new THREE.Vector3());
  const [transitioning, setTransitioning] = useState(true);
  const { camera, size } = useThree();
  const { reducedMotion } = useMotion();
  const latest = useRef({}); latest.current = { mode, selection, eligibleIds, disabled, onActivate };
  const eligibleKey = eligibleIds.join('|');
  useEffect(()=>{const capture=()=>{const history=gridRef.current?.devAPI?.getHistoryState?.();patchWorkspace({cubeQuaternion:group.current?.quaternion.toArray(),cubeMoves:history?.moves.slice(0,history.cursor).map(entry=>entry.move)});};window.addEventListener('portfolio:capture-workspace',capture);return()=>window.removeEventListener('portfolio:capture-workspace',capture);},[gridRef]);
  const dimensions = useRef('');
  useEffect(() => {
    const resized = dimensions.current !== `${size.width}:${size.height}`;
    dimensions.current = `${size.width}:${size.height}`;
    const changedMode = previousMode.current !== mode;
    if (changedMode && previousMode.current === 'cube' && group.current) overview.current.copy(group.current.quaternion);
    previousMode.current = mode;
    if (mode === 'cube' && !changedMode && !resized) return;
    request.current = true; move.current = null;
    setTransitioning(true); onTransitionChange?.(true); onFrameChange?.(null);
  }, [mode, selection.id, selection.sequence, eligibleKey, size.width, size.height, onTransitionChange, onFrameChange]);

  useFrame(({clock}, rawDelta) => {
    if (!group.current || disabled) return;
    const api = gridRef.current;
    const delta = Math.min(rawDelta, 0.05);
    if (request.current && api?.getProjectStickers && !api.devAPI?.busy?.()) {
      group.current.position.y=0;group.current.updateWorldMatrix(true,true);
      const sticker = api.getProjectStickers().find(item => item.id === selection.id);
      if (mode === 'project' && selection.id && !sticker) return;
      camera.fov = 18; camera.updateProjectionMatrix();
      let destination;
      if (mode === 'project' && sticker) destination = focusedPose(group.current, sticker, size, 18);
      else {
        const radius = (gridParams.overallSize ?? 3.06) * Math.sqrt(3) / 2;
        const half = Math.min(THREE.MathUtils.degToRad(9), Math.atan(Math.tan(THREE.MathUtils.degToRad(9)) * size.width / Math.max(1, size.height)));
        destination = { quaternion: overview.current.clone(), target: new THREE.Vector3(), cameraPosition: new THREE.Vector3(0, 0, radius / Math.sin(half) * 1.15) };
      }
      move.current = { ...destination, start: group.current.quaternion.clone(), startCamera: camera.position.clone(), startTarget: target.current.clone(), elapsed: 0 };
      request.current = false;
    }
    const active = move.current;
    if (!active) {
      group.current.position.y = idle && mode === 'cube' && !reducedMotion ? Math.sin(clock.elapsedTime*1.3)*.055 : THREE.MathUtils.damp(group.current.position.y,0,8,delta);
      if(idle && mode === 'cube' && !reducedMotion) group.current.rotateY(delta*.09);
      return;
    }
    group.current.position.y=THREE.MathUtils.damp(group.current.position.y,0,12,delta);
    active.elapsed += delta;
    const progress = Math.min(1, active.elapsed / transitionDuration(reducedMotion));
    const eased = easeTransition(progress);
    group.current.quaternion.slerpQuaternions(active.start, active.quaternion, eased);
    camera.position.lerpVectors(active.startCamera, active.cameraPosition, eased);
    target.current.lerpVectors(active.startTarget, active.target, eased);
    camera.up.set(0, 1, 0); camera.lookAt(target.current);
    if (progress < 1) return;
    group.current.updateWorldMatrix(true, true); camera.updateMatrixWorld(true);
    const sticker = api.getProjectStickers().find(item => item.id === selection.id);
    if (mode === 'project' && sticker) {
      onNavigationChange?.(getDirectionalProjectNavigation(group.current, sticker.id, eligibleIds));
      onFrameChange?.(projectedStickerFrame(sticker, camera, size));
    } else { onNavigationChange?.(null); onFrameChange?.(null); }
    move.current = null; setTransitioning(false); onTransitionChange?.(false);
  });

  const permissions = cubePermissions(mode, transitioning, disabled, selection.id);
  return <group ref={group} quaternion={initialRotation} userData={{ halfExtent: (gridParams.overallSize ?? 3.06) / 2 }}>
    <GridCube ref={gridRef} interactionsEnabled={permissions.manipulate} projectSelectionEnabled={permissions.manipulate}
      onSelectProject={project=>{if(mode==='cube'&&!move.current)onSelect(project.id,'cube-select');}}
      eligibleProjectIds={eligibleIds} isProjectView={mode === 'project'}
      activationEnabled={permissions.activate} activationProjectId={selection.id} frameReady={permissions.activate}
      onActivateSticker={(_, project) => { const state = latest.current; if (state.mode === 'project' && !move.current && !request.current && !state.disabled && project.id === state.selection.id) state.onActivate(project.id); }} />
    <DragRotate targetRef={group} excludeRef={group} enabled={permissions.manipulate} speed={0.004} friction={4} maxVelocity={3} />
  </group>;
}
