const shapes = { a: 'aa', e: 'ee', i: 'ih', o: 'oh', u: 'ou' };
export function textToMouthShape(character) { return shapes[character.toLowerCase()] ?? null; }

/** Approximate text-driven timing, not audio/phonetic alignment. */
export function createTextTimeline(text) {
  const characters = [], mouthCues = [];
  let currentTime = 0, endIndex = 0;
  for (const character of text) {
    endIndex += character.length;
    characters.push({ at: currentTime * 1000, endIndex });
    const mouthShape = textToMouthShape(character);
    if (mouthShape) {
      mouthCues.push({ start: currentTime, end: currentTime + 0.12, mouthShape, weight: 0.85 });
      currentTime += 0.145;
    } else if (/\s/.test(character)) currentTime += 0.06;
    else if (/[,;:]/.test(character)) currentTime += 0.16;
    else if (/[.!?]/.test(character)) {
      mouthCues.push({ start: currentTime, end: currentTime + 0.28, mouthShape: null, weight: 0 });
      currentTime += 0.28;
    } else currentTime += 0.025;
  }
  mouthCues.push({ start: currentTime, end: currentTime + 0.2, mouthShape: null, weight: 0 });
  return { text, characters, mouthCues, durationMs: (currentTime + 0.2) * 1000 };
}
export function generateTextMouthCues(text) { return createTextTimeline(text).mouthCues; }
export function getMouthCueDurationMs(cues) { return cues.length ? Math.max(...cues.map(cue => cue.end)) * 1000 : 0; }

export function timelineFrame(timeline, elapsedMs) {
  let low = 0, high = timeline.characters.length - 1, index = -1;
  while (low <= high) {
    const middle = (low + high) >> 1;
    if (timeline.characters[middle].at <= elapsedMs) { index = middle; low = middle + 1; } else high = middle - 1;
  }
  const seconds = elapsedMs / 1000;
  const cue = timeline.mouthCues.find(item => seconds >= item.start && seconds < item.end);
  return { visibleCharacters: index < 0 ? 0 : timeline.characters[index].endIndex,
    mouthShape: cue?.mouthShape ?? null, weight: cue?.weight ?? 0, complete: elapsedMs >= timeline.durationMs };
}
