import { useSyncExternalStore } from 'react';
import { getResolvedTheme, subscribeTheme } from './store.js';
import { themes } from './registry.js';
export function useTheme() {
  const id=useSyncExternalStore(subscribeTheme,getResolvedTheme,()=> 'light');
  return themes.find(theme=>theme.id===id)??themes[0];
}
