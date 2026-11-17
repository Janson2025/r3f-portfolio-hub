import { startLoadingCube } from './lib/loadingCube.js';
const host=document.querySelector('#site-loading .mini-cube-stage');
const stop=host?startLoadingCube(host):()=>{};
export function finishBootLoading(){stop();document.getElementById('site-loading')?.remove();}
