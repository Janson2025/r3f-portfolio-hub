// src/app/components/hud/HudSection.jsx
import React from "react";

export default function HudSection({
  heading,
  children,
  divider = true,
  className = "",
  headingClass = "mt-1 mb-1 text-[11px] font-semibold text-emerald-300/90 text-right",
}) {
  return (
    // w-fit makes the section as wide as the widest child (your heading)
    // ml-auto keeps the whole section pushed to the right in its parent
    <section className={["w-fit ml-auto text-right", className].join(" ")}>
      {heading ? <h3 className={headingClass}>{heading}</h3> : null}

      {/* Each row will be w-full, which now means "as wide as the heading" */}
      <div className="flex flex-col gap-1 items-stretch w-full">
        {children}
      </div>

      {divider && <div className="my-2 border-t border-white/10" />}
    </section>
  );
}
