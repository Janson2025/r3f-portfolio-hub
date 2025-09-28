// src/app/components/hud/HudButton.jsx
import React from "react";

export default function HudButton({
  label,
  onClick,
  disabled = false,
  variant = "emerald", // "emerald" | "sky" | "slate"
  className = "",
}) {
  const base =
    "inline-flex items-center justify-end px-2 py-1 rounded-md text-xs font-medium border border-white/10 shadow-sm transition-colors duration-150 text-right";
  const palette =
    variant === "emerald"
      ? "bg-emerald-600 text-white hover:brightness-110"
      : variant === "sky"
      ? "bg-sky-600 text-white hover:brightness-110"
      : "bg-slate-700 text-white hover:brightness-110";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      className={[
        base,
        palette,
        disabled ? "opacity-50 cursor-not-allowed" : "",
        className,
      ].join(" ")}
    >
      {label}
    </button>
  );
}
