
import * as THREE from "three";

import { gridToWorld } from "./gridMath.js";

import {
  orientationToQuaternion,
  getWorldFaceMap,
} from "./orientation.js";

import { assertCubeState } from "./cubeValidation.js";

/**
 * Convert a logical cube state into render-ready cubie data.
 *
 * The engine remains responsible for logical state.
 * This module translates that state into Three.js transforms.
 *
 * @param {Object} state - Logical cube state
 * @param {Object} options - Rendering configuration
 * @returns {Array} Render-ready cubie data
 */
export function buildCubeRenderData(
  state,
  { spacing = 1.03 } = {}
) {
  assertCubeState(state);

  return state.cubies.map((cubie) => {
    const worldPosition = gridToWorld(
      cubie.position,
      state.size,
      spacing
    );

    const quaternion = orientationToQuaternion(
      cubie.orientation
    );

    const faceMap = getWorldFaceMap(
      cubie.orientation
    );

    return {
      id: cubie.id,

      // Permanent cubie identity.
      originalPosition: { ...cubie.originalPosition },

      // Current logical position.
      gridPosition: { ...cubie.position },

      // Three.js world transform.
      position: new THREE.Vector3(
        worldPosition.x,
        worldPosition.y,
        worldPosition.z
      ),

      quaternion,

      // Maps current world-facing sides to original faces.
      faceMap,
    };
  });
}

/**
 * Build render data for one cubie by its permanent ID.
 */
export function buildCubieRenderData(
  state,
  cubieId,
  options = {}
) {
  const cubie = state.cubies.find(
    (item) => item.id === cubieId
  );

  if (!cubie) {
    throw new Error(`Cubie with ID ${cubieId} was not found.`);
  }

  const renderData = buildCubeRenderData(state, options);

  return renderData.find((item) => item.id === cubieId);
}
