import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
const manifest=JSON.parse(readFileSync(new URL('../dist/.vite/manifest.json',import.meta.url)));
const entry=Object.entries(manifest).find(([,record])=>record.isEntry)?.[0];
assert.ok(entry,'Production entry must exist. Run npm run build first.');
const initial=new Set();
function visit(key) {if(initial.has(key))return;initial.add(key);for(const dependency of manifest[key].imports??[])visit(dependency);}
visit(entry);
assert.ok(![...initial].some(key=>(key.includes('SceneRoot')||key.includes('AboutAvatarCanvas')||key.includes('ProductScene')||key.includes('ModelRibbonScene'))),'3D scenes must remain outside the initial import graph.');
assert.ok(Object.keys(manifest).some(key=>key.includes('SceneRoot')),'Scene must remain available as a dynamic chunk.');
const bytes=[...initial].reduce((total,key)=>total+statSync(new URL(`../dist/${manifest[key].file}`,import.meta.url)).size,0);
assert.ok(bytes<300000,`Initial JavaScript exceeded the measured 300 kB budget: ${bytes}`);
console.log(`Build boundary verified: ${(bytes/1000).toFixed(2)} kB initial JavaScript; scene loads dynamically.`);
