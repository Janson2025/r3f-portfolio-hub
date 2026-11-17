/**
 * @typedef {Object} Project
 * @property {string} id Stable ID shared with cube assignments.
 * @property {string} slug
 * @property {string} title
 * @property {string} summary
 * @property {string} description
 * @property {string|null} role Unverified contribution stays unset.
 * @property {string|null} status Project progress, independent of visibility.
 * @property {'published'|'draft'|'archived'} visibility
 * @property {string} discipline
 * @property {string[]} tags
 * @property {boolean} featured
 * @property {number} sortOrder
 * @property {string|null} image
 * @property {string|null} imageAlt
 * @property {{kind:string,label:string,url:string}[]} links
 * @property {{heading:string,body:string}[]} caseStudy
 */
import { safeExternalUrl } from '../../lib/urls.js';

/** Local data filtering is a presentation boundary, not server authorization. */
export function selectPublishedProjects(records) {
  return records.filter(project => project.visibility === 'published')
    .map(project => ({ ...project, tags: [...project.tags], links: project.links
      .map(link => ({...link, url: safeExternalUrl(link.url)})).filter(link => link.url) }))
    .sort((a,b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
}
export function filterProjects(records, { category = 'All work', technology = '', search = '' } = {}) {
  const term = search.trim().toLowerCase();
  return records.filter(project => (category === 'All work' || project.discipline === category)
    && (!technology || project.tags.includes(technology))
    && `${project.title} ${project.summary} ${project.tags.join(' ')}`.toLowerCase().includes(term));
}
export function validateCatalog(records) {
  const ids = new Set(); const slugs = new Set(); const errors = [];
  for (const project of records) {
    if (!project.id || ids.has(project.id)) errors.push(`Duplicate/missing ID: ${project.id}`);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(project.slug) || slugs.has(project.slug)) errors.push(`Invalid/duplicate slug: ${project.slug}`);
    ids.add(project.id); slugs.add(project.slug);
    if (!project.title || !project.summary || !Array.isArray(project.tags) || !Array.isArray(project.links)) errors.push(`Missing content: ${project.id}`);
    if (!['published','draft','archived'].includes(project.visibility)) errors.push(`Invalid visibility: ${project.id}`);
    for (const link of project.links ?? []) if (!safeExternalUrl(link.url)) errors.push(`Unsafe URL: ${project.id}`);
  }
  return errors;
}
