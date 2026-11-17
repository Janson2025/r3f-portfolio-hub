/** Ribbon presentation settings. Model rotations are DEGREES; offsets are scene units.
 * Models are normalized first, then these transforms are applied. See docs/14.
 */
export const ribbonConfig = {
  modelSize: 1.45,
  label: { width: 3.6, height: 1.12, offsetX: 3.1 },
  hover: { stopRate: 5, resumeRate: 2.5, stopThreshold: .004 },
  defaults: { position: [0, 0, 0], rotation: [6, 20, 0], scale: 1, orientation: 'fixed', forwardAxis: [1,0,0] },
  models: [
    { id:'molecule', kind:'project', contentId:'r3f-molecules', url:'/models/glucose.glb', technology:'React Three Fiber', href:'#/projects/r3f-molecules', title:'3D Molecule Maker' },
    { id:'cube', kind:'project', contentId:'simple-rubix-cube', url:'/models/rubix_cube.glb', technology:'Three.js', href:'#/projects/simple-rubix-cube', title:'Simple Rubix Cube' },
    { id:'fish', kind:'product', contentId:'moore-idol', url:'/products-and-services/moore_idol/Moore_Idol.glb', technology:'GLTF / GLB', href:'#/offerings', title:'Moore Idol fish', position:[0,0,0], rotation:[0,0,0], scale:1, orientation:'path', forwardAxis:[0,0,1] },
    { id:'fossil', kind:'project', contentId:'3d-animal-icon-lab', url:'/models/fossil.glb', technology:'Blender', href:'#/projects/3d-animal-icon-lab', title:'3D Animal Icon Lab' },
    { id:'chess', kind:'project', contentId:'castle-chess', url:'/models/castle-chess.glb', technology:'Three.js', href:'#/projects/castle-chess', title:'Castle Chess' },
    { id:'tree', kind:'project', contentId:'plums', url:'/models/plumTree.glb', technology:'JavaScript', href:'#/projects/plums', title:'Personal Learning System' },
    { id:'parasite', kind:'project', contentId:'multiplex-hts', url:'/models/trapanazome.glb', technology:'Data visualization', href:'#/projects/multiplex-hts', title:'Drug Screening Analysis' },
    { id:'reveal', kind:'project', contentId:'circles-mask-revealer', url:'/models/image-revealer.glb', technology:'JavaScript', href:'#/projects/circles-mask-revealer', title:'Spinning Circle Image Revealer', rotation:[0,-90,0], orientation:'camera' },
  ],
};
