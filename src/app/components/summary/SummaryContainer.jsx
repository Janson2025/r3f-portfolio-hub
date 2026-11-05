import { useMemo, useState, useEffect, useRef } from "react";
import Chip from "./Chip.jsx";
import Paragraph from "./SummaryParagraph.jsx";
import pubsub from "../../project/shared/pubsub.js";

import stickerData from "../../project/sticker/params/stickers.json";
import gridParams from "../../project/grid/params/grid.json";
import { createProjectStickerOverrides } from "../../project/grid/engine/projectAssignment.js";

const projects = stickerData.projects;
const HOVER_DEBOUNCE_MS = 80;

function getTextColor(hex) {
  const value = hex.replace("#", "");
  const r = parseInt(value.substring(0, 2), 16);
  const g = parseInt(value.substring(2, 4), 16);
  const b = parseInt(value.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#202229" : "#ffffff";
}

function getColorSortKey(hex) {
  const value = hex.replace("#", "");
  const r = parseInt(value.substring(0, 2), 16) / 255;
  const g = parseInt(value.substring(2, 4), 16) / 255;
  const b = parseInt(value.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  if (delta === 0) return [-1, max, 0]; // neutral colors first

  let hue;
  if (max === r) hue = ((g - b) / delta) % 6;
  else if (max === g) hue = (b - r) / delta + 2;
  else hue = (r - g) / delta + 4;

  hue = (hue * 60 + 360) % 360;
  return [hue, max === 0 ? 0 : delta / max, max];
}

export default function SummaryContainer() {
  const [activeId, setActiveId] = useState(null);
  const hoverTimerRef = useRef(null);
  const chipRefs = useRef(new Map());

  const byId = useMemo(
    () => Object.fromEntries(projects.map((project) => [project.id, project])),
    []
  );

  const projectColors = useMemo(() => {
    const overrides = createProjectStickerOverrides({
      projects,
      dimensions: gridParams.dimensions ?? [3, 3, 3],
      seed: stickerData.defaults?.assignmentSeed ?? "rubix-portfolio-v1",
    });

    return Object.fromEntries(
      [...overrides.values()].map((config) => [
        config.id,
        config.preview?.color ?? "#3285e8",
      ])
    );
  }, []);

  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      const colorA = getColorSortKey(projectColors[a.id] ?? "#3285e8");
      const colorB = getColorSortKey(projectColors[b.id] ?? "#3285e8");
      for (let index = 0; index < colorA.length; index += 1) {
        if (colorA[index] !== colorB[index]) return colorA[index] - colorB[index];
      }
      return a.title.localeCompare(b.title);
    });
  }, [projectColors]);

  useEffect(() => {
    const onSelected = (payload) => {
      if (!payload?.id || !byId[payload.id]) return;
      clearTimeout(hoverTimerRef.current);
      setActiveId(payload.id);
      chipRefs.current.get(payload.id)?.scrollIntoView?.({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      });
    };

    pubsub?.on?.("project:selected", onSelected);
    return () => pubsub?.off?.("project:selected", onSelected);
  }, [byId]);

  useEffect(() => {
    const onHover = (payload) => {
      if (!payload?.id || !byId[payload.id]) return;
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = setTimeout(() => {
        setActiveId(payload.id);
        chipRefs.current.get(payload.id)?.scrollIntoView?.({
          behavior: "smooth",
          block: "nearest",
          inline: "nearest",
        });
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
      <div className="project-selector" aria-label="Project selector">
        {sortedProjects.map((project) => {
          const color = projectColors[project.id] ?? "#3285e8";
          return (
            <Chip
              key={project.id}
              refCallback={(node) => {
                if (node) chipRefs.current.set(project.id, node);
                else chipRefs.current.delete(project.id);
              }}
              label={project.title}
              color={color}
              textColor={getTextColor(color)}
              active={project.id === activeId}
              onClick={() => handleChip(project.id)}
            />
          );
        })}
      </div>

      <div className="summary__paragraph">
        <Paragraph
          key={active?.id ?? "welcome"}
          title={active?.title ?? "Welcome"}
          tech={Array.isArray(active?.tech) ? active.tech : []}
          textKey={active?.id ?? "welcome"}
          text={active?.description ?? "Hover or select a project to see a summary."}
          speedMs={22}
          force={true}
        />
      </div>
    </section>
  );
}