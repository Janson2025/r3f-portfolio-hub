// src/app/components/summary/SummaryContainer.jsx
import { useMemo, useState } from "react";
import Chip from "./Chip.jsx";
import Paragraph from "./paragraph.jsx";
import pubsub from "../../project/shared/pubsub.js";

// Fallback demo data
const DEFAULT_PROJECTS = [
  {
    id: "rubiks-portal",
    title: "Rubik’s Portal",
    blurbs: [
      "A param-driven R3F engine where each cubelet face is a live portal scene.",
      "Tactile 3D thumbnails — click a sticker to dive into a project.",
      "Smooth layer rotations, idle motion, and JSON-driven scenes.",
    ],
  },
  {
    id: "hexworld",
    title: "HexWorld",
    blurbs: [
      "A procedural hex-tile world prototype with exploration mechanics.",
      "Focus on performant R3F patterns and clean game-loop structure.",
    ],
  },
  {
    id: "sheetcraft",
    title: "SheetCraft",
    blurbs: [
      "A simple data-viz toolchain for lab datasets with fast charts.",
      "Built for clarity, repeatability, and sane data plumbing.",
    ],
  },
];

export default function SummaryContainer({ projects = DEFAULT_PROJECTS }) {
  const [activeId, setActiveId] = useState(null); // start with none selected

  const byId = useMemo(
    () => Object.fromEntries(projects.map((p) => [p.id, p])),
    [projects]
  );

  const active = activeId ? byId[activeId] : null;
  const text = active ? active.blurbs[0] : "Select a project to see a summary.";

  const handleChip = (id) => {
    setActiveId(id);
    // Notify the cube to focus the corresponding project (optional)
    pubsub?.emit?.("project:focus", { id });
  };

  return (
    <section className="summary flex flex-col pointer-events-auto text-[--color-fg]">
      {/* Chips */}
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

      {/* Paragraph / narration */}
      <div className="mt-3">
        <Paragraph title={active?.title ?? "Welcome"} text={text} />
      </div>
    </section>
  );
}
