// src/scene/ProjectOverlay.jsx
import { useEffect } from "react";

/**
 * Pure presentational overlay that renders the iframe and listens for messages.
 * It trusts the controller for state and APIs.
 */
export default function ProjectOverlay({
  targetUrl,
  targetOrigin,
  visible,
  onReady,
  onBack,
}) {
  // Listen ONLY to messages from the current target origin
  useEffect(() => {
    const onMsg = (e) => {
      if (!targetOrigin || e.origin !== targetOrigin) return;
      if (e?.data?.type === "project-ready") onReady?.();
      if (e?.data?.type === "back-from-project") onBack?.();
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [targetOrigin, onReady, onBack]);

  return (
    <>
      {/* Back button (fallback if project doesn't message) */}
      {visible && (
        <button
          aria-label="Back to Hub"
          onClick={onBack}
          className="absolute left-3 top-3 z-20 rounded-lg bg-black/60 px-3 py-2 text-white backdrop-blur hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          ← Back
        </button>
      )}

      <iframe
        title="project"
        src={targetUrl ?? ""}
        onLoad={() => onReady?.()}
        loading="eager"
        className={[
          "absolute inset-0 h-full w-full border-0 bg-neutral-900 transition-opacity duration-200 ease-out",
          visible ? "opacity-100 pointer-events-auto z-10" : "opacity-0 pointer-events-none",
        ].join(" ")}
      />
    </>
  );
}
