export function bubbleSchedule(timeline) {
  const chunks = timeline.text.match(/.{1,110}(?:\s|$)|\S+/gu) ?? [];
  let cursor = 0;
  return chunks.map((text, index) => {
    const startIndex = timeline.text.indexOf(text, cursor); cursor = startIndex + text.length;
    const first = timeline.characters.find(item => item.endIndex > startIndex);
    const last = [...timeline.characters].reverse().find(item => item.endIndex <= cursor);
    return { id: index, startIndex, endIndex: cursor, start: first?.at ?? 0, finish: last?.at ?? 0, text: text.trim() };
  });
}
export function visibleBubbles(schedule, timeline, elapsedMs) {
  return schedule.filter(item => elapsedMs >= item.start && elapsedMs < item.finish + 2450).slice(-3).map(item => {
    const end = timeline.characters.filter(c => c.at <= elapsedMs).at(-1)?.endIndex ?? 0;
    return { ...item, text: timeline.text.slice(item.startIndex, Math.min(item.endIndex, end)).trim(), opacity: Math.max(0, Math.min(1, (item.finish + 2450 - elapsedMs) / 450)) };
  });
}
