const key='portfolio-place-v1';
let memory={workspace:null,pages:{}};
export function readPlaces(){try{const value=JSON.parse(sessionStorage.getItem(key));if(!value||typeof value!=='object'||Array.isArray(value))return memory;return{pages:value.pages&&typeof value.pages==='object'?value.pages:{},workspace:value.workspace&&typeof value.workspace==='object'&&/^#\/projects(?:\?|$)/.test(value.workspace.href)?value.workspace:null};}catch{return memory;}}
function write(data){memory=data;try{sessionStorage.setItem(key,JSON.stringify(data));}catch{}return data;}
export function patchWorkspace(patch){const data=readPlaces(),href=typeof location==='undefined'?'#/projects':location.hash;return write({...data,workspace:{href,...data.workspace,...patch}}).workspace;}
export function workspacePlace(){const place=readPlaces().workspace??{};return {...place,expanded:Array.isArray(place.expanded)?place.expanded.filter(id=>typeof id==='string'):[]};}
export function safeQuaternion(value,fallback){if(!Array.isArray(value)||value.length!==4||!value.every(Number.isFinite))return fallback;const length=Math.hypot(...value);return length>.0001?value.map(n=>n/length):fallback;}
export function capturePlace(){
 const href=location.hash||'#/',data=readPlaces();
 data.pages={...data.pages,[href]:{scrollY:window.scrollY}};
 const list=document.querySelector('.project-reading-list'),panel=document.querySelector('.project-cube-panel');
 if(list)data.workspace={...data.workspace,href,scrollTop:list.scrollTop,mode:panel?.dataset.viewMode??'project'};
 write(data);window.dispatchEvent(new Event('portfolio:capture-workspace'));
}
export function restorePage(){const place=readPlaces().pages[location.hash||'#/'];window.scrollTo(0,Number.isFinite(place?.scrollY)?Math.max(0,place.scrollY):0);}
export function openProjectDetails(project){capturePlace();location.hash=`/projects/${project.slug}`;}
export function restoreCubeMoves(engine,moves){
 if(!Array.isArray(moves))return engine;
 for(const move of moves.slice(0,256)){try{engine.move(move);}catch{break;}}
 return engine;
}
