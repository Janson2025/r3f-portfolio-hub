// src/scene/interactions/useOverlayController.js
import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * Controls the project iframe overlay:
 * - visible/ready state
 * - current target URL (per-click)
 * - preconnect on URL change
 * - Esc to close
 * - history (#project) so browser Back closes the overlay
 */
export default function useOverlayController() {
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);
  const [targetUrl, setTargetUrl] = useState(null);

  const targetOrigin = useMemo(
    () => (targetUrl ? new URL(targetUrl).origin : ""),
    [targetUrl]
  );

  // Preconnect when URL changes
  useEffect(() => {
    if (!targetOrigin) return;
    const l = document.createElement("link");
    l.rel = "preconnect";
    l.href = targetOrigin;
    document.head.appendChild(l);
    return () => document.head.removeChild(l);
  }, [targetOrigin]);

  // Esc + browser Back close behavior
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && visible && hide();
    const onPop = () => visible && hide(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("popstate", onPop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const show = useCallback((href) => {
    setTargetUrl(href);
    try { window.history.pushState({ overlay: "project" }, "", "#project"); } catch {}
    setVisible(true);
  }, []);

  const hide = useCallback((fromPopstate = false) => {
    setVisible(false);
    setReady(false);
    setTargetUrl(null);
    if (!fromPopstate && window.location.hash === "#project") {
      try { window.history.back(); } catch {}
    }
  }, []);

  return {
    visible,
    ready,
    setReady,
    targetUrl,
    targetOrigin,
    show,
    hide,
    controlsDisabled: visible, // convenience flag for OrbitControls
  };
}
