/** Hash routing keeps deep links portable on static hosts without rewrite rules. */
export function parseRoute(hash = '') {
  if (hash.startsWith('#project/')) {
    return { path: '/projects', params: new URLSearchParams({project: hash.slice(9)}) };
  }
  const raw = hash.replace(/^#/, '') || '/';
  const index = raw.indexOf('?');
  const path = index < 0 ? raw : raw.slice(0,index);
  const normalized = path === '/explore' ? '/projects' : path;
  return { path: normalized.startsWith('/') ? normalized.replace(/\/$/,'') || '/' : '/not-found',
    params: new URLSearchParams(index < 0 ? '' : raw.slice(index+1)) };
}
export function routeHref(path, values = {}) {
  const params = new URLSearchParams();
  for (const [key,value] of Object.entries(values)) if (value) params.set(key,value);
  return `#${path}${params.size ? `?${params}` : ''}`;
}
export function replaceRoute(path, values) {
  window.history.replaceState(window.history.state,'',routeHref(path,values));
  window.dispatchEvent(new Event('portfolio:navigate'));
}
