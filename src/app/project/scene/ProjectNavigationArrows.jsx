
const ARROWS = [
  { direction: "up", label: "Previous project above" },
  { direction: "down", label: "Next project below" },
  { direction: "left", label: "Previous project to the left" },
  { direction: "right", label: "Next project to the right" },
];

function ArrowIcon({ direction }) {
  const paths = {
    up: "M12 19V5 M5 12l7-7 7 7",
    down: "M12 5v14 M19 12l-7 7-7-7",
    left: "M19 12H5 M12 5l-7 7 7 7",
    right: "M5 12h14 M12 5l7 7-7 7",
  };

  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[direction]} />
    </svg>
  );
}

export default function ProjectNavigationArrows({
  navigation,
  onNavigate,
  disabled = false,
}) {
  if (!navigation) return null;

  return (
    <div
      className="project-navigation-arrows"
      aria-label="Project navigation"
    >
      {ARROWS.map(({ direction, label }) => {
        const project = navigation[direction];
        const isDisabled = disabled || !project?.id;

        return (
          <button
            key={direction}
            type="button"
            className={`project-navigation-arrow project-navigation-arrow--${direction}`}
            aria-label={
              project?.title
                ? `${label}: ${project.title}`
                : label
            }
            title={project?.title ?? label}
            disabled={isDisabled}
            onClick={() => {
              if (isDisabled) return;
              onNavigate?.(project);
            }}
          >
            <ArrowIcon direction={direction} />
          </button>
        );
      })}
    </div>
  );
}
