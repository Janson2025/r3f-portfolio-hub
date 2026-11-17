export function recenterLoopScroll(scrollTop, groupHeight, middle=1) {
  if (!(groupHeight>0)) return scrollTop;
  const low=(middle-.5)*groupHeight, high=(middle+.5)*groupHeight;
  return scrollTop<low||scrollTop>high?scrollTop-Math.floor((scrollTop-low)/groupHeight)*groupHeight:scrollTop;
}
export function nearestReadingCard(cards, height) {
  const line=height*.4;
  return cards.reduce((best,item)=>{const distance=Math.abs(item.top+item.height/2-line);return !best||distance<best.distance?{id:item.id,distance}:best;},null)?.id??null;
}
