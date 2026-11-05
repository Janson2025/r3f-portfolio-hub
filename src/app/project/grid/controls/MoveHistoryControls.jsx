
import React from "react";

export default function MoveHistoryControls({
  disabled,
  snapshot,
  moveItems,
  onUndo,
  onRedo,
  onScramble,
  onClear,
  onReplay,
}) {
  return (
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
            onClick={onUndo}
          >
            ↶
          </button>

          <button
            className="cube-controls__icon-button"
            type="button"
            disabled={disabled || !snapshot.canRedo}
            aria-label="Redo move"
            title="Redo"
            onClick={onRedo}
          >
            ↷
          </button>

          <button
            className="cube-controls__text-button"
            type="button"
            disabled={disabled}
            onClick={onScramble}
          >
            SCRAMBLE
          </button>

          <button
            className="cube-controls__text-button"
            type="button"
            disabled={disabled || snapshot.total === 0}
            onClick={onClear}
          >
            CLEAR
          </button>
        </div>
      </div>

      <div
        className="cube-controls__move-history"
        aria-live="polite"
      >
        {moveItems.length === 0 ? (
          <p className="cube-controls__history-empty">
            No moves yet
          </p>
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
              onClick={() => onReplay(item.move)}
            >
              {item.label}
            </button>
          ))
        )}
      </div>
    </section>
  );
}
