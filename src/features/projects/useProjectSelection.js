import { useCallback, useEffect, useRef, useState } from 'react';
import { replaceRoute } from '../../lib/routing.js';
import { resolveSelection } from './selection.js';

export function useProjectSelection(projects, params) {
  const ids = projects.map(project => project.id);
  const idsKey = ids.join('|');
  const requested = params.get('focus');
  const [selection, setSelection] = useState(() => ({
    id: resolveSelection(ids, requested), source: 'url', sequence: 0,
  }));
  const current = useRef({ ids, params });
  current.current = { ids, params };

  useEffect(() => {
    const id = resolveSelection(current.current.ids, requested);
    setSelection(previous => previous.id === id ? previous : {
      id, source: 'url', sequence: previous.sequence + 1,
    });
  }, [idsKey, requested]);

  const select = useCallback((id, source = 'list-click') => {
    if (!current.current.ids.includes(id)) return;
    setSelection(previous => previous.id === id && source === 'list-scroll' ? previous : {
      id, source, sequence: previous.sequence + 1,
    });
    const values = Object.fromEntries(current.current.params);
    if (values.focus !== id) replaceRoute('/projects', { ...values, focus: id });
  }, []);

  return { selection, select };
}
