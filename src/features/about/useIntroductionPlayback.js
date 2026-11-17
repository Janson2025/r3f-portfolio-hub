import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createTextTimeline, timelineFrame } from './textTimeline.js';

export function useIntroductionPlayback(text, ready, reducedMotion, playbackKey = 'bio') {
  const timeline = useMemo(() => createTextTimeline(text), [text]);
  const playback = useRef({ elapsedMs: 0, playing: false });
  const started = useRef(false);
  const [state, setState] = useState({ status: 'waiting', visible: 0, elapsedMs: 0 });
  const replay = useCallback(() => {
    started.current = true;
    const elapsedMs = playbackKey === 'bio' ? -5200 : 0;
    playback.current = { elapsedMs, playing: true, key: playbackKey };
    setState({ status: 'playing', visible: 0, elapsedMs });
  }, [playbackKey]);
  const showAll = useCallback(() => {
    started.current = true;
    playback.current = { elapsedMs: timeline.durationMs + 2500, playing: false, key: playbackKey };
    setState({ status: 'complete', visible: text.length, elapsedMs: timeline.durationMs + 2500 });
  }, [timeline.durationMs, text.length, playbackKey]);
  const pause = useCallback(() => { playback.current.playing = false; setState(p => ({ ...p, status: 'paused' })); }, []);
  const resume = useCallback(() => { playback.current.playing = true; setState(p => ({ ...p, status: 'playing' })); }, []);
  useEffect(() => { started.current = false; playback.current.playing = false; setState({ status: 'waiting', visible: 0, elapsedMs: 0 }); }, [timeline, playbackKey]);
  useEffect(() => { if (reducedMotion) showAll(); else if (ready && !started.current) replay(); }, [ready, reducedMotion, timeline, playbackKey, replay, showAll]);
  useEffect(() => {
    if (state.status !== 'playing') return;
    let frame, lastRender = -Infinity;
    const base = performance.now() - playback.current.elapsedMs;
    const tick = now => {
      const elapsedMs = Math.min(timeline.durationMs + 2500, now - base);
      const next = timelineFrame(timeline, elapsedMs);
      const complete = elapsedMs >= timeline.durationMs + 2500;
      playback.current.elapsedMs = elapsedMs; playback.current.playing = !complete;
      if (now - lastRender >= 40 || complete) { setState({ visible: next.visibleCharacters, status: complete ? 'complete' : 'playing', elapsedMs }); lastRender = now; }
      if (!complete) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    const hide = () => { if (document.hidden) pause(); };
    document.addEventListener('visibilitychange', hide);
    return () => { cancelAnimationFrame(frame); playback.current.playing = false; document.removeEventListener('visibilitychange', hide); };
  }, [state.status, timeline, playbackKey, pause]);
  return { timeline, playback, text: text.slice(0, state.visible), status: state.status, elapsedMs: state.elapsedMs, replay, pause, resume, showAll };
}
