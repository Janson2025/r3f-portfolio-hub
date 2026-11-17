import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveSelection, stepSelection, readingProject } from '../src/features/projects/selection.js';
import { resolvePortalBackground, fallbackBackground } from '../src/app/project/sticker/backgroundConfig.js';

test('filtered selection keeps valid IDs and safely handles empty results', () => {
  assert.equal(resolveSelection(['a', 'b'], 'b'), 'b');
  assert.equal(resolveSelection(['a', 'b'], 'hidden'), 'a');
  assert.equal(resolveSelection([], 'a'), null);
});
test('cube stepping clamps endpoints and follows the filtered order', () => {
  assert.equal(stepSelection(['a', 'c', 'e'], 'c', 1), 'e');
  assert.equal(stepSelection(['a', 'c', 'e'], 'e', 1), 'e');
  assert.equal(stepSelection(['a', 'c', 'e'], 'a', -1), 'a');
  assert.equal(stepSelection([], null, 1), null);
});
test('list reading selection handles unequal card heights and list endpoints', () => {
  const cards = [{ id: 'a', top: -250, height: 300 }, { id: 'b', top: 50, height: 400 }, { id: 'c', top: 450, height: 200 }];
  assert.equal(readingProject(cards, 500, 250, 500), 'b');
  assert.equal(readingProject(cards, 500, 0, 500), 'a');
  assert.equal(readingProject(cards, 500, 500, 500), 'c');
  assert.equal(readingProject([], 500, 0, 0), null);
});
test('hemisphere backgrounds inherit the catalog image and permit per-portal overrides', () => {
  const defaults = { radius: 8, opacity: 0.9 };
  assert.equal(resolvePortalBackground(defaults, { image: null }, '/images/project.png').image, '/images/project.png');
  const custom = resolvePortalBackground(defaults, { image: '/images/custom.png', radius: 10 });
  assert.equal(custom.image, '/images/custom.png'); assert.equal(custom.radius, 10); assert.equal(custom.opacity, 0.9);
  assert.equal(resolvePortalBackground().image, fallbackBackground);
});
test('invalid hemisphere transforms and sizes cannot produce invalid geometry', () => {
  const config = resolvePortalBackground({}, { radius: -1, opacity: 4, position: [0, NaN, 0], rotation: [1] });
  assert.equal(config.radius, 4.5); assert.equal(config.opacity, 1);
  assert.deepEqual(config.position, [0, 0, 0]); assert.deepEqual(config.rotation, [0, 0, 0]);
});

test('portal backgrounds default to half opacity and a smaller angular patch',()=>{const c=resolvePortalBackground();assert.equal(c.opacity,0.5);assert.equal(c.coverage,0.72);assert.equal(resolvePortalBackground({}, {opacity:0.8}).opacity,0.8);});
