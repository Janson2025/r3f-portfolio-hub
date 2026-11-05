
import { useCallback, useEffect, useRef } from "react";
import * as THREE from "three";

import { FACE_NORMAL } from "../../block/constrants.js";
import { chooseGestureRotation } from "./gestureRotation.js";

const DRAG_THRESHOLD = 6;
const DRAG_SENSITIVITY = 120;
const FRONT_FACE_DOT_THRESHOLD = 0.05;

const SAME_SIDE_DOT_THRESHOLD = 0.999;

function findProjectStickerNormal(root, projectId) {
  if (!root || !projectId) return null;

  root.updateWorldMatrix(true, true);

  let result = null;

  root.traverse((object) => {
    if (result) return;

    if (object.userData?.projectSticker?.id !== projectId) {
      return;
    }

    const worldQuaternion = object.getWorldQuaternion(
      new THREE.Quaternion()
    );

    result = new THREE.Vector3(0, 0, 1)
      .applyQuaternion(worldQuaternion)
      .normalize();
  });

  return result;
}

/**
 * Handles project-sticker selection and pointer-driven slice rotation.
 *
 * A stationary pointer interaction selects a front-facing project sticker.
 * Moving beyond the drag threshold is always treated as a gesture, even
 * if that gesture cannot be mapped to a valid slice rotation.
 */
