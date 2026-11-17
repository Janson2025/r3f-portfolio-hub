const directions = [
  { id: 'up', label: 'Project above', symbol: '↑' },
  { id: 'down', label: 'Project below', symbol: '↓' },
  { id: 'left', label: 'Project to the left', symbol: '←' },
  { id: 'right', label: 'Project to the right', symbol: '→' },
];

export default function ProjectNavigationArrows({ navigation, frame, onNavigate, disabled }) {
  if (!frame || !navigation) return null;
  const centerX = (frame.left + frame.right) / 2, centerY = (frame.top + frame.bottom) / 2;
  const positions = { up: [centerX, frame.top - 28], down: [centerX, frame.bottom + 28], left: [frame.left - 28, centerY], right: [frame.right + 28, centerY] };
  return <div className="focused-project-arrows" aria-label="Spatial project navigation">
    {directions.map(({ id, label, symbol }) => {
      const project = navigation[id];
      const [x, y] = positions[id];
      return <button key={id} className={`focused-project-arrow arrow-${id}`} style={{ left: Math.max(24, Math.min(frame.width - 24, x)), top: Math.max(24, Math.min(frame.height - 24, y)) }}
        disabled={disabled || !project} aria-label={project ? `${label}: ${project.title}` : `${label}: no project`} title={project?.title ?? 'No project in this lane'} onClick={() => { if (project) onNavigate(project.id, 'cube-arrow'); }}>{symbol}</button>;
    })}
  </div>;
}
