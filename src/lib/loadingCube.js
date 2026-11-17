export const loaderMoves = [ ['x',1,1], ['y',-1,-1], ['z',1,1], ['x',-1,1], ['x',-1,-1], ['z',1,-1], ['y',-1,1], ['x',1,-1] ];
const identity = [1,0,0,0,1,0,0,0,1];
export function rotateVector(v, axis, direction) {
  const [x,y,z] = v;
  return axis === 'x' ? [x,-direction*z,direction*y] : axis === 'y' ? [direction*z,y,-direction*x] : [-direction*y,direction*x,z];
}
export function initialLoaderCube() {
  return [-1,1].flatMap(x=>[-1,1].flatMap(y=>[-1,1].map(z=>({id:`${x}${y}${z}`,position:[x,y,z],basis:[...identity]}))));
}
export function applyLoaderMove(cubies, [axis,layer,direction]) {
  const index = 'xyz'.indexOf(axis);
  return cubies.map(c => c.position[index] !== layer ? c : ({ ...c, position:rotateVector(c.position,axis,direction), basis:[0,3,6].flatMap(i=>rotateVector(c.basis.slice(i,i+3),axis,direction)) }));
}
const states = [initialLoaderCube()];
for (const move of loaderMoves) states.push(applyLoaderMove(states.at(-1),move));
export function loaderFrame(seconds) {
  const t = seconds % 8.1, step = Math.min(7, Math.floor(t / .65));
  const progress = Math.min(1, (t - step*.65)/.5);
  const turn = progress*progress*(3-2*progress)*90;
  const jump = t>=5.2 && t<6.4 ? (t-5.2)/1.2 : 0;
  return { cubies:t<5.2?states[step]:states[8], move:t<5.2?loaderMoves[step]:null, turn,
    lift:Math.sin(seconds*2)*3+(jump?Math.sin(jump*Math.PI)*22:0), spin:jump?jump*360:0 };
}
/** DOM-only animation: no renderer, textures or model dependencies. */
export function startLoadingCube(element) {
  const cube=document.createElement('div'); cube.className='mini-cube';
  const pieces=initialLoaderCube().map(()=>{
    const part=document.createElement('div');part.className='mini-cubie';
    for(const face of ['front','back','right','left','top','bottom']){const side=document.createElement('i');side.className=`mini-face mini-face--${face}`;part.append(side);}
    cube.append(part);return part;
  });
  element.replaceChildren(cube);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let frame, start=performance.now(), hiddenAt=null;
  const draw=now=>{
    if(document.hidden){hiddenAt??=now;frame=requestAnimationFrame(draw);return;}
    if(hiddenAt!==null){start+=now-hiddenAt;hiddenAt=null;}
    const state=loaderFrame(reduced?0:(now-start)/1000);
    cube.style.transform=`translateY(${-state.lift}px) rotateX(-24deg) rotateY(${-34+state.spin}deg)`;
    state.cubies.forEach((c,i)=>{
      const [x,y,z]=c.position,b=c.basis;
      const turning=state.move && c.position['xyz'.indexOf(state.move[0])]===state.move[1];
      pieces[i].style.transform=`${turning?`rotate${state.move[0].toUpperCase()}(${state.turn*state.move[2]}deg) `:''}translate3d(${x*11}px,${y*11}px,${z*11}px) matrix3d(${b[0]},${b[1]},${b[2]},0,${b[3]},${b[4]},${b[5]},0,${b[6]},${b[7]},${b[8]},0,0,0,0,1)`;
    });
    if(!reduced) frame=requestAnimationFrame(draw);
  };
  frame=requestAnimationFrame(draw);
  return ()=>{cancelAnimationFrame(frame);element.replaceChildren();};
}
