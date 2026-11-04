
import { useEffect } from "react";

const KEY_REPEAT_INTERVAL = 350;

export default function useCubeKeyboardControls({
  size,
  performMove,
  rotationBusy,
}) {
  useEffect(() => {
    const heldAxisKeys = new Set();
    const heldNumberKeys = new Set();

    let activeAxis = null;
    let activeNumber = null;
    let reverseHeld = false;
    let repeatTimer = null;

    // ----------------------------------------------
    // Determine active axis
    // ----------------------------------------------

    function updateActiveAxis() {
      if (heldAxisKeys.has("KeyX")) {
        activeAxis = "x";
      } else if (heldAxisKeys.has("KeyY")) {
        activeAxis = "y";
      } else if (heldAxisKeys.has("KeyZ")) {
        activeAxis = "z";
      } else {
        activeAxis = null;
      }
    }

    // ----------------------------------------------
    // Stop continuous rotation
    // ----------------------------------------------

    function stopRepeating() {
      if (repeatTimer !== null) {
        window.clearInterval(repeatTimer);
        repeatTimer = null;
      }
    }

    // ----------------------------------------------
    // Execute rotation
    // ----------------------------------------------

    function executeRotation() {
      if (!activeAxis || !activeNumber) return;
      if (rotationBusy()) return;

      const layer = Number(activeNumber.slice(-1)) - 1;

      if (layer < 0 || layer >= size) return;

      const direction = reverseHeld ? -1 : 1;

      // Preserve the existing keyboard Y/Z swap.
      // The engine's underlying axis conventions do not change.
      const engineAxis =
        activeAxis === "y"
          ? "z"
          : activeAxis === "z"
            ? "y"
            : activeAxis;

      performMove(engineAxis, layer, direction);
    }

    // ----------------------------------------------
    // Start continuous rotation
    // ----------------------------------------------

    function updateRepeating() {
      if (!activeAxis || !activeNumber) {
        stopRepeating();
        return;
      }

      stopRepeating();

      // Perform the first rotation immediately.
      executeRotation();

      // Continue while both an axis and layer are held.
      repeatTimer = window.setInterval(() => {
        if (!activeAxis || !activeNumber) {
          stopRepeating();
          return;
        }

        executeRotation();
      }, KEY_REPEAT_INTERVAL);
    }

    // ----------------------------------------------
    // Keyboard down
    // ----------------------------------------------

    function onKeyDown(event) {
      const target = event.target;

      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable
      ) {
        return;
      }

      // Track Shift.
      if (
        event.code === "ShiftLeft" ||
        event.code === "ShiftRight"
      ) {
        reverseHeld = true;
        return;
      }

      // Axis selection.
      if (
        event.code === "KeyX" ||
        event.code === "KeyY" ||
        event.code === "KeyZ"
      ) {
        const wasHeld = heldAxisKeys.has(event.code);

        heldAxisKeys.add(event.code);
        updateActiveAxis();

        if (!wasHeld) {
          updateRepeating();
        }

        return;
      }

      // Number selection.
      const match = event.code.match(
        /^(?:Digit|Numpad)([1-9])$/
      );

      if (!match) return;

      const layer = Number(match[1]) - 1;

      if (layer >= size) return;

      event.preventDefault();

      const wasHeld = heldNumberKeys.has(event.code);

      heldNumberKeys.add(event.code);
      activeNumber = event.code;

      if (!wasHeld) {
        updateRepeating();
      }
    }

    // ----------------------------------------------
    // Keyboard up
    // ----------------------------------------------

    function onKeyUp(event) {
      if (
        event.code === "ShiftLeft" ||
        event.code === "ShiftRight"
      ) {
        reverseHeld = false;
        return;
      }

      if (
        event.code === "KeyX" ||
        event.code === "KeyY" ||
        event.code === "KeyZ"
      ) {
        heldAxisKeys.delete(event.code);
        updateActiveAxis();
        updateRepeating();
        return;
      }

      const match = event.code.match(
        /^(?:Digit|Numpad)([1-9])$/
      );

      if (!match) return;

      heldNumberKeys.delete(event.code);

      if (activeNumber === event.code) {
        activeNumber =
          [...heldNumberKeys].at(-1) ?? null;
      }

      updateRepeating();
    }

    // ----------------------------------------------
    // Window loses focus
    // ----------------------------------------------

    function onBlur() {
      heldAxisKeys.clear();
      heldNumberKeys.clear();

      activeAxis = null;
      activeNumber = null;
      reverseHeld = false;

      stopRepeating();
    }

    // ----------------------------------------------
    // Event listeners
    // ----------------------------------------------

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);

    return () => {
      stopRepeating();

      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [size, performMove, rotationBusy]);
}
