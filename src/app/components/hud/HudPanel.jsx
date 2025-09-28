// src/app/components/hud/HudPanel.jsx
import React from "react";

/** Generic floating card container for HUDs */
export default function HudPanel({
  title,
  children,
  className = "",
  positionClass = "fixed top-28 right-4",
  autoWidth = true,               // NEW: let content define width
  fixedWidth = "w-[240px]",       // fallback if you want a fixed width
}) {
  const widthClass = autoWidth ? "inline-block w-fit max-w-[92vw]" : fixedWidth;

  return (
    <div className={[positionClass, "z-[9999] pointer-events-auto select-none", className].join(" ")}>
      <div className={[widthClass, "rounded-xl bg-black/70 backdrop-blur px-3 py-3 shadow-lg border border-white/10 text-center"].join(" ")}>
        {title ? (
          <div className="mb-2 text-sm font-semibold text-white/90">{title}</div>
        ) : null}
        {children}
      </div>
    </div>
  );
}
