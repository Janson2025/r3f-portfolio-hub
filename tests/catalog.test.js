import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { selectPublishedProjects, filterProjects, validateCatalog } from '../src/features/projects/catalog.js';
import { safeExternalUrl } from '../src/lib/urls.js';
import { createCubeCatalog } from '../src/app/project/catalogAdapter.js';
const records = JSON.parse(readFileSync(new URL('../src/data/projects.json', import.meta.url)));
const settings = JSON.parse(readFileSync(new URL('../src/app/project/sticker/params/stickers.json', import.meta.url)));
test('all configured projects retain valid identity, models and background images', () => {
  assert.equal(records.length,settings.projects.length);
  assert.deepEqual(validateCatalog(records), []);
  const cube = createCubeCatalog(records,settings);
  assert.deepEqual(cube.projects.map(p=>p.id),settings.projects.map(p=>p.id));
  for (const entry of cube.projects) {
    if (entry.id !== "castle-chess") assert.ok(entry.links.demo);
    const original = settings.projects.find(p=>p.id===entry.id).portal;
    assert.deepEqual(entry.portal.mesh, original.mesh);
    assert.deepEqual(entry.portal.animation, original.animation);
    assert.equal(entry.portal.background.type, "hemisphere");
    assert.ok(existsSync(new URL(`../public${entry.portal.background.image}`,import.meta.url)),entry.id);
  }
});
test('unpublished records are excluded from both list and cube', () => {
  const data = records.map((p,i)=>({...p,visibility:i===0?'draft':i===1?'archived':'published'}));
  assert.equal(selectPublishedProjects(data).length,records.length-2);
  assert.equal(createCubeCatalog(data,settings).projects.length,records.length-2);
});
test('all configured project preview files exist', () => {
  for (const p of records) if (p.image) assert.ok(existsSync(new URL(`../public${p.image}`,import.meta.url)),p.image);
});
test('filters compose discipline, technology and case-insensitive search', () => {
  const filtered = filterProjects(records,{category:'Software',technology:'Python',search:'SCREENING'});
  assert.deepEqual(filtered.map(p=>p.id),['multiplex-hts']);
  assert.equal(filterProjects(records,{search:'no-such-project'}).length,0);
});
test('outbound URL validation rejects executable, insecure and credentialed destinations', () => {
  for(const url of ['javascript:alert(1)','http://example.com','//example.com','https://user:password@example.com','invalid']) assert.equal(safeExternalUrl(url),null);
  assert.equal(safeExternalUrl('https://example.com'),'https://example.com/');
});
