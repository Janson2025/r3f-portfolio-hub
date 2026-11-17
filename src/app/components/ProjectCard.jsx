export function ProjectPreview({ project, eager = false }) {
  return <div className={`work-preview ${project.image ? '' : 'work-preview--abstract'}`}>
    {project.image ? <img src={project.image} alt={project.imageAlt} loading={eager ? 'eager' : 'lazy'} decoding="async"/> : <div className="project-monogram" aria-hidden="true"><span>{project.title.split(' ').filter(word=>!['3D','&'].includes(word)).slice(0,2).map(word=>word[0]).join('')}</span><i/><i/><i/></div>}
    {!project.image && <span className="preview-caption">{project.discipline}</span>}
  </div>;
}
export default function ProjectCard({ project }) {
  return <article className="work-card">
    <a href={`#/projects/${project.slug}`} className="work-card__image" aria-label={`Read about ${project.title}`}><ProjectPreview project={project}/><span className="work-card__arrow" aria-hidden="true">↗</span></a>
    <div className="work-meta"><span>{project.discipline}</span>{project.status && <span className="status-badge">{project.status}</span>}</div>
    <h3><a href={`#/projects/${project.slug}`}>{project.title}</a></h3>
    <p>{project.summary}</p>
    <div className="work-tags">{project.tags.map(tag=><span key={tag}>{tag}</span>)}</div>
  </article>;
}
