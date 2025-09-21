// AvatarAnimationManager.jsx
import { useEffect, useMemo, useRef } from "react";
import { useAnimations } from "@react-three/drei";
import * as THREE from "three";

/**
 * Binds `clips` to `avatarRef` and:
 *  - plays `initialClip` immediately (no gap)
 *  - then loops forever with a novelty-weighted random picker
 */
export default function AvatarAnimationManager({
  clips = [],
  avatarRef,
  initialClip = "relieved-sigh",
  initialFade = 0.0,     // 0 = instant; >0 = soft fade-in
  crossFade = 0.25,      // fade between clips
}) {
  const { actions, mixer } = useAnimations(clips, avatarRef);

  const playCountsRef = useRef([]);     // how many times each clip has played
  const currentIndexRef = useRef(-1);
  const currentActionRef = useRef(null);
  const startedRef = useRef(false);

  useEffect(() => {
    playCountsRef.current = new Array(clips.length).fill(0);
  }, [clips.length]);

  const nameToIndex = useMemo(() => {
    const m = new Map();
    clips.forEach((c, i) => m.set(c.name, i));
    return m;
  }, [clips]);

  const pickNextIndex = (prevIdx) => {
    const counts = playCountsRef.current;
    const n = clips.length;
    if (n <= 1) return 0;

    // Bias toward less-played clips: weight = 1/(1+count)
    // Add jitter; down-weight immediate repeat
    let sum = 0;
    const weights = new Array(n);
    for (let i = 0; i < n; i++) {
      const base = 1 / (1 + (counts[i] ?? 0));
      const jitter = 0.85 + Math.random() * 0.3;
      let w = base * jitter;
      if (i === prevIdx) w *= 0.5; // discourage immediate repeat
      weights[i] = w;
      sum += w;
    }
    let r = Math.random() * sum;
    for (let i = 0; i < n; i++) if ((r -= weights[i]) <= 0) return i;
    return n - 1;
  };

  const playIndex = (idx, fade = crossFade) => {
    if (idx < 0 || idx >= clips.length) return;
    const name = clips[idx].name;
    const next = actions?.[name];
    if (!next) return;

    next.reset().setLoop(THREE.LoopOnce, 0);
    next.clampWhenFinished = true;

    if (currentActionRef.current && currentActionRef.current !== next) {
      currentActionRef.current.crossFadeTo(next, fade, true);
      next.play();
    } else {
      next.play();
    }

    currentActionRef.current = next;
    currentIndexRef.current = idx;
  };

  useEffect(() => {
    if (!mixer || clips.length === 0 || !actions) return;

    // Start immediately with the selected initial clip (or random fallback)
    if (!startedRef.current) {
      startedRef.current = true;
      const startIdx =
        nameToIndex.get(initialClip) ??
        Math.floor(Math.random() * clips.length);
      playIndex(startIdx, initialFade);
    }

    const onFinished = () => {
      const last = currentIndexRef.current;
      if (last >= 0) {
        playCountsRef.current[last] = (playCountsRef.current[last] ?? 0) + 1;
      }
      playIndex(pickNextIndex(last), crossFade);
    };

    mixer.addEventListener("finished", onFinished);
    return () => mixer.removeEventListener("finished", onFinished);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mixer, actions, clips, nameToIndex, initialClip, initialFade, crossFade]);

  return null; // headless controller
}
