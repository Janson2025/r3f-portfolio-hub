
import React, {
  useMemo,
  useState,
  forwardRef,
  useImperativeHandle,
  createRef,
  useCallback,
  useRef,
  useEffect,
} from "react";

import Block from "../block/Block";
import gridParams from "./params/grid.json";
import stickerData from "../sticker/params/stickers.json";

const customStickers = stickerData.projects;

import { createCubeEngine } from "./engine/cubeEngine.js";
import { buildBlockRenderProps } from "./engine/cubeRenderAdapter.js";
import {
    createProjectStickerOverrides,
} from "./engine/projectAssignment.js";

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
  {
    onActivateSticker,
    frameReady,
    interactionsEnabled = true,
    showProjectPortals = true,
  },
  ref
) {
  // --------------------------------------------------
  // Grid configuration
  // --------------------------------------------------

  const dims = gridParams.dimensions ?? [3, 3, 3];

  const [dx, dy, dz] = dims;

  if (dx !== dy || dy !== dz) {
    throw new Error(
      "GridCube currently requires equal dimensions on all three axes."
    );
  }

  const overallSize = gridParams.overallSize ?? 3.06;
  const gap = gridParams.gap ?? 0.03;

  if (
    !Number.isInteger(dx) ||
    dx < 1 ||
    !Number.isFinite(overallSize) ||
    overallSize <= 0 ||
    !Number.isFinite(gap) ||
    gap < 0
  ) {
    throw new Error("Invalid grid configuration.");
  }

  // Calculate the physical dimensions of each cubie.
  const cubieSize = (overallSize - (dx - 1) * gap) / dx;

  if (cubieSize <= 0) {
    throw new Error("Grid gap is too large for the configured cube size.");
  }

  // Center-to-center distance between neighboring cubies.
  const spacing = cubieSize + gap;

  // Convenient layer indices.
  const firstLayer = 0;
  const lastLayer = dx - 1;
  const middleLayer = Math.floor(dx / 2);

  // --------------------------------------------------
  // Cube engine
  // --------------------------------------------------

  const [engine] = useState(() => createCubeEngine(dx));

  const [revision, setRevision] = useState(0);

  const sequenceRef = useRef(null);

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
      if (
        !interactionsEnabled ||
        sequenceRef.current
      ) {
        return false;
      }

      return rotateSlice(
        axis,
        layer,
        direction >= 0 ? 1 : -1
      );
    },
    [rotateSlice, interactionsEnabled]
  );

  // --------------------------------------------------
  // Animated move sequences
  // --------------------------------------------------

  const startNextSequenceMove = useCallback(() => {
    const sequence = sequenceRef.current;

    if (!sequence) return false;
    if (sequence.waitingForRender) return false;

    if (sequence.index >= sequence.moves.length) {
      sequenceRef.current = null;
      return true;
    }

    const move = sequence.moves[sequence.index];

    const started = rotateSlice(
      move.axis,
      move.layer,
      move.quarterTurns,
      {
        onComplete: () => {
          sequence.index += 1;
          sequence.waitingForRender = true;
        },
      }
    );

    if (!started) {
      sequenceRef.current = null;
      return false;
    }

    return true;
  }, [rotateSlice]);

  useEffect(() => {
    const sequence = sequenceRef.current;

    if (!sequence || !sequence.waitingForRender) return;

    sequence.waitingForRender = false;

    if (sequence.index >= sequence.moves.length) {
      sequenceRef.current = null;
      return;
    }

    startNextSequenceMove();
  }, [revision, startNextSequenceMove]);

  const playSequence = useCallback(
    (moves) => {
      if (
        !interactionsEnabled ||
        !Array.isArray(moves) ||
        moves.length === 0 ||
        rotationBusy() ||
        sequenceRef.current
      ) {
        return false;
      }

      const sequence = {
        moves: moves.map((move) => ({ ...move })),
        index: 0,
        waitingForRender: false,
      };

      sequenceRef.current = sequence;

      const started = startNextSequenceMove();

      if (!started) {
        sequenceRef.current = null;
        return false;
      }

      return true;
    },
    [
      interactionsEnabled,
      rotationBusy,
      startNextSequenceMove,
    ]
  );

  // --------------------------------------------------
  // Scramble
  // --------------------------------------------------

  const scramble = useCallback(() => {
    if (
      !interactionsEnabled ||
      rotationBusy() ||
      sequenceRef.current
    ) {
      return false;
    }

    const moves = [];
    let previousKey = "";

    const moveCount = Math.max(20, dx * 8);

    for (let index = 0; index < moveCount; index += 1) {
      let axis;
      let layer;
      let key;

      do {
        axis = ["x", "y", "z"][
          Math.floor(Math.random() * 3)
        ];

        layer = Math.floor(Math.random() * dx);
        key = `${axis}:${layer}`;
      } while (key === previousKey && dx > 1);

      previousKey = key;

      moves.push({
        axis,
        layer,
        quarterTurns: Math.random() < 0.5 ? -1 : 1,
      });
    }

    return playSequence(moves);
  }, [
    dx,
    interactionsEnabled,
    playSequence,
    rotationBusy,
  ]);

  // --------------------------------------------------
  // Undo
  // --------------------------------------------------

  const undo = useCallback(() => {
    if (
      !interactionsEnabled ||
      rotationBusy() ||
      sequenceRef.current ||
      !engine.canUndo()
    ) {
      return false;
    }

    const entry = engine.getHistory().at(-1);

    if (!entry) return false;

    return rotateSlice(
      entry.move.axis,
      entry.move.layer,
      -entry.move.quarterTurns,
      {
        commitMove: () => engine.undo(),
      }
    );
  }, [
    interactionsEnabled,
    engine,
    rotateSlice,
    rotationBusy,
  ]);

  // --------------------------------------------------
  // Redo
  // --------------------------------------------------

  const redo = useCallback(() => {
    if (
      !interactionsEnabled ||
      rotationBusy() ||
      sequenceRef.current ||
      !engine.canRedo()
    ) {
      return false;
    }

    const entry = engine.getRedoHistory().at(-1);

    if (!entry) return false;

    return rotateSlice(
      entry.move.axis,
      entry.move.layer,
      entry.move.quarterTurns,
      {
        commitMove: () => engine.redo(),
      }
    );
  }, [
    interactionsEnabled,
    engine,
    rotateSlice,
    rotationBusy,
  ]);

  // --------------------------------------------------
  // Clear history
  // --------------------------------------------------

  const clearHistory = useCallback(() => {
    if (
      !interactionsEnabled ||
      rotationBusy() ||
      sequenceRef.current
    ) {
      return false;
    }

    engine.clearHistory();

    setRevision((current) => current + 1);

    return true;
  }, [
    interactionsEnabled,
    engine,
    rotationBusy,
  ]);

  // --------------------------------------------------
  // Keyboard controls
  // --------------------------------------------------

  useCubeKeyboardControls({
    size: dx,
    performMove,
    rotationBusy,
    enabled: interactionsEnabled,
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

    enabled: interactionsEnabled,
  });

  // --------------------------------------------------
  // Sticker overrides
  // --------------------------------------------------

  const overrides = useMemo(() => {
      if (!showProjectPortals) {
          return new Map();
      }

      return createProjectStickerOverrides({
          projects: customStickers,
          dimensions: dims,
          seed:
              stickerData.defaults?.assignmentSeed ??
              "rubix-portfolio-v1",
      });
  }, [showProjectPortals, dims]);

  // --------------------------------------------------
  // Developer / HUD API
  // --------------------------------------------------

  useImperativeHandle(
    ref,
    () => ({
      devAPI: {
        rotate: (axis, layer, quarterTurns = 1) =>
          performMove(axis, layer, quarterTurns),

        rotateX: (layer, direction = 1) =>
          performMove("x", layer, direction),

        rotateY: (layer, direction = 1) =>
          performMove("y", layer, direction),

        rotateZ: (layer, direction = 1) =>
          performMove("z", layer, direction),

        // Outer and middle layers.
        x_left: (direction) =>
          performMove("x", firstLayer, direction),

        x_mid: (direction) =>
          performMove("x", middleLayer, direction),

        x_right: (direction) =>
          performMove("x", lastLayer, direction),

        y_front: (direction) =>
          performMove("y", firstLayer, direction),

        y_mid: (direction) =>
          performMove("y", middleLayer, direction),

        y_back: (direction) =>
          performMove("y", lastLayer, direction),

        z_bottom: (direction) =>
          performMove("z", firstLayer, direction),

        z_mid: (direction) =>
          performMove("z", middleLayer, direction),

        z_top: (direction) =>
          performMove("z", lastLayer, direction),

        undo,
        redo,
        clearHistory,

        scramble,
        playSequence,

        playMove: (move) =>
          performMove(
            move.axis,
            move.layer,
            move.quarterTurns
          ),

        getHistoryState: () => {
          const applied = engine.getHistory();
          const redoHistory = engine.getRedoHistory();

          return {
            moves: [
              ...applied,
              ...redoHistory.slice().reverse(),
            ],
            cursor: applied.length,
            total: applied.length + redoHistory.length,
            canUndo: engine.canUndo(),
            canRedo: engine.canRedo(),
          };
        },

        busy: () =>
          rotationBusy() || !!sequenceRef.current,
      },
    }),
    [
      performMove,
      undo,
      redo,
      clearHistory,
      scramble,
      playSequence,
      engine,
      rotationBusy,
      firstLayer,
      middleLayer,
      lastLayer,
    ]
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

        const {
          key: _adapterKey,
          ...blockProps
        } = cubie;

        return (
          <Block
            key={cubie.cubieId}
            {...blockProps}
            size={cubieSize}
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
      cubieSize,
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
