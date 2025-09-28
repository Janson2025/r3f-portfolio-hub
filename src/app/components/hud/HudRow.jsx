// src/app/components/hud/HudRow.jsx
import React from "react";
import HudButton from "./HudButton.jsx";

/** One-line row: name + CW + CCW (row sits on the right; contents stay on one line) */
export default function HudRow({
  name,
  onCw,
  onCcw,
  disabled = false,
  cwLabel = "↻",
  ccwLabel = "↺",
  className = "",
}) {
  return (
    <div
      className={[
        "flex flex-nowrap items-center justify-end gap-[6px] w-fit ml-auto", // push row to the right, keep one line
        className,
      ].join(" ")}
    >
      <span className="shrink-0 whitespace-nowrap text-[11px] uppercase tracking-tight text-white/70 text-right">
        {name}
      </span>

      <HudButton
        label={cwLabel}
        variant="emerald"
        disabled={disabled}
        onClick={onCw}
        className="shrink-0 px-1.5 py-0.5 text-[11px] text-right"
      />
      <HudButton
        label={ccwLabel}
        variant="sky"
        disabled={disabled}
        onClick={onCcw}
        className="shrink-0 px-1.5 py-0.5 text-[11px] text-right"
      />
    </div>
  );
}
