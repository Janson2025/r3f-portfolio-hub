
export default function PortfolioUI({
  currentViewLabel = "Cube View",
  isProjectView = false,
  onReturnToCube,
  disabled = false,
}) {
  const buttonClasses =
    "pointer-events-auto max-w-[min(18rem,calc(100vw-3rem))] " +
    "truncate rounded-xl border border-white/15 bg-slate-950/85 " +
    "px-5 py-3 text-sm font-semibold text-white shadow-xl " +
    "backdrop-blur-md transition-colors " +
    "focus-visible:outline-none focus-visible:ring-2 " +
    "focus-visible:ring-white/80 " +
    "hover:bg-slate-800 disabled:cursor-default " +
    "disabled:opacity-80";

  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      <div className="absolute bottom-16 right-6 flex items-center">
        <button
          type="button"
          className={buttonClasses}
          onClick={() => {
            if (isProjectView && !disabled) {
              onReturnToCube?.();
            }
          }}
          disabled={!isProjectView || disabled}
          aria-label={
            isProjectView
              ? `Return from ${currentViewLabel} to Cube View`
              : "Current view: Cube View"
          }
          aria-pressed={isProjectView}
          title={
            isProjectView
              ? "Return to Cube View"
              : "Select a project sticker to enter Project View"
          }
        >
          {currentViewLabel}
        </button>
      </div>
    </div>
  );
}
