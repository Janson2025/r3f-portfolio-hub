
import { buildCubeRenderData } from "./cubeBuilder.js";

/**
 * Convert one render-ready cubie into props for the Block component.
 *
 * blockIndex remains the ORIGINAL position because the existing
 * sticker system uses it to determine sticker identity and overrides.
 *
 * gridPosition represents the cubie's CURRENT position.
 */
export function toBlockRenderProps(cubie) {
  const { originalPosition, gridPosition } = cubie;

  return {

    cubieId: cubie.id,

    // Original identity: used by the sticker configuration system.
    blockIndex: [
      originalPosition.x,
      originalPosition.y,
      originalPosition.z,
    ],

    // Current logical position: used for slice selection.
    gridPosition: [
      gridPosition.x,
      gridPosition.y,
      gridPosition.z,
    ],

    // Current Three.js transforms.
    position: cubie.position.toArray(),
    quaternion: cubie.quaternion.toArray(),

    // Maps current world-facing sides to original faces.
    faceMap: { ...cubie.faceMap },
  };
}

/**
 * Build Block component props for an entire cube.
 *
 * This function does not create React elements.
 * It only produces data that GridCube can use to render Blocks.
 */
export function buildBlockRenderProps(state, options = {}) {
  const renderData = buildCubeRenderData(state, options);

  return renderData.map(toBlockRenderProps);
}
