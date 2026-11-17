/** Body-space wave increases toward the tail; independent of the scene's idle bob. */
export function swimOffset(z, minZ, maxZ, time) {
  const fraction=Math.max(0,Math.min(1,(z-minZ)/Math.max(.001,maxZ-minZ)));
  const envelope=Math.pow(fraction,3);
  if(envelope===0)return 0;
  return Math.sin(time*4.8-fraction*5.5)*envelope*(maxZ-minZ)*.035;
}
