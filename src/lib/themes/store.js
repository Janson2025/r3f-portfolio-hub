import { themeCss, themeStorageKey } from './registry.js';
const eventName = 'portfolio:theme';

export function getResolvedTheme() { return document.documentElement.dataset.theme || 'light'; }
export function subscribeTheme(callback) {
  window.addEventListener(eventName, callback);
  return () => window.removeEventListener(eventName, callback);
}

export function initializeThemes() {
  const style = document.createElement('style');
  style.id = 'portfolio-theme-palettes'; style.textContent = themeCss;
  document.head.appendChild(style);
  // Retire only the old manual preference. Browser appearance is authoritative.
  try { localStorage.removeItem(themeStorageKey); } catch { /* Storage is optional. */ }
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const apply = () => {
    document.documentElement.dataset.themePreference = 'system';
    document.documentElement.dataset.theme = media.matches ? 'dark' : 'light';
    window.dispatchEvent(new Event(eventName));
  };
  apply();
  media.addEventListener('change', apply);
  return () => { style.remove(); media.removeEventListener('change', apply); };
}
