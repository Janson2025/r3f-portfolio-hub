
import React from "react";

export default function ControlPanelStatus({
  connected,
  busy,
  status,
}) {
  const message = !connected
    ? "Cube controls disconnected"
    : busy
      ? status
      : status === "Connecting to cube…"
        ? "Ready for a turn"
        : status;

  const stateClass = !connected
    ? "is-disconnected"
    : busy
      ? "is-busy"
      : "is-ready";

  return (
    <p className="cube-controls__status" role="status">
      <span
        className={`cube-controls__status-dot ${stateClass}`}
      />

      {message}
    </p>
  );
}
