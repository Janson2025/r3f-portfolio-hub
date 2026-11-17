import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync,existsSync } from 'node:fs';
import { createCubeCatalog } from '../src/app/project/catalogAdapter.js';
import { createProjectStickerOverrides } from '../src/app/project/grid/engine/projectAssignment.js';
const records=JSON.parse(readFileSync(new URL('../src/data/projects.json',import.meta.url))),settings=JSON.parse(readFileSync(new URL('../src/app/project/sticker/params/stickers.json',import.meta.url)));
test('Cultural API uses the supplied preview, documentation link and a cone placeholder',()=>{
 const project=records.find(p=>p.id==='cultural-api');assert.equal(project.slug,'cultural-api');assert.equal(project.visibility,'published');assert.equal(project.links.find(link=>link.kind==='demo').url,'https://cse341-team-final-project.onrender.com/api-docs/');assert.ok(existsSync(new URL('../public'+project.image,import.meta.url)));
 const cube=createCubeCatalog(records,settings),entry=cube.projects.find(p=>p.id===project.id);assert.equal(entry.portal.mesh.type,'cone');assert.ok(entry.portal.mesh.props.radius>0&&entry.portal.mesh.props.height>0);assert.equal(entry.portal.background.image,project.image);assert.equal(entry.portal.background.opacity,.5);
});
test('the published catalog fits the cube with every entry assigned exactly once',()=>{
 const catalog=createCubeCatalog(records,settings),assignments=createProjectStickerOverrides({dimensions:[2,2,2],projects:catalog.projects,seed:'cultural-api'});
 assert.equal(assignments.size,catalog.projects.length);assert.deepEqual([...assignments.values()].map(entry=>entry.id).sort(),records.filter(entry=>entry.visibility==='published').map(entry=>entry.id).sort());
});
