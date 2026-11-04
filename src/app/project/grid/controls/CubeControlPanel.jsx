import React, { useEffect, useMemo, useState } from "react";
import gridParams from "../params/grid.json";

const AXES = ["y", "x", "z"];
const CUBE_SIZE = gridParams.dimensions?.[0] ?? 3;

function formatMove(move) {
  const axis = move.axis.toUpperCase();
  const layer = move.layer + 1;
  const turns = move.quarterTurns;

  if (turns === -1) return `${axis}${layer}'`;
  if (Math.abs(turns) === 2) return `${axis}${layer}2`;
  return `${axis}${layer}`;
}

export default function CubeControlPanel({ gridRef }) {
  const [expanded, setExpanded] = useState(false);
  const [snapshot, setSnapshot] = useState({
    connected: false,
    busy: false,
    moves: [],
    cursor: 0,
    total: 0,
    canUndo: false,
    canRedo: false,
  });
  const [status, setStatus] = useState("Connecting to cube…");

  // The R3F child owns the engine. Poll its small public control API so this
  // DOM component can remain outside Canvas without duplicating cube state.
  useEffect(() => {
    let previousBusy = false;

    const sync = () => {
      const api = gridRef.current?.devAPI;

      if (!api) {
        setSnapshot((current) =>
          current.connected
            ? {
                connected: false,
                busy: false,
                moves: [],
                cursor: 0,
                total: 0,
                canUndo: false,
                canRedo: false,
              }
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

  const api = gridRef.current?.devAPI;
  const disabled = !snapshot.connected || snapshot.busy;

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

  const rotateSlice = (axis, layer, event) => {
    const direction = event.shiftKey ? -1 : 1;
    const started = api?.rotate?.(axis, layer, direction);

    if (started) {
      setStatus(`Rotating ${axis.toUpperCase()} slice ${layer + 1}`);
    }
  };

  const handleUndo = () => {
    if (api?.undo?.()) setStatus("Undoing last move…");
  };

  const handleRedo = () => {
    if (api?.redo?.()) setStatus("Redoing move…");
  };

  const handleScramble = () => {
    if (api?.scramble?.()) setStatus("Scrambling cube…");
  };

  const handleClear = () => {
    if (api?.clearHistory?.()) setStatus("Move history cleared");
  };

  const handleReplay = (move) => {
    if (api?.playMove?.(move)) {
      setStatus(`Playing ${formatMove(move)} again`);
    }
  };

  return (
    <aside className={`cube-controls ${expanded ? "is-expanded" : ""}`}>
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
          <span className="cube-controls__chevron" aria-hidden="true">
            ⌃
          </span>
        </span>
      </button>

      {expanded && (
        <div id="cube-controls-content" className="cube-controls__content">
          <section className="cube-controls__section">
            <div className="cube-controls__section-heading">
              <span>SLICE ROTATION</span>
              <span className="cube-controls__subheading">SELECT A LAYER</span>
            </div>

            {AXES.map((axis) => (
              <div className="cube-controls__axis-row" key={axis}>
                <span
                  className="cube-controls__axis-label"
                  aria-label={`${axis.toUpperCase()} axis`}
                >
                  {axis.toUpperCase()}
                </span>

                <div className="cube-controls__slice-buttons">
                  {Array.from({ length: CUBE_SIZE }, (_, layer) => (
                    <button
                      className="cube-controls__slice-button"
                      key={layer}
                      type="button"
                      disabled={disabled}
                      title={`Rotate ${axis.toUpperCase()} axis, slice ${
                        layer + 1
                      }. Hold Shift to reverse.`}
                      aria-label={`Rotate ${axis.toUpperCase()} axis slice ${
                        layer + 1
                      }`}
                      onClick={(event) => rotateSlice(axis, layer, event)}
                    >
                      {layer + 1}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <p className="cube-controls__note">
              Hold X, Y, or Z and press a number to repeat a slice turn.
              Hold Shift to reverse the direction. You can also drag a cube
              face.
            </p>
          </section>

          <section className="cube-controls__section">
            <div className="cube-controls__section-heading cube-controls__history-heading">
              <span>MOVE HISTORY</span>

              <div className="cube-controls__history-actions">
                <button
                  className="cube-controls__icon-button"
                  type="button"
                  disabled={disabled || !snapshot.canUndo}
                  aria-label="Undo move"
                  title="Undo"
                  onClick={handleUndo}
                >
                  ↶
                </button>

                <button
                  className="cube-controls__icon-button"
                  type="button"
                  disabled={disabled || !snapshot.canRedo}
                  aria-label="Redo move"
                  title="Redo"
                  onClick={handleRedo}
                >
                  ↷
                </button>

                <button
                  className="cube-controls__text-button"
                  type="button"
                  disabled={disabled}
                  onClick={handleScramble}
                >
                  SCRAMBLE
                </button>

                <button
                  className="cube-controls__text-button"
                  type="button"
                  disabled={disabled || snapshot.total === 0}
                  onClick={handleClear}
                >
                  CLEAR
                </button>
              </div>
            </div>

            <div className="cube-controls__move-history" aria-live="polite">
              {moveItems.length === 0 ? (
                <p className="cube-controls__history-empty">No moves yet</p>
              ) : (
                moveItems.map((item) => (
                  <button
                    className={[
                      "cube-controls__history-move",
                      item.applied ? "is-applied" : "",
                      item.latest ? "is-latest" : "",
                    ].join(" ")}
                    key={`${item.index}-${item.label}`}
                    type="button"
                    disabled={disabled}
                    title={`Play ${item.label} again`}
                    aria-label={`Play move ${item.label} again`}
                    onClick={() => handleReplay(item.move)}
                  >
                    {item.label}
                  </button>
                ))
              )}
            </div>
          </section>

          <p className="cube-controls__status" role="status">
            <span
              className={`cube-controls__status-dot ${
                snapshot.connected
                  ? snapshot.busy
                    ? "is-busy"
                    : "is-ready"
                  : "is-disconnected"
              }`}
            />

            {snapshot.connected
              ? snapshot.busy
                ? status
                : status === "Connecting to cube…"
                  ? "Ready for a turn"
                  : status
              : "Cube controls disconnected"}
          </p>
        </div>
      )}
    </aside>
  );
}