
import React, { useEffect, useMemo, useState } from "react";

import SliceRotationControls from "./SliceRotationControls";
import MoveHistoryControls from "./MoveHistoryControls";
import CameraCalibrationControls from "./CameraCalibrationControls";
import ControlPanelStatus from "./ControlPanelStatus";

const INITIAL_SNAPSHOT = {
  connected: false,
  busy: false,
  moves: [],
  cursor: 0,
  total: 0,
  canUndo: false,
  canRedo: false,
};

function formatMove(move) {
  const axis = move.axis.toUpperCase();
  const layer = move.layer + 1;
  const turns = move.quarterTurns;

  if (turns === -1) return `${axis}${layer}'`;
  if (Math.abs(turns) === 2) return `${axis}${layer}2`;

  return `${axis}${layer}`;
}

export default function CubeControlPanel({
  gridRef,
  cameraControlRef,
}) {
  const [expanded, setExpanded] = useState(false);
  const [snapshot, setSnapshot] = useState(INITIAL_SNAPSHOT);
  const [status, setStatus] = useState("Connecting to cube…");

  // --------------------------------------------------
  // Cube engine connection
  // --------------------------------------------------

  useEffect(() => {
    let previousBusy = false;

    const sync = () => {
      const api = gridRef.current?.devAPI;

      if (!api) {
        setSnapshot((current) =>
          current.connected
            ? { ...INITIAL_SNAPSHOT }
            : current
        );

        return;
      }

      const history = api.getHistoryState?.() ?? {};
      const busy = !!api.busy?.();

      setSnapshot({
        connected: true,
        busy,
        moves: history.moves ?? [],
        cursor: history.cursor ?? 0,
        total: history.total ?? 0,
        canUndo: !!history.canUndo,
        canRedo: !!history.canRedo,
      });

      if (previousBusy && !busy) {
        setStatus("Sequence complete");
      } else if (!previousBusy && busy) {
        setStatus("Rotation in progress…");
      }

      previousBusy = busy;
    };

    sync();

    const interval = window.setInterval(sync, 120);

    return () => window.clearInterval(interval);
  }, [gridRef]);

  // --------------------------------------------------
  // Derived state
  // --------------------------------------------------

  const disabled =
    !snapshot.connected || snapshot.busy;

  const moveItems = useMemo(
    () =>
      snapshot.moves.map((entry, index) => ({
        ...entry,
        index,
        label: formatMove(entry.move),
        applied: index < snapshot.cursor,
        latest: index === snapshot.cursor - 1,
      })),
    [snapshot.moves, snapshot.cursor]
  );

  // --------------------------------------------------
  // Cube actions
  // --------------------------------------------------

  const rotateSlice = (axis, layer, event) => {
    const api = gridRef.current?.devAPI;
    const direction = event.shiftKey ? -1 : 1;

    const started = api?.rotate?.(
      axis,
      layer,
      direction
    );

    if (started) {
      setStatus(
        `Rotating ${axis.toUpperCase()} slice ${layer + 1}`
      );
    }
  };

  const handleUndo = () => {
    if (gridRef.current?.devAPI?.undo?.()) {
      setStatus("Undoing last move…");
    }
  };

  const handleRedo = () => {
    if (gridRef.current?.devAPI?.redo?.()) {
      setStatus("Redoing move…");
    }
  };

  const handleScramble = () => {
    if (gridRef.current?.devAPI?.scramble?.()) {
      setStatus("Scrambling cube…");
    }
  };

  const handleClear = () => {
    if (gridRef.current?.devAPI?.clearHistory?.()) {
      setStatus("Move history cleared");
    }
  };

  const handleReplay = (move) => {
    if (gridRef.current?.devAPI?.playMove?.(move)) {
      setStatus(`Playing ${formatMove(move)} again`);
    }
  };

  // --------------------------------------------------
  // Render
  // --------------------------------------------------

  return (
    <aside
      className={[
        "cube-controls",
        expanded ? "is-expanded" : "",
      ].join(" ")}
    >
      <button
        className="cube-controls__toggle"
        type="button"
        aria-expanded={expanded}
        aria-controls="cube-controls-content"
        onClick={() => setExpanded((value) => !value)}
      >
        <span className="cube-controls__toggle-main">
          <span className="cube-controls__indicator" />
          <span>CUBE CONTROLS</span>
        </span>

        <span className="cube-controls__toggle-meta">
          <span>
            {snapshot.connected
              ? `${snapshot.cursor} / ${snapshot.total} MOVES`
              : "CONNECTING"}
          </span>

          <span
            className="cube-controls__chevron"
            aria-hidden="true"
          >
            ⌃
          </span>
        </span>
      </button>

      {expanded && (
        <div
          id="cube-controls-content"
          className="cube-controls__content"
        >
          <SliceRotationControls
            disabled={disabled}
            onRotate={rotateSlice}
          />

          <MoveHistoryControls
            disabled={disabled}
            snapshot={snapshot}
            moveItems={moveItems}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onScramble={handleScramble}
            onClear={handleClear}
            onReplay={handleReplay}
          />

          <CameraCalibrationControls
            cameraControlRef={cameraControlRef}
          />

          <ControlPanelStatus
            connected={snapshot.connected}
            busy={snapshot.busy}
            status={status}
          />
        </div>
      )}
    </aside>
  );
}
