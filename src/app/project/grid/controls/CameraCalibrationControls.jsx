import React, { useEffect, useState } from "react";

import VectorFields from "./VectorFields";
import ZoomSlider from "./ZoomSlider";

const DEFAULT_CAMERA = {
  position: [0, 1.5, 6],
  target: [0, 0, 0],
  zoomPercent: 50,
};

function readVector(value, fallback) {
  if (Array.isArray(value) && value.length >= 3) {
    return value.slice(0, 3).map(Number);
  }

  if (
    value &&
    typeof value.x === "number" &&
    typeof value.y === "number" &&
    typeof value.z === "number"
  ) {
    return [value.x, value.y, value.z];
  }

  return fallback;
}

export default function CameraCalibrationControls({
  cameraControlRef,
}) {
  const [cameraConnected, setCameraConnected] =
    useState(false);

  const [cameraPosition, setCameraPosition] =
    useState(DEFAULT_CAMERA.position);

  const [cameraTarget, setCameraTarget] =
    useState(DEFAULT_CAMERA.target);

  const [zoomPercent, setZoomPercent] =
    useState(DEFAULT_CAMERA.zoomPercent);

  const [capturedPose, setCapturedPose] =
    useState(null);

  const [cameraStatus, setCameraStatus] =
    useState("Camera calibration unavailable");

  const cameraDisabled = !cameraConnected;

  // --------------------------------------------------
  // Camera API connection and synchronization
  // --------------------------------------------------

  useEffect(() => {
    let initialized = false;

    const syncCamera = () => {
      const api = cameraControlRef?.current;

      if (!api) {
        setCameraConnected(false);
        return;
      }

      setCameraConnected(true);

      const state = api.getState?.();

      if (!state) return;

      if (!initialized) {
        setCameraPosition(
          readVector(
            state.position,
            DEFAULT_CAMERA.position
          )
        );

        setCameraTarget(
          readVector(
            state.target,
            DEFAULT_CAMERA.target
          )
        );

        initialized = true;
        setCameraStatus("Camera connected");
      }

      // Keep the slider synchronized with actual camera FOV.
      if (Number.isFinite(Number(state.zoomPercent))) {
        setZoomPercent(
          Math.max(
            0,
            Math.min(100, Number(state.zoomPercent))
          )
        );
      }
    };

    syncCamera();

    const interval = window.setInterval(
      syncCamera,
      100
    );

    return () => window.clearInterval(interval);
  }, [cameraControlRef]);

  // --------------------------------------------------
  // Camera position and target
  // --------------------------------------------------

  const handleApplyCameraPosition = () => {
    const api = cameraControlRef?.current;

    if (!api?.setCameraPosition) return;

    api.setCameraPosition(cameraPosition);
    setCameraStatus("Camera position updated");
  };

  const handleApplyCameraTarget = () => {
    const api = cameraControlRef?.current;

    if (!api?.setLookAtTarget) return;

    api.setLookAtTarget(cameraTarget);
    setCameraStatus("Look-at target updated");
  };

  // --------------------------------------------------
  // Zoom
  // --------------------------------------------------

  const handleZoomChange = (value) => {
    setZoomPercent(value);

    cameraControlRef?.current?.setZoomPercent?.(value);

    setCameraStatus(
      `Camera zoom: ${Math.round(value)}%`
    );
  };

  // --------------------------------------------------
  // Reset camera
  // --------------------------------------------------

  const handleResetCamera = () => {
    const api = cameraControlRef?.current;

    if (!api?.resetCamera) return;

    api.resetCamera();

    const state = api.getState?.();

    if (state) {
      setCameraPosition(
        readVector(
          state.position,
          DEFAULT_CAMERA.position
        )
      );

      setCameraTarget(
        readVector(
          state.target,
          DEFAULT_CAMERA.target
        )
      );

      if (Number.isFinite(Number(state.zoomPercent))) {
        setZoomPercent(Number(state.zoomPercent));
      }
    }

    setCameraStatus("Camera reset");
  };

  // --------------------------------------------------
  // Capture and copy pose
  // --------------------------------------------------

  const handleCapturePose = () => {
    const api = cameraControlRef?.current;

    if (!api?.capturePose) return;

    const pose = api.capturePose();

    if (!pose) {
      setCameraStatus("Could not capture pose");
      return;
    }

    setCapturedPose(pose);
    setCameraStatus("Pose captured");
  };

  const handleCopyPose = async () => {
    if (!capturedPose) return;

    try {
      await navigator.clipboard.writeText(
        JSON.stringify(capturedPose, null, 2)
      );

      setCameraStatus("Pose JSON copied to clipboard");
    } catch (error) {
      console.error(
        "Could not copy camera pose:",
        error
      );

      setCameraStatus("Clipboard access unavailable");
    }
  };

  // --------------------------------------------------
  // Render
  // --------------------------------------------------

  return (
    <section className="cube-controls__section cube-controls__camera">
      <div className="cube-controls__section-heading">
        <span>CAMERA CALIBRATION</span>

        <span className="cube-controls__subheading">
          DEVELOPMENT
        </span>
      </div>

      <ZoomSlider
        value={zoomPercent}
        disabled={cameraDisabled}
        onChange={handleZoomChange}
      />

      <VectorFields
        label="CAMERA POSITION"
        prefix="camera-position"
        values={cameraPosition}
        onChange={setCameraPosition}
      />

      <button
        className="cube-controls__text-button cube-controls__apply-button"
        type="button"
        disabled={cameraDisabled}
        onClick={handleApplyCameraPosition}
      >
        APPLY POSITION
      </button>

      <VectorFields
        label="LOOK-AT TARGET"
        prefix="camera-target"
        values={cameraTarget}
        onChange={setCameraTarget}
      />

      <button
        className="cube-controls__text-button cube-controls__apply-button"
        type="button"
        disabled={cameraDisabled}
        onClick={handleApplyCameraTarget}
      >
        APPLY TARGET
      </button>

      <div className="cube-controls__camera-actions">
        <button
          className="cube-controls__text-button"
          type="button"
          disabled={cameraDisabled}
          onClick={handleResetCamera}
        >
          RESET CAMERA
        </button>

        <button
          className="cube-controls__text-button"
          type="button"
          disabled={cameraDisabled}
          onClick={handleCapturePose}
        >
          CAPTURE POSE
        </button>
      </div>

      {capturedPose && (
        <div className="cube-controls__captured-pose">
          <div className="cube-controls__captured-heading">
            <span>CAPTURED POSE</span>

            <button
              className="cube-controls__text-button"
              type="button"
              onClick={handleCopyPose}
            >
              COPY JSON
            </button>
          </div>

          <pre>
            {JSON.stringify(capturedPose, null, 2)}
          </pre>
        </div>
      )}

      <p
        className="cube-controls__camera-status"
        role="status"
      >
        <span
          className={`cube-controls__status-dot ${
            cameraConnected
              ? "is-ready"
              : "is-disconnected"
          }`}
        />

        {cameraStatus}
      </p>
    </section>
  );
}