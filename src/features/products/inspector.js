export function ownInspectorMaterials(root){
 const copies=new Map(),originals=new Map();
 root.traverse(mesh=>{if(!mesh.isMesh||!mesh.material)return;const clone=material=>{if(!copies.has(material)){const copy=material.clone();copies.set(material,copy);originals.set(copy,{color:copy.color?.clone(),wireframe:copy.wireframe});}return copies.get(material);};mesh.material=Array.isArray(mesh.material)?mesh.material.map(clone):clone(mesh.material);});
 return {materials:[...originals.keys()],originals,dispose:()=>originals.forEach((_,material)=>material.dispose())};
}
export function applyInspectorMode(owned,mode){for(const [material,original] of owned.originals){material.wireframe=mode==='wireframe'||original.wireframe===true;if(material.color){if(mode==='wireframe')material.color.set('#142e44');else if(original.color)material.color.copy(original.color);}material.needsUpdate=true;}}
