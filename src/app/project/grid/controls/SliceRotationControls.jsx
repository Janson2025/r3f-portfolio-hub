
import React from "react";
import gridParams from "../params/grid.json";

const AXES = ["y", "x", "z"];
const CUBE_SIZE = gridParams.dimensions?.[0] ?? 3;

export default function SliceRotationControls({
  disabled,
  onRotate,
}) {
  return (
    <section className="cube-controls__section">
      <div className="cube-controls__section-heading">
        <span>SLICE ROTATION</span>

        <span className="cube-controls__subheading">
          SELECT A LAYER
        </span>
      </div>

      {AXES.map((axis) => (
        <div
          className="cube-controls__axis-row"
          key={axis}
        >
          <span
            className="cube-controls__axis-label"
            aria-label={`${axis.toUpperCase()} axis`}
          >
            {axis.toUpperCase()}
          </span>

          <div className="cube-controls__slice-buttons">
            {Array.from(
              { length: CUBE_SIZE },
              (_, layer) => (
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
                  onClick={(event) =>
                    onRotate(axis, layer, event)
                  }
                >
                  {layer + 1}
                </button>
              )
            )}
          </div>
        </div>
      ))}

      <p className="cube-controls__note">
        Hold X, Y, or Z and press a number to repeat a
        slice turn. Hold Shift to reverse the direction.
        You can also drag a cube face.
      </p>
    </section>
  );
}
