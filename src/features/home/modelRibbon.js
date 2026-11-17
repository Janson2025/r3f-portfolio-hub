export const ribbonModels=[
 {id:'molecule',url:'/models/glucose.glb',technology:'React Three Fiber',href:'#/projects/r3f-molecules',title:'3D Molecule Maker'},
 {id:'cube',url:'/models/rubix_cube.glb',technology:'Three.js',href:'#/projects/simple-rubix-cube',title:'Simple Rubix Cube'},
 {id:'fish',url:'/products-and-services/moore_idol/Moore_Idol.glb',technology:'GLTF / GLB',href:'#/offerings',title:'Moore Idol fish',rotation:[0,Math.PI/2,0]},
 {id:'fossil',url:'/models/fossil.glb',technology:'Blender',href:'#/projects/3d-animal-icon-lab',title:'3D Animal Icon Lab'},
 {id:'reveal',url:'/models/image-revealer.glb',technology:'JavaScript',href:'#/projects/circles-mask-revealer',title:'Spinning Circle Image Revealer'},
];
export function chooseRibbonModels(items=ribbonModels,random=Math.random,count=4){const copy=[...items];for(let i=copy.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}return copy.slice(0,count);}
export function ribbonPosition(phase,width,time=0){const p=((phase%1)+1)%1,x=(p-.5)*(width+2);return {x,y:Math.sin(p*Math.PI*4)*.45+Math.sin(time*1.7+p*8)*.08};}

export function ribbonBandPath(width,height){const span=Math.max(width/65,15)+2,points=[];for(let x=-30;x<=width+42;x+=12){const phase=(x-width/2)/(span*65)+.5;points.push([x,height/2-Math.sin(phase*Math.PI*4)*.45*65]);}return 'M'+points.map(([x,y])=>`${x},${y-53}`).join(' L')+' L'+points.slice().reverse().map(([x,y])=>`${x},${y+53}`).join(' L')+' Z';}
