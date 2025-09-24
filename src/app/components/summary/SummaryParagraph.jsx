// src/app/components/summary/SummaryParagraph.jsx
import { useEffect, useMemo, useRef, useState } from "react";

const PUNCT = new Set([".", "!", "?", ",", ";", ":", "—", "–", "…"]);

export default function Paragraph({
  title = "Welcome",
  tech = [],
  text = "",
  textKey = "welcome",
  speedMs = 22,
  force = true, // ← animate by default; set to false if you want to honor reduced motion
}) {
  const [out, setOut] = useState("");
  const [done, setDone] = useState(false);
  const timerRef = useRef(null);

  const reducedMotionOS = useMemo(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      return false;
    }
  }, []);

  const reduced = !force && reducedMotionOS;

  useEffect(() => {
    // cleanup any pending timer
    const clear = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    clear();
    setOut("");
    setDone(false);

    if (!text || reduced) {
      setOut(text ?? "");
      setDone(true);
      return () => clear();
    }

    let i = 0;

    const tick = () => {
      if (i >= text.length) {
        setDone(true);
        return;
      }
      const ch = text[i++];
      setOut((prev) => prev + ch);

      let delay = speedMs;
      if (PUNCT.has(ch)) delay += 220; // small pause on punctuation

      timerRef.current = setTimeout(tick, delay);
    };

    // small ramp-in
    timerRef.current = setTimeout(tick, 80);

    return () => clear();
  }, [textKey, text, speedMs, reduced]);

  return (
    <div className="surface p-3">
      {/* Title + Techs row */}
      <div className="flex items-center gap-3 mb-2">
        <div className="h-lead whitespace-nowrap">{title}</div>

        {Array.isArray(tech) && tech.length > 0 && (
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

      {/* Animated text with caret while typing */}
      <p className="text-muted">
        {out}
        {!done && <span className="type-caret" aria-hidden="true">▮</span>}
      </p>

      {/* Accessibility: full text for screen readers */}
      <p className="sr-only">{text}</p>
    </div>
  );
}
