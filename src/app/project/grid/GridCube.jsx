
import React, {
  useMemo,
  useState,
  forwardRef,
  useImperativeHandle,
  createRef,
  useCallback,
  useRef,
} from "react";

import Block from "../block/Block";
import gridParams from "./params/grid.json";
import customStickers from "../sticker/params/stickers.json";

import { createCubeEngine } from "./engine/cubeEngine.js";
import { buildBlockRenderProps } from "./engine/cubeRenderAdapter.js";

import useCubeRotation from "./interactions/useCubeRotation.js";
import useCubePointerSelection from "./interactions/useCubePointerSelection.js";
import useCubeKeyboardControls from "./interactions/useCubeKeyboardControls.js";

// --------------------------------------------------
// Configuration
// --------------------------------------------------

const ANIMATION_DURATION = 250;

// --------------------------------------------------
// GridCube
// --------------------------------------------------

const GridCube = forwardRef(function GridCube(
  { onActivateSticker, frameReady },
  ref
) {
  // --------------------------------------------------
  // Grid configuration
  // --------------------------------------------------

  const dims = gridParams.dimensions ?? [3, 3, 3];
  const spacing = gridParams.spacing ?? 1.03;

  const [dx, dy, dz] = dims;

  if (dx !== dy || dy !== dz) {
    throw new Error(
      "GridCube currently requires equal dimensions on all three axes."
    );
  }

  // --------------------------------------------------
  // Cube engine
  // --------------------------------------------------

  const [engine] = useState(() => createCubeEngine(dx));
  const [revision, setRevision] = useState(0);

  const handleMoveComplete = useCallback(() => {
    setRevision((current) => current + 1);
  }, []);

  // --------------------------------------------------
  // Scene groups
  // --------------------------------------------------

  const cubeRootRef = useRef();
  const pivotRef = useRef();

  // --------------------------------------------------
  // Stable cubie references
  // --------------------------------------------------

  const [blocks] = useState(() =>
    Array.from({ length: dx * dy * dz }, (_, id) => ({
      id,
      ref: createRef(),
    }))
  );

  const getBlocks = useCallback(() => blocks, [blocks]);

  // --------------------------------------------------
  // Animated rotation controller
  // --------------------------------------------------

  const {
    rotate: rotateSlice,
    rotating: rotationBusy,
    beginDrag: beginSliceDrag,
    updateDrag: updateSliceDrag,
    finishDrag: finishSliceDrag,
  } = useCubeRotation({
    cubeRootRef,
    pivotRef,
    getBlocks,
    engine,
    onMoveComplete: handleMoveComplete,
    durationMs: ANIMATION_DURATION,
  });

  // --------------------------------------------------
  // Move API
  // --------------------------------------------------

  const performMove = useCallback(
    (axis, layer, direction = 1) => {
      return rotateSlice(
        axis,
        layer,
        direction >= 0 ? 1 : -1
      );
    },
    [rotateSlice]
  );

  // --------------------------------------------------
  // Keyboard controls
  // --------------------------------------------------

  useCubeKeyboardControls({
    size: dx,
    performMove,
    rotationBusy,
  });

  // --------------------------------------------------
  // Pointer selection and slice dragging
  // --------------------------------------------------

  const handleStickerPointerDown = useCubePointerSelection({
    cubeRootRef,
    blocks,
    size: dx,
    spacing,

    beginDrag: beginSliceDrag,
    updateDrag: updateSliceDrag,
    finishDrag: finishSliceDrag,
  });

  // --------------------------------------------------
  // Sticker overrides
  // --------------------------------------------------

  const overrides = useMemo(() => {
    const map = new Map();

    for (const sticker of customStickers) {
      const key =
        `${sticker.block[0]},${sticker.block[1]},${sticker.block[2]}:${sticker.face}`;

      map.set(key, sticker);
    }

    return map;
  }, []);

  // --------------------------------------------------
  // Developer / HUD API
  // --------------------------------------------------

  useImperativeHandle(
    ref,
    () => ({
      devAPI: {
        rotateX: (layer, direction) =>
          performMove("x", layer, direction),

        rotateY: (layer, direction) =>
          performMove("y", layer, direction),

        rotateZ: (layer, direction) =>
          performMove("z", layer, direction),

        // X-axis aliases
        x_left: (direction) =>
          performMove("x", 0, direction),

        x_mid: (direction) =>
          performMove("x", 1, direction),

        x_right: (direction) =>
          performMove("x", 2, direction),

        // Y-axis aliases
        y_front: (direction) =>
          performMove("y", 0, direction),

        y_mid: (direction) =>
          performMove("y", 1, direction),

        y_back: (direction) =>
          performMove("y", 2, direction),

        // Z-axis aliases
        z_bottom: (direction) =>
          performMove("z", 0, direction),

        z_mid: (direction) =>
          performMove("z", 1, direction),

        z_top: (direction) =>
          performMove("z", 2, direction),

        busy: () => rotationBusy(),
      },
    }),
    [performMove, rotationBusy]
  );

  // --------------------------------------------------
  // Build render data from engine state
  // --------------------------------------------------

  const renderProps = useMemo(
    () =>
      buildBlockRenderProps(engine.getState(), {
        spacing,
      }),
    [engine, revision, spacing]
  );

  // --------------------------------------------------
  // Render cubies
  // --------------------------------------------------

  const blockElements = useMemo(
    () =>
      renderProps.map((cubie) => {
        const block = blocks[cubie.cubieId];

        const { key: _adapterKey, ...blockProps } = cubie;

        return (
          <Block
            key={cubie.cubieId}
            {...blockProps}
            size={1.0}
            gridDims={dims}
            overrides={overrides}
            onActivateSticker={onActivateSticker}
            frameReady={frameReady}
            onStickerPointerDown={handleStickerPointerDown}
            forwardRef={block.ref}
          />
        );
      }),
    [
      renderProps,
      blocks,
      dims,
      overrides,
      onActivateSticker,
      frameReady,
      handleStickerPointerDown,
    ]
  );

  // --------------------------------------------------
  // Scene
  // --------------------------------------------------

  return (
    <group ref={cubeRootRef}>
      <group ref={pivotRef} />
      {blockElements}
    </group>
  );
});

export default GridCube;
