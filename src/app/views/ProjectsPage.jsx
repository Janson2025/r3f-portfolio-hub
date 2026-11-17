import { useEffect } from 'react';
import { openProjectDetails } from '../../lib/placeMemory.js';
import { getProjects } from '../../features/projects/queries.js';
import { filterProjects } from '../../features/projects/catalog.js';
import { useProjectSelection } from '../../features/projects/useProjectSelection.js';
import { replaceRoute } from '../../lib/routing.js';
import { MotionContext, useReducedMotion } from '../../lib/motion.jsx';
import ProjectList from '../components/projects/ProjectList.jsx';
import ProjectCubePanel from '../components/projects/ProjectCubePanel.jsx';



export default function ProjectsPage({ params }) {
  const projects = getProjects();
  const category = params.get('category') ?? '';
  const technology = params.get('technology') ?? '';
  const filtered = filterProjects(projects, { category: category || 'All work', technology });
  const { selection, select } = useProjectSelection(filtered, params);
  const reducedMotion = useReducedMotion();

  const categories = [...new Set(projects.map(project => project.discipline))];

  function updateFilters(values) {
    const next = { ...Object.fromEntries(params), ...values, focus: '' };
    delete next.q;
    replaceRoute('/projects', next);
  }
  useEffect(()=>{const legacy=params.get('project');if(legacy){const project=projects.find(p=>p.id===legacy);if(project)window.location.replace(`#/projects/${project.slug}`);}},[params.get('project')]);

  return <MotionContext.Provider value={{ reducedMotion, ambientMotion: false }}>
    <div className="project-workspace">
      <section className="project-information" aria-label="Project information">
        <div className="project-list-heading project-heading-compact">
          <h1>Projects<span className="accent-dot">.</span></h1>
          <div className="project-category-tabs" aria-label="Project categories">
            {['', ...categories].map(item => <button key={item} aria-label={item || 'All'} aria-pressed={category === item} onClick={() => updateFilters({ category: item })}><span className="category-label-full">{item || 'All'}</span><span className="category-label-short" aria-hidden="true">{({'3D & interactive':'3D','Web apps':'Web'})[item] || item || 'All'}</span></button>)}
          </div>
          <label className="project-technology"><span className="visually-hidden">Technology</span><select aria-label="Technology" value={technology} onChange={event => updateFilters({ technology: event.target.value })}><option value="">All technologies</option>{[...new Set(projects.flatMap(project => project.tags))].sort().map(item => <option key={item}>{item}</option>)}</select></label>
        </div>
        <ProjectList projects={filtered} selection={selection} onSelect={select} onOpenProject={openProjectDetails} reducedMotion={reducedMotion} />
      </section>
      <ProjectCubePanel projects={filtered} selection={selection} onSelect={select} onActivate={id => { const project = projects.find(item => item.id === id); if (project) openProjectDetails(project); }} overlayOpen={false} />
    </div>
  </MotionContext.Provider>;
}
