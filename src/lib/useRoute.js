import { useEffect, useSyncExternalStore } from 'react';
import { parseRoute } from './routing.js';
function subscribe(callback) {
  window.addEventListener('hashchange',callback);
  window.addEventListener('popstate',callback);
  window.addEventListener('portfolio:navigate',callback);
  return () => {
    window.removeEventListener('hashchange',callback);
    window.removeEventListener('popstate',callback);
    window.removeEventListener('portfolio:navigate',callback);
  };
}
export function useRoute() {
  const hash = useSyncExternalStore(subscribe,()=>window.location.hash,()=>'');
  const route = parseRoute(hash);
  useEffect(() => {
    if (hash.startsWith('#/explore') || hash.startsWith('#project/')) {
      const query = route.params.toString();
      window.history.replaceState(window.history.state, '', `#/projects${query ? '?' + query : ''}`);
      window.dispatchEvent(new Event('portfolio:navigate'));
    }
  }, [hash]);
  return route;
}
