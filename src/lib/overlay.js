import { parseRoute, routeHref } from './routing.js';
import { safeExternalUrl } from './urls.js';
export function resolveOverlayProject(hash,projects) {
  const route=parseRoute(hash);
  if(route.path!=='/projects') return null;
  const id=route.params.get('project');
  return projects.find(project=>project.id===id&&project.visibility==='published'&&safeExternalUrl(project.links.find(link=>link.kind==='demo')?.url))??null;
}
export function overlayHref(id, values = {}) {return routeHref('/projects',{...values,focus:id,project:id});}
export function isTrustedProjectMessage(event,origin,frameWindow) {
  return Boolean(origin&&frameWindow&&event.origin===origin&&event.source===frameWindow
    &&['project-ready','back-from-project'].includes(event.data?.type));
}
