export function resolveSelection(ids, requested) {
  return ids.includes(requested) ? requested : ids[0] ?? null;
}

export function stepSelection(ids, current, direction) {
  if (!ids.length) return null;
  const index = Math.max(0, ids.indexOf(current));
  return ids[Math.max(0, Math.min(ids.length - 1, index + Math.sign(direction)))];
}

export function readingProject(cards, viewportHeight, scrollTop, maxScroll) {
  if (!cards.length) return null;
  if (scrollTop <= 2) return cards[0].id;
  if (maxScroll > 2 && scrollTop >= maxScroll - 2) return cards.at(-1).id;
  const line = viewportHeight * 0.4;
  return cards.reduce((best, card) => {
    const distance = Math.abs(card.top + card.height / 2 - line);
    return !best || distance < best.distance ? { id: card.id, distance } : best;
  }, null).id;
}
