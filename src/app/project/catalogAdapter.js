import { resolvePortalBackground } from './sticker/backgroundConfig.js';
import { selectPublishedProjects } from '../../features/projects/catalog.js';
/** Join scene-only configuration to public records by ID; do not duplicate content. */
export function createCubeCatalog(records, settings) {
  const publicById = new Map(selectPublishedProjects(records).map(project => [project.id, project]));
  return { defaults: settings.defaults, projects: settings.projects.flatMap(assignment => {
    const project = publicById.get(assignment.id);
    if (!project) return [];
    return [{ ...assignment, portal: { ...assignment.portal, background: resolvePortalBackground(settings.defaults?.portalBackground, assignment.portal?.background, project.image) }, title: project.title, description: project.summary, tech: project.tags,
      links: Object.fromEntries(project.links.map(link => [link.kind,link.url])),
      'background-image': project.image }];
  }) };
}