export default function useCubePointerSelection({
  cubeRootRef,
  blocks,
  size = 3,
  spacing = 1,
  beginDrag,
  updateDrag,
  finishDrag,
  onSelectProject,
  enabled = true,
  dragEnabled = enabled,
  focusedProjectId = null,
  restrictToFocusedSide = false,
}) {
  const lastSelectionRef = useRef(null);
  const activePointerRef = useRef(null);
  const cleanupPointerRef = useRef(null);

  const cleanupPointer = useCallback(() => {
    cleanupPointerRef.current?.();
    cleanupPointerRef.current = null;
    activePointerRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      cleanupPointerRef.current?.();
      cleanupPointerRef.current = null;
      activePointerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!enabled) cleanupPointer();
  }, [enabled, cleanupPointer]);

  const handlePointerDown = useCallback(
    (event, metadata = {}) => {
      if (!enabled) return;
      if (event.button != null && event.button !== 0) return;
      if (activePointerRef.current) return;

      event.stopPropagation?.();

      const { cubieId, face, project } = metadata;
      const gridPositionInput =
        metadata.gridPosition ?? metadata.blockIndex;

      if (gridPositionInput == null) return;

      const gridPosition = Array.isArray(gridPositionInput)
        ? {
            x: gridPositionInput[0],
            y: gridPositionInput[1],
            z: gridPositionInput[2],
          }
        : {
            x: gridPositionInput.x,
            y: gridPositionInput.y,
            z: gridPositionInput.z,
          };

      const cubeRoot = cubeRootRef.current;
      const block = blocks[cubieId]?.ref?.current;
      const faceNormal = FACE_NORMAL[face];

      const nativeEvent = event.nativeEvent ?? event;

      const canvas = nativeEvent.target?.getBoundingClientRect
        ? nativeEvent.target
        : nativeEvent.currentTarget;

      const camera = event.camera;

      if (
        !cubeRoot ||
        !block ||
        !faceNormal ||
        !event.point ||
        !camera ||
        !canvas?.getBoundingClientRect
      ) {
        return;
      }

      cubeRoot.updateWorldMatrix(true, true);
      block.updateWorldMatrix(true, false);

      const blockWorldQuaternion = block.getWorldQuaternion(
        new THREE.Quaternion()
      );

      const cubeWorldQuaternion = cubeRoot.getWorldQuaternion(
        new THREE.Quaternion()
      );

      // Convert the sticker normal into cube-local coordinates.
      const normalInCubeSpace = new THREE.Vector3(...faceNormal)
        .normalize()
        .applyQuaternion(blockWorldQuaternion)
        .applyQuaternion(cubeWorldQuaternion.clone().invert());

      normalInCubeSpace.set(
        Math.round(normalInCubeSpace.x),
        Math.round(normalInCubeSpace.y),
        Math.round(normalInCubeSpace.z)
      ).normalize();

      const hitPointInCubeSpace = cubeRoot.worldToLocal(
        event.point.clone()
      );

      // Determine whether the sticker's outward normal faces the camera.
      const worldFaceNormal = new THREE.Vector3(...faceNormal)
        .normalize()
        .applyQuaternion(blockWorldQuaternion);

      const cameraWorldPosition = camera.getWorldPosition(
        new THREE.Vector3()
      );

      const directionToCamera = cameraWorldPosition
        .sub(event.point)
        .normalize();

      const facingCamera =
        worldFaceNormal.dot(directionToCamera) >
        FRONT_FACE_DOT_THRESHOLD;

      const focusedNormal = restrictToFocusedSide
        ? findProjectStickerNormal(
            cubeRoot,
            focusedProjectId
          )
        : null;

      const sameSide =
        !restrictToFocusedSide ||
        (
          focusedNormal !== null &&
          worldFaceNormal.dot(focusedNormal) >=
            SAME_SIDE_DOT_THRESHOLD
        );

      const selection = {
        cubieId,
        gridPosition,
        face,
        project: project ?? null,
        facingCamera,
        sameSide,

        faceNormal: {
          x: normalInCubeSpace.x,
          y: normalInCubeSpace.y,
          z: normalInCubeSpace.z,
        },

        hitPoint: {
          x: hitPointInCubeSpace.x,
          y: hitPointInCubeSpace.y,
          z: hitPointInCubeSpace.z,
        },

        pointer: {
          id: event.pointerId,
          type: event.pointerType ?? "unknown",
          clientX: event.clientX,
          clientY: event.clientY,
        },
      };

      lastSelectionRef.current = selection;

      const activePointer = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        lastX: event.clientX,
        lastY: event.clientY,

        selection,
        cubeRoot,
        camera,
        canvas,

        dragging: false,
        moved: false,

        axis: null,
        layer: null,
        screenDirection: null,
        angle: 0,
      };

      activePointerRef.current = activePointer;

      if (import.meta.env.DEV) {
        console.info("[Cube pointer selection]", selection);
      }

      // ------------------------------------------------
      // Pointer movement
      // ------------------------------------------------

      const handlePointerMove = (moveEvent) => {
        const active = activePointerRef.current;

        if (
          !active ||
          moveEvent.pointerId !== active.pointerId
        ) {
          return;
        }

        const totalX = moveEvent.clientX - active.startX;
        const totalY = moveEvent.clientY - active.startY;

        if (!active.dragging) {
          const distance = Math.hypot(totalX, totalY);

          if (distance < DRAG_THRESHOLD) return;

          // Crossing the threshold means this cannot be a click.
          active.moved = true;

          // Project View allows clicking stickers but not rotating slices.
          if (!dragEnabled) return;

          const currentSelection = active.selection;

          const result = chooseGestureRotation({
            faceNormal: new THREE.Vector3(
              currentSelection.faceNormal.x,
              currentSelection.faceNormal.y,
              currentSelection.faceNormal.z
            ),

            hitPoint: new THREE.Vector3(
              currentSelection.hitPoint.x,
              currentSelection.hitPoint.y,
              currentSelection.hitPoint.z
            ),

            gridPosition: currentSelection.gridPosition,

            deltaX: totalX,
            deltaY: totalY,

            size,
            spacing,

            cubeRoot: active.cubeRoot,
            camera: active.camera,
            canvas: active.canvas,
          });

          if (!result) return;

          const started = beginDrag(
            result.axis,
            result.layer
          );

          if (!started) {
            if (import.meta.env.DEV) {
              console.warn(
                "[Cube gesture] Could not begin slice rotation.",
                result
              );
            }

            cleanupPointer();
            return;
          }

          active.dragging = true;
          active.axis = result.axis;
          active.layer = result.layer;

          active.screenDirection = new THREE.Vector2(
            result.screenDirection.x,
            result.screenDirection.y
          );

          active.angle = 0;

          if (import.meta.env.DEV) {
            console.info("[Cube gesture detected]", {
              cubieId: currentSelection.cubieId,
              face: currentSelection.face,
              axis: result.axis,
              layer: result.layer,
              direction: result.direction,
              score: Number(result.score.toFixed(3)),
              screenDirection: result.screenDirection,
              swipe: {
                x: totalX,
                y: totalY,
              },
            });
          }

          const initialScreenDelta = new THREE.Vector2(
            totalX,
            totalY
          );

          const projectedPixels = initialScreenDelta.dot(
            active.screenDirection
          );

          active.angle =
            projectedPixels *
            (Math.PI / 2) /
            DRAG_SENSITIVITY;

          updateDrag(active.angle);

          active.lastX = moveEvent.clientX;
          active.lastY = moveEvent.clientY;

          return;
        }

        // Update an existing slice rotation.
        const deltaX = moveEvent.clientX - active.lastX;
        const deltaY = moveEvent.clientY - active.lastY;

        const screenDelta = new THREE.Vector2(
          deltaX,
          deltaY
        );

        const projectedPixels = screenDelta.dot(
          active.screenDirection
        );

        const deltaAngle =
          projectedPixels *
          (Math.PI / 2) /
          DRAG_SENSITIVITY;

        active.angle += deltaAngle;

        updateDrag(active.angle);

        active.lastX = moveEvent.clientX;
        active.lastY = moveEvent.clientY;
      };

      // ------------------------------------------------
      // Pointer up / cancel
      // ------------------------------------------------

      const handlePointerEnd = (
        endEvent,
        cancelled = false
      ) => {
        const active = activePointerRef.current;

        if (
          !active ||
          endEvent.pointerId !== active.pointerId
        ) {
          return;
        }

        if (active.dragging) {
          finishDrag();
        } else if (!cancelled && !active.moved) {
          const selectedProject = active.selection.project;

          if (
            selectedProject?.id &&
            active.selection.facingCamera &&
            active.selection.sameSide
          ) {
            onSelectProject?.(selectedProject);
          }
        }

        cleanupPointer();
      };

      const handlePointerUp = (upEvent) =>
        handlePointerEnd(upEvent, false);

      const handlePointerCancel = (cancelEvent) =>
        handlePointerEnd(cancelEvent, true);

      window.addEventListener(
        "pointermove",
        handlePointerMove
      );

      window.addEventListener(
        "pointerup",
        handlePointerUp
      );

      window.addEventListener(
        "pointercancel",
        handlePointerCancel
      );

      cleanupPointerRef.current = () => {
        window.removeEventListener(
          "pointermove",
          handlePointerMove
        );

        window.removeEventListener(
          "pointerup",
          handlePointerUp
        );

        window.removeEventListener(
          "pointercancel",
          handlePointerCancel
        );
      };
    },
    [
      enabled,
      dragEnabled,
      focusedProjectId,
      restrictToFocusedSide,
      blocks,
      cubeRootRef,
      size,
      spacing,
      beginDrag,
      updateDrag,
      finishDrag,
      onSelectProject,
      cleanupPointer,
    ]
  );

  return handlePointerDown;
}
