import React from "react";

export default function ZoomSlider({
  value,
  disabled = false,
  onChange,
}) {
  return (
    <div className="cube-controls__zoom-control">
      <div className="cube-controls__zoom-heading">
        <label htmlFor="camera-zoom">
          CAMERA ZOOM
        </label>

        <output htmlFor="camera-zoom">
          {Math.round(value)}%
        </output>
      </div>

      <input
        id="camera-zoom"
        className="cube-controls__zoom-slider"
        type="range"
        min="0"
        max="100"
        step="1"
        value={value}
        disabled={disabled}
        onChange={(event) =>
          onChange(Number(event.target.value))
        }
      />

      <div className="cube-controls__zoom-labels">
        <span>MORE ZOOM</span>
        <span>WIDER VIEW</span>
      </div>

      <p className="cube-controls__note">
        20% is the default Project View zoom.
        50% is the default Cube View zoom.
        Changes apply immediately while dragging.
      </p>
    </div>
  );
}