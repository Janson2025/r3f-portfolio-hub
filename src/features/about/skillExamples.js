export const skillExamples = {
  'Frontend / UI': [
    { label:'React', projectId:'character-config' },
    { label:'React Three Fiber', projectId:'r3f-molecules' },
    { label:'Three.js', projectId:'space-ship-explorer' },
    { label:'Tailwind', local:'portfolio' }, { label:'Vite', local:'portfolio' },
  ],
  '3D / Graphics': [
    { label:'Blender', projectId:'r3f-wing-configurator' },
    { label:'GLTF/GLB', projectId:'maze-ball-2' },
    { label:'FBX pipeline', local:'avatar' }, { label:'R3F animations', local:'avatar' },
  ],
  'Backend / Infra': [ { label:'Node.js', projectId:'r3f-wing-configurator' }, { label:'REST APIs', projectId:'paleo-gis' } ],
  'Tools / Workflow': [ { label:'Git & GitHub', projectId:'paleo-gis' }, { label:'Render/Vercel', projectId:'multiplex-hts' } ],
};
export function resolveSkillExample(skill, projects, portrait) {
  if (skill.local) return { href:skill.local==='avatar'?'#/about':'#/', title:skill.local==='avatar'?'Portfolio avatar introduction':'James Call portfolio hub', image:portrait,
    summary:skill.local==='avatar'?'An FBX-retargeted avatar with synchronized mouth cues and blended R3F animations.':'This portfolio uses React, Vite and Tailwind alongside its interactive 3D scenes.' };
  const project=projects.find(item=>item.id===skill.projectId);
  return project?{href:`#/projects/${project.slug}`,title:project.title,image:project.image,summary:project.summary}:null;
}
