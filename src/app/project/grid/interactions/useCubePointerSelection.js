
import { useCallback, useEffect, useRef } from "react";
import * as THREE from "three";

import { FACE_NORMAL } from "../../block/constrants.js";

import {
  chooseGestureRotation,
} from "./gestureRotation.js";

const DRAG_THRESHOLD = 6;
const DRAG_SENSITIVITY = 120;

/**
 * Handles sticker selection and pointer-driven slice rotation.
 *
 * The cube rotation controller owns all pivot manipulation.
 * This hook only interprets pointer gestures and supplies angles.
 */
export default function useCubePointerSelection({
  cubeRootRef,
  blocks,
  size = 3,
  spacing = 1,

  beginDrag,
  updateDrag,
  finishDrag,
}) {
  const lastSelectionRef = useRef(null);
  const activePointerRef = useRef(null);
  const cleanupPointerRef = useRef(null);

  // --------------------------------------------------
  // Pointer cleanup
  // --------------------------------------------------

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

  // --------------------------------------------------
  // Pointer down
  // --------------------------------------------------

  const handlePointerDown = useCallback(
    (event, metadata = {}) => {
      if (event.button != null && event.button !== 0) {
        return;
      }

      if (activePointerRef.current) {
        return;
      }

      // Prevent the outer scene's drag controller from
      // interpreting a sticker interaction as cube orbiting.
      event.stopPropagation?.();

      const {
        cubieId,
        face,
      } = metadata;

      // Support both metadata names while keeping the
      // current logical position as the preferred value.
      const gridPositionInput =
        metadata.gridPosition ?? metadata.blockIndex;

      if (!gridPositionInput) return;

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

      const canvas =
        nativeEvent.target?.getBoundingClientRect
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

      // Update transforms before coordinate conversions.
      cubeRoot.updateWorldMatrix(true, true);
      block.updateWorldMatrix(true, false);

      const blockWorldQuaternion = block.getWorldQuaternion(
        new THREE.Quaternion()
      );

      const cubeWorldQuaternion = cubeRoot.getWorldQuaternion(
        new THREE.Quaternion()
      );

      // Convert the original sticker normal into cube-local space.
      const normalInCubeSpace = new THREE.Vector3(...faceNormal)
        .normalize()
        .applyQuaternion(blockWorldQuaternion)
        .applyQuaternion(cubeWorldQuaternion.invert());

      normalInCubeSpace.set(
        Math.round(normalInCubeSpace.x),
        Math.round(normalInCubeSpace.y),
        Math.round(normalInCubeSpace.z)
      ).normalize();

      // Convert the raycast hit point into cube-local coordinates.
      const hitPointInCubeSpace = cubeRoot.worldToLocal(
        event.point.clone()
      );

      const selection = {
        cubieId,
        gridPosition,
        face,

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

        // ----------------------------------------------
        // Determine which slice should rotate.
        // ----------------------------------------------

        if (!active.dragging) {
          const distance = Math.hypot(totalX, totalY);

          if (distance < DRAG_THRESHOLD) {
            return;
          }

          const { selection } = active;

          const result = chooseGestureRotation({
            faceNormal: new THREE.Vector3(
              selection.faceNormal.x,
              selection.faceNormal.y,
              selection.faceNormal.z
            ),

            hitPoint: new THREE.Vector3(
              selection.hitPoint.x,
              selection.hitPoint.y,
              selection.hitPoint.z
            ),

            gridPosition: selection.gridPosition,

            deltaX: totalX,
            deltaY: totalY,

            size,
            spacing,

            cubeRoot: active.cubeRoot,
            camera: active.camera,
            canvas: active.canvas,
          });

          if (!result) {
            return;
          }

          // Begin the actual visual slice rotation.
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
              cubieId: selection.cubieId,
              face: selection.face,

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

          // Apply the entire movement from pointer-down,
          // including the movement that crossed the threshold.
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

        // ----------------------------------------------
        // Update an existing slice rotation.
        // ----------------------------------------------

        const deltaX = moveEvent.clientX - active.lastX;
        const deltaY = moveEvent.clientY - active.lastY;

        const screenDelta = new THREE.Vector2(
          deltaX,
          deltaY
        );

        // The dot product already determines the sign.
        // Do not multiply by result.direction again.
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

      const handlePointerEnd = (endEvent) => {
        const active = activePointerRef.current;

        if (
          !active ||
          endEvent.pointerId !== active.pointerId
        ) {
          return;
        }

        if (active.dragging) {
          finishDrag();
        }

        cleanupPointer();
      };

      // Listen globally so dragging can continue beyond
      // the original sticker mesh.
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerEnd);
      window.addEventListener("pointercancel", handlePointerEnd);

      cleanupPointerRef.current = () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerEnd);
        window.removeEventListener("pointercancel", handlePointerEnd);
      };
    },
    [
      blocks,
      cubeRootRef,
      size,
      spacing,
      beginDrag,
      updateDrag,
      finishDrag,
      cleanupPointer,
    ]
  );

  return handlePointerDown;
}
