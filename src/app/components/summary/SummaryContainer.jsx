import { useMemo, useState, useEffect } from "react";
import Chip from "./Chip.jsx";
import Paragraph from "./SummaryParagraph.jsx";
import pubsub from "../../project/shared/pubsub.js";
import projects from "../../project/sticker/params/stickers.json"

export default function SummaryContainer() {
  const [activeId, setActiveId] = useState(null);

  const byId = useMemo(
    () => Object.fromEntries(projects.map((p) => [p.id, p])),
    [projects]
  );

  useEffect(() => {
    // hover → set active
    const sub = (payload) => {
      if (payload?.id && byId[payload.id]) setActiveId(payload.id);
    };
    pubsub?.on?.("project:hover", sub);
    return () => pubsub?.off?.("project:hover", sub);
  }, [byId]);

  const active = activeId ? byId[activeId] : null;

  const handleChip = (id) => {
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
          title={active?.title ?? "Welcome"}
          tech={Array.isArray(active?.tech) ? active.tech : []}
          // pass a stable key so the typewriter resets per project
          textKey={active?.id ?? "welcome"}
          text={
            active?.description ??
            "Hover or select a project to see a summary."
          }
        />
      </div>
    </section>
  );
}
