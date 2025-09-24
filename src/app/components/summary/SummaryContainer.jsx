// src/app/components/summary/SummaryContainer.jsx
import { useMemo, useState, useEffect, useRef } from "react";
import Chip from "./Chip.jsx";
import Paragraph from "./SummaryParagraph.jsx";
import pubsub from "../../project/shared/pubsub.js";
import projects from "../../project/sticker/params/stickers.json";

const HOVER_DEBOUNCE_MS = 80;

export default function SummaryContainer() {
  const [activeId, setActiveId] = useState(null);
  const hoverTimerRef = useRef(null);

  const byId = useMemo(
    () => Object.fromEntries(projects.map((p) => [p.id, p])),
    []
  );

  useEffect(() => {
    // Hover → set active (debounced to prevent rapid restarts)
    const onHover = (payload) => {
      if (!payload?.id || !byId[payload.id]) return;
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = setTimeout(() => {
        setActiveId(payload.id);
      }, HOVER_DEBOUNCE_MS);
    };

    pubsub?.on?.("project:hover", onHover);
    return () => {
      clearTimeout(hoverTimerRef.current);
      pubsub?.off?.("project:hover", onHover);
    };
  }, [byId]);

  const active = activeId ? byId[activeId] : null;

  const handleChip = (id) => {
    clearTimeout(hoverTimerRef.current);
    setActiveId(id);
    pubsub?.emit?.("project:focus", { id });
  };

  return (
    <section className="summary flex flex-col pointer-events-auto text-[--color-fg]">
      <div className="flex mt-2 gap-2 overflow-x-auto no-scrollbar snap-x snap-mandatory">
        {projects.map((p) => (
          <Chip
            key={p.id}
            label={p.title}
            active={p.id === activeId}
            onClick={() => handleChip(p.id)}
          />
        ))}
      </div>

      <div className="mt-3">
        <Paragraph
          key={active?.id ?? "welcome"}                  // ← force remount per project
          title={active?.title ?? "Welcome"}
          tech={Array.isArray(active?.tech) ? active.tech : []}
          textKey={active?.id ?? "welcome"}              // ← internal reset signal
          text={
            active?.description ??
            "Hover or select a project to see a summary."
          }
          speedMs={22}                                   // ← tweak typing speed if desired
          force={true}                                   // ← animate even if OS prefers reduced motion
        />
      </div>
    </section>
  );
}
