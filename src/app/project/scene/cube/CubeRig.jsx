import { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import GridCube from "../../grid/GridCube";
import CubeIdleAnimation from "../animations/CubeIdleAnimation";
import CubeIdleSliceAnimation from "../animations/CubeIdleSliceAnimation";
import DragRotate from "../interactions/DragRotate";

import {
  getDirectionalProjectNavigation,
  EMPTY_PROJECT_NAVIGATION,
} from "./projectNavigation.js";

const TRANSITION_DURATION = 1.1;

// The zoom control is represented as a percentage, while Three.js uses FOV.
// A lower FOV is more zoomed in.
const CAMERA_FOV_MIN = 18;
const CAMERA_FOV_MAX = 75;

const PROJECT_VIEW_ZOOM = 0;
const CUBE_VIEW_ZOOM = 50;

function zoomPercentToFov(percent) {
  const zoom = THREE.MathUtils.clamp(Number(percent), 0, 100);

  return (
    CAMERA_FOV_MIN +
    (zoom / 100) * (CAMERA_FOV_MAX - CAMERA_FOV_MIN)
  );
}

function fovToZoomPercent(fov) {
  return THREE.MathUtils.clamp(
    ((Number(fov) - CAMERA_FOV_MIN) /
      (CAMERA_FOV_MAX - CAMERA_FOV_MIN)) *
      100,
    0,
    100
  );
}

const PROJECT_VIEW_FOV = zoomPercentToFov(PROJECT_VIEW_ZOOM);
const CUBE_VIEW_FOV = zoomPercentToFov(CUBE_VIEW_ZOOM);

// --------------------------------------------------
// Project sticker lookup
// --------------------------------------------------

function findProjectSticker(root, projectId) {
  if (!root || !projectId) return null;

  let result = null;

  root.updateWorldMatrix(true, true);

  root.traverse((object) => {
    if (result) return;

    const metadata = object.userData?.projectSticker;

    if (metadata?.id === projectId) {
      result = {
        object,
        metadata,
      };
    }
  });

  return result;
}

// Convert a world-space quaternion into the local space
// of the object's parent.
function worldQuaternionToLocal(group, worldQuaternion) {
  const parentQuaternion = new THREE.Quaternion();

  if (group.parent) {
    group.parent.getWorldQuaternion(parentQuaternion);
  }

  return parentQuaternion
    .invert()
    .multiply(worldQuaternion.clone());
}

// --------------------------------------------------
// Project focus calculations
// --------------------------------------------------

function calculateAlignedFaceQuaternion(
  stickerObject,
  camera,
  directionToCamera
) {
  const currentStickerQuaternion =
    stickerObject.getWorldQuaternion(
      new THREE.Quaternion()
    );

  // Project camera-up onto the plane of the sticker.
  // This keeps the sticker's top aligned with the camera's up direction.
  const cameraUp = camera.up.clone().normalize();

  const alignedUp = cameraUp.addScaledVector(
    directionToCamera,
    -cameraUp.dot(directionToCamera)
  );

  // Fallback in the unlikely event camera-up is parallel
  // to the direction toward the camera.
  if (alignedUp.lengthSq() < 0.000001) {
    alignedUp.copy(
      camera.getWorldDirection(new THREE.Vector3())
    );

    alignedUp.negate();

    alignedUp.addScaledVector(
      directionToCamera,
      -alignedUp.dot(directionToCamera)
    );
  }

  alignedUp.normalize();

  const alignedRight = new THREE.Vector3()
    .crossVectors(alignedUp, directionToCamera)
    .normalize();

  alignedUp.crossVectors(
    directionToCamera,
    alignedRight
  ).normalize();

  const desiredRotationMatrix = new THREE.Matrix4()
    .makeBasis(
      alignedRight,
      alignedUp,
      directionToCamera
    );

  const desiredStickerQuaternion =
    new THREE.Quaternion()
      .setFromRotationMatrix(desiredRotationMatrix);

  // Calculate the world-space rotation needed to align
  // the sticker with the camera.
  const worldRotationDelta =
    desiredStickerQuaternion.multiply(
      currentStickerQuaternion.clone().invert()
    );

  return {
    worldRotationDelta,
    desiredStickerQuaternion,
  };
}

function getLookAtQuaternion(
  camera,
  position,
  target,
  up
) {
  const helper = camera.clone();

  helper.position.copy(position);
  helper.up.copy(up);
  helper.lookAt(target);
  helper.updateMatrixWorld(true);

  return helper.quaternion.clone();
}

function calculateProjectFocus({
  cubeGroup,
  stickerObject,
  camera,
}) {
  cubeGroup.updateWorldMatrix(true, true);
  stickerObject.updateWorldMatrix(true, false);

  const stickerPosition = stickerObject.getWorldPosition(
    new THREE.Vector3()
  );

  const directionToCamera = camera.position
    .clone()
    .sub(stickerPosition)
    .normalize();

  const { worldRotationDelta } =
    calculateAlignedFaceQuaternion(
      stickerObject,
      camera,
      directionToCamera
    );

  const cubeWorldPosition = cubeGroup.getWorldPosition(
    new THREE.Vector3()
  );

  const cubeWorldQuaternion = cubeGroup.getWorldQuaternion(
    new THREE.Quaternion()
  );

  const targetCubeWorldQuaternion =
    worldRotationDelta
      .clone()
      .multiply(cubeWorldQuaternion);

  const targetCubeQuaternion = worldQuaternionToLocal(
    cubeGroup,
    targetCubeWorldQuaternion
  );

  // Rotate the sticker's position around the cube's origin.
  const targetStickerPosition = stickerPosition
    .sub(cubeWorldPosition)
    .applyQuaternion(worldRotationDelta)
    .add(cubeWorldPosition);

  // Keep the camera at its current position.
  const targetCameraPosition = camera.position.clone();

  const targetCameraQuaternion = getLookAtQuaternion(
    camera,
    targetCameraPosition,
    targetStickerPosition,
    camera.up
  );

  return {
    targetCubePosition: cubeGroup.position.clone(),
    targetCubeQuaternion,
    targetStickerPosition,
    targetCameraPosition,
    targetCameraQuaternion,
  };
}

// --------------------------------------------------
// CubeRig
// --------------------------------------------------

export default function CubeRig({
  gridRef,
  cameraControlRef,

  onSelectProject,
  onActivateSticker,
  onTransitionComplete,
  onProjectNavigationChange,

  selectedProject,
  isProjectView = false,

  frameReady,

  controlsEnabled = true,

  activationEnabled = false,
  activationProjectId = null,
}) {
  const group = useRef();
  const idleGroup = useRef();

  const [idleSliceActive, setIdleSliceActive] = useState(false);

  const { size, camera } = useThree();

  const isDesktop = size.width >= 1024;

  const offsetX = isDesktop ? 2.0 : 0;
  const offsetY = isDesktop ? -0.5 : 0;
  const offsetZ = 0;

  // --------------------------------------------------
  // Camera and transition references
  // --------------------------------------------------

  const cameraTargetRef = useRef(new THREE.Vector3());

  const initialCameraPoseRef = useRef(null);
  const savedPoseRef = useRef(null);
  const transitionRef = useRef(null);

  const previousProjectIdRef = useRef(null);

  const projectId = selectedProject?.id ?? null;

  const projectIdRef = useRef(projectId);
  projectIdRef.current = projectId;

  // --------------------------------------------------
  // Camera calibration API
  // --------------------------------------------------

  useEffect(() => {
    // Start Cube View at its standard zoom level.
    if (camera.isPerspectiveCamera) {
      camera.fov = CUBE_VIEW_FOV;
      camera.updateProjectionMatrix();
    }

    camera.updateMatrixWorld(true);

    const initialDirection = camera.getWorldDirection(
      new THREE.Vector3()
    );

    cameraTargetRef.current
      .copy(camera.position)
      .add(initialDirection.multiplyScalar(6));

    initialCameraPoseRef.current = {
      position: camera.position.clone(),
      quaternion: camera.quaternion.clone(),
      up: camera.up.clone(),
      target: cameraTargetRef.current.clone(),
      fov: camera.isPerspectiveCamera
        ? camera.fov
        : null,
    };

    const updateCameraOrientation = () => {
      camera.lookAt(cameraTargetRef.current);
      camera.updateMatrixWorld(true);
    };

    const getState = () => ({
      position: camera.position.toArray(),
      target: cameraTargetRef.current.toArray(),
      fov: camera.isPerspectiveCamera
        ? camera.fov
        : null,
      zoomPercent: camera.isPerspectiveCamera
        ? fovToZoomPercent(camera.fov)
        : null,
    });

    const setCameraPosition = (position) => {
      if (!Array.isArray(position) || position.length !== 3) {
        return;
      }

      const values = position.map(Number);

      if (!values.every(Number.isFinite)) return;

      camera.position.set(...values);
      updateCameraOrientation();
    };

    const setLookAtTarget = (target) => {
      if (!Array.isArray(target) || target.length !== 3) {
        return;
      }

      const values = target.map(Number);

      if (!values.every(Number.isFinite)) return;

      cameraTargetRef.current.set(...values);
      updateCameraOrientation();
    };

    // Changing FOV only changes the projection.
    // It must not reset the camera's current orientation.
    const setFov = (value) => {
      if (!camera.isPerspectiveCamera) return;

      const nextFov = Number(value);

      if (!Number.isFinite(nextFov)) return;

      camera.fov = THREE.MathUtils.clamp(
        nextFov,
        CAMERA_FOV_MIN,
        CAMERA_FOV_MAX
      );

      camera.updateProjectionMatrix();
    };

    const setZoomPercent = (percent) => {
      if (!camera.isPerspectiveCamera) return;

      setFov(zoomPercentToFov(percent));
    };

    const resetCamera = () => {
      const initial = initialCameraPoseRef.current;

      if (!initial) return;

      camera.position.copy(initial.position);
      camera.quaternion.copy(initial.quaternion);
      camera.up.copy(initial.up);
      cameraTargetRef.current.copy(initial.target);

      if (
        camera.isPerspectiveCamera &&
        initial.fov !== null
      ) {
        camera.fov = initial.fov;
        camera.updateProjectionMatrix();
      }

      camera.updateMatrixWorld(true);
    };

    const capturePose = () => {
      camera.updateMatrixWorld(true);
      group.current?.updateWorldMatrix(true, true);

      return {
        projectId: projectIdRef.current,

        camera: {
          position: camera.position.toArray(),
          target: cameraTargetRef.current.toArray(),
          quaternion: camera.quaternion.toArray(),
          up: camera.up.toArray(),
          fov: camera.isPerspectiveCamera
            ? camera.fov
            : null,
        },

        cube: group.current
          ? {
              position: group.current.position.toArray(),
              quaternion: group.current.quaternion.toArray(),
              rotation: [
                group.current.rotation.x,
                group.current.rotation.y,
                group.current.rotation.z,
              ],
            }
          : null,
      };
    };

    const api = {
      getState,
      setCameraPosition,
      setLookAtTarget,
      setFov,
      setZoomPercent,
      resetCamera,
      capturePose,
    };

    if (cameraControlRef) {
      cameraControlRef.current = api;
    }

    return () => {
      if (cameraControlRef?.current === api) {
        cameraControlRef.current = null;
      }
    };
  }, [camera, cameraControlRef]);

  // --------------------------------------------------
  // Capture original Cube View pose
  // --------------------------------------------------

  const captureOriginalPose = () => {
    if (!group.current || !camera) return null;

    return {
      cubePosition: group.current.position.clone(),
      cubeQuaternion: group.current.quaternion.clone(),

      cameraPosition: camera.position.clone(),
      cameraQuaternion: camera.quaternion.clone(),
      cameraUp: camera.up.clone(),
      cameraTarget: cameraTargetRef.current.clone(),
    };
  };

  // --------------------------------------------------
  // Detect view changes
  // --------------------------------------------------

  useEffect(() => {
    const previousProjectId = previousProjectIdRef.current;

    if (projectId && !previousProjectId) {
      // Save the Cube View pose only when entering Project View.
      savedPoseRef.current = captureOriginalPose();

      // Remove old navigation while the new project is being focused.
      onProjectNavigationChange?.(EMPTY_PROJECT_NAVIGATION);

      transitionRef.current = {
        type: "focus",
        projectId,
        elapsed: 0,
        initialized: false,
      };
    } else if (
      projectId &&
      previousProjectId &&
      projectId !== previousProjectId
    ) {
      // Switching projects should not overwrite the saved Cube View pose.
      onProjectNavigationChange?.(EMPTY_PROJECT_NAVIGATION);

      transitionRef.current = {
        type: "focus",
        projectId,
        elapsed: 0,
        initialized: false,
      };
    } else if (!projectId && previousProjectId) {
      // Clear arrows immediately when leaving Project View.
      onProjectNavigationChange?.(EMPTY_PROJECT_NAVIGATION);

      if (savedPoseRef.current) {
        transitionRef.current = {
          type: "restore",
          elapsed: 0,
          initialized: false,
        };
      } else {
        transitionRef.current = null;
        onTransitionComplete?.("cube");
      }
    }

    previousProjectIdRef.current = projectId;
  }, [
    projectId,
    onTransitionComplete,
    onProjectNavigationChange,
  ]);

  // --------------------------------------------------
  // Animate cube and camera transitions
  // --------------------------------------------------

  useFrame((_, delta) => {
    const transition = transitionRef.current;

    if (!transition || !group.current || !camera) return;

    const cubeGroup = group.current;

    // If an idle slice sequence is already running, allow it to finish.
    // The inner idle rotation is frozen separately.
    const cubeBusy =
      gridRef.current?.devAPI?.busy?.() ?? false;

    if (!transition.initialized) {
      if (cubeBusy) return;

      // ----------------------------------------------
      // Focus a project sticker
      // ----------------------------------------------

      if (transition.type === "focus") {
        const sticker = findProjectSticker(
          cubeGroup,
          transition.projectId
        );

        if (!sticker) {
          console.error(
            `Could not find project sticker "${transition.projectId}".`,
            "Check that the sticker has userData.projectSticker metadata."
          );

          onProjectNavigationChange?.(
            EMPTY_PROJECT_NAVIGATION
          );

          transitionRef.current = null;
          onTransitionComplete?.("project");
          return;
        }

        // Recalculate from the current world transform.
        cubeGroup.updateWorldMatrix(true, true);

        const focus = calculateProjectFocus({
          cubeGroup,
          stickerObject: sticker.object,
          camera,
        });

        transition.startCubePosition =
          cubeGroup.position.clone();

        transition.startCubeQuaternion =
          cubeGroup.quaternion.clone();

        transition.targetCubePosition =
          focus.targetCubePosition;

        transition.targetCubeQuaternion =
          focus.targetCubeQuaternion;

        // Preserve camera position throughout the transition.
        transition.startCameraPosition =
          camera.position.clone();

        transition.startCameraQuaternion =
          camera.quaternion.clone();

        transition.targetCameraQuaternion =
          focus.targetCameraQuaternion;

        transition.startCameraTarget =
          cameraTargetRef.current.clone();

        transition.targetCameraTarget =
          focus.targetStickerPosition.clone();

        transition.startCameraFov = camera.isPerspectiveCamera
          ? camera.fov
          : null;

        transition.targetCameraFov = camera.isPerspectiveCamera
          ? PROJECT_VIEW_FOV
          : null;

        transition.startCameraUp =
          camera.up.clone();

        transition.targetCameraUp =
          camera.up.clone();

        transition.initialized = true;
      }

      // ----------------------------------------------
      // Restore Cube View
      // ----------------------------------------------

      if (transition.type === "restore") {
        const savedPose = savedPoseRef.current;

        if (!savedPose) {
          transitionRef.current = null;

          onProjectNavigationChange?.(
            EMPTY_PROJECT_NAVIGATION
          );

          onTransitionComplete?.("cube");
          return;
        }

        transition.startCubePosition =
          cubeGroup.position.clone();

        transition.startCubeQuaternion =
          cubeGroup.quaternion.clone();

        transition.targetCubePosition =
          savedPose.cubePosition.clone();

        transition.targetCubeQuaternion =
          savedPose.cubeQuaternion.clone();

        transition.startCameraPosition =
          camera.position.clone();

        transition.startCameraQuaternion =
          camera.quaternion.clone();

        transition.targetCameraQuaternion =
          savedPose.cameraQuaternion.clone();

        transition.startCameraTarget =
          cameraTargetRef.current.clone();

        transition.targetCameraTarget =
          savedPose.cameraTarget.clone();

        transition.startCameraUp =
          camera.up.clone();

        transition.targetCameraUp =
          savedPose.cameraUp.clone();

        transition.startCameraFov = camera.isPerspectiveCamera
          ? camera.fov
          : null;

        // Returning to Cube View always restores the standard 50% zoom.
        transition.targetCameraFov = camera.isPerspectiveCamera
          ? CUBE_VIEW_FOV
          : null;

        transition.initialized = true;
      }
    }

    // ----------------------------------------------
    // Smooth interpolation
    // ----------------------------------------------

    transition.elapsed += delta;

    const rawProgress = THREE.MathUtils.clamp(
      transition.elapsed / TRANSITION_DURATION,
      0,
      1
    );

    const progress =
      rawProgress * rawProgress * (3 - 2 * rawProgress);

    cubeGroup.position.lerpVectors(
      transition.startCubePosition,
      transition.targetCubePosition,
      progress
    );

    cubeGroup.quaternion.slerpQuaternions(
      transition.startCubeQuaternion,
      transition.targetCubeQuaternion,
      progress
    );

    // Camera position is deliberately untouched.
    camera.position.copy(
      transition.startCameraPosition
    );

    camera.quaternion.slerpQuaternions(
      transition.startCameraQuaternion,
      transition.targetCameraQuaternion,
      progress
    );

    camera.up.lerpVectors(
      transition.startCameraUp,
      transition.targetCameraUp,
      progress
    );

    cameraTargetRef.current.lerpVectors(
      transition.startCameraTarget,
      transition.targetCameraTarget,
      progress
    );

    if (
      camera.isPerspectiveCamera &&
      transition.startCameraFov !== null &&
      transition.targetCameraFov !== null
    ) {
      camera.fov = THREE.MathUtils.lerp(
        transition.startCameraFov,
        transition.targetCameraFov,
        progress
      );

      camera.updateProjectionMatrix();
    }

    camera.updateMatrixWorld(true);

    // ----------------------------------------------
    // Complete transition
    // ----------------------------------------------

    if (rawProgress >= 1) {
      cubeGroup.position.copy(
        transition.targetCubePosition
      );

      cubeGroup.quaternion.copy(
        transition.targetCubeQuaternion
      );

      camera.position.copy(
        transition.startCameraPosition
      );

      camera.quaternion.copy(
        transition.targetCameraQuaternion
      );

      camera.up.copy(
        transition.targetCameraUp
      );

      cameraTargetRef.current.copy(
        transition.targetCameraTarget
      );

      if (
        camera.isPerspectiveCamera &&
        transition.targetCameraFov !== null
      ) {
        camera.fov = transition.targetCameraFov;
        camera.updateProjectionMatrix();
      }

      camera.updateMatrixWorld(true);

      const destination =
        transition.type === "focus"
          ? "project"
          : "cube";

      // Clear the active transition before notifying React.
      transitionRef.current = null;

      if (destination === "project") {
        // Calculate navigation only after the cube has
        // reached its final orientation.
        cubeGroup.updateWorldMatrix(true, true);

        const navigation = getDirectionalProjectNavigation(
          cubeGroup,
          transition.projectId
        );

        onProjectNavigationChange?.(navigation);
      } else {
        savedPoseRef.current = null;

        onProjectNavigationChange?.(
          EMPTY_PROJECT_NAVIGATION
        );
      }

      onTransitionComplete?.(destination);
    }
  });

  // --------------------------------------------------
  // Interaction state
  // --------------------------------------------------

  const transitionActive =
    transitionRef.current !== null;

  const allowCubeInteraction =
    controlsEnabled &&
    !idleSliceActive &&
    !transitionActive;

  // Project selection remains available in Project View,
  // but only when a transition is not already running.
  const allowProjectSelection =
    isProjectView &&
    !transitionActive;

  // --------------------------------------------------
  // Render
  // --------------------------------------------------

  return (
    <group
      ref={group}
      position={[offsetX, offsetZ, offsetY]}
      rotation={[
        Math.PI / 5.5,
        -Math.PI / 2.75,
        0.25,
      ]}
    >
      <group ref={idleGroup}>
        <GridCube
          ref={gridRef}
          onSelectProject={onSelectProject}
          onActivateSticker={onActivateSticker}
          frameReady={frameReady}
          interactionsEnabled={allowCubeInteraction}
          projectSelectionEnabled={allowProjectSelection}
          activationEnabled={activationEnabled}
          activationProjectId={activationProjectId}
          isProjectView={isProjectView}
        />
      </group>

      <CubeIdleAnimation
        targetRef={idleGroup}
        enabled={controlsEnabled && !idleSliceActive}
        freeze={!controlsEnabled || transitionActive}
        idleDelay={8}
      />

      <CubeIdleSliceAnimation
        gridRef={gridRef}
        enabled={controlsEnabled && !transitionActive}
        minInterval={3}
        maxInterval={7}
        turnDuration={0.8}
        onActiveChange={setIdleSliceActive}
      />

      <DragRotate
        targetRef={group}
        excludeRef={group}
        enabled={allowCubeInteraction}
        speed={0.0035}
        friction={1.25}
        maxVelocity={6}
      />
    </group>
  );
}