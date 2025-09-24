// src/app/components/summary/SummaryParagraph.jsx
export default function Paragraph({ title = "Welcome", tech = [], text = "" }) {
  return (
    <div className="surface p-3">
      {/* Title + Techs row (always on the same line) */}
      <div className="flex items-center gap-3 mb-2">
        <div className="h-lead whitespace-nowrap">{title}</div>

        {/* Tech list (horizontal scroll if overflow) */}
        {tech.length > 0 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {tech.map((t) => (
              <span
                key={t}
                className="shrink-0 rounded-full px-2 py-1 text-xs border border-[color-mix(in_srgb,currentColor,transparent_70%)]/40 text-[--color-fg-muted]"
                title={t}
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Description */}
      <p className="text-muted">{text}</p>
    </div>
  );
}
