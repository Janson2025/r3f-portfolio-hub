import { useEffect, useRef, useState } from "react";

export default function Footer() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    setHeight(open ? el.scrollHeight : 0);
  }, [open]);

  return (
    <div className="bg-[--color-bg-elev] shadow-[--shadow-sm] select-none">
      {/* Tray handle */}
      <div className="flex items-center justify-center h-7">
        <button
          aria-expanded={open}
          aria-controls="contact-panel"
          onClick={() => setOpen(v => !v)}
          className="px-2 py-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 focus:outline focus:outline-2 focus:outline-[--color-accent]"
          title={open ? "Hide contact" : "Show contact"}
        >
          {open ? "▾" : "▴"}
        </button>
      </div>

      {/* Expandable panel */}
      <div
        id="contact-panel"
        ref={panelRef}
        className="overflow-hidden transition-[height] duration-300 ease-[--ease-smooth]"
        style={{ height }}
      >
        <div className="px-4 py-3 flex items-center justify-between">
          <div>
            <div className="font-semibold">Contact</div>
            <div className="text-muted">
              <a className="underline" href="mailto:you@example.com">you@example.com</a>
            </div>
          </div>
          <div className="flex gap-3">
            <a className="underline" href="https://github.com/jacall2016" target="_blank" rel="noreferrer">GitHub</a>
            <a className="underline" href="https://www.linkedin.com/in/..." target="_blank" rel="noreferrer">LinkedIn</a>
          </div>
        </div>
      </div>
    </div>
  );
}
