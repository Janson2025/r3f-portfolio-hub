import { useRef } from 'react';
import ProjectCard from './ProjectCard.jsx';

export default function HomeProjectStrip({ projects }) {
  const strip = useRef(null);
  function scroll(direction) {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    strip.current?.scrollBy({ left: direction * strip.current.clientWidth * 0.8, behavior: reduced ? 'instant' : 'smooth' });
  }
  return <>
    <div className="work-strip-controls"><button aria-label="Scroll selected projects left" onClick={() => scroll(-1)}>←</button><button aria-label="Scroll selected projects right" onClick={() => scroll(1)}>→</button></div>
    <div ref={strip} className="work-strip" tabIndex={0} role="region" aria-label="Selected projects, scroll horizontally">
      {projects.map(project => <div className="work-strip-item" key={project.id}><ProjectCard project={project} /></div>)}
    </div>
  </>;
}
