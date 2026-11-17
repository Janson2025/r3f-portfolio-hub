import records from '../../data/projects.json';
import { selectPublishedProjects } from './catalog.js';
export function getProjects() { return selectPublishedProjects(records); }
export function getProject(slug) { return getProjects().find(project => project.slug === slug) ?? null; }
export function getFeaturedProjects() { return getProjects().filter(project => project.featured).slice(0,3); }
