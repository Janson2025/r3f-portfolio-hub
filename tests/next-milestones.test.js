import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { cubePermissions, easeTransition, transitionDuration } from '../src/app/project/scene/cube/viewModes.js';
import { createTextTimeline } from '../src/features/about/textTimeline.js';
import { bubbleSchedule, visibleBubbles } from '../src/features/about/bubbles.js';
import { gestureAt, gazeOffset, neutralClip, idleGestureAt } from '../src/features/about/avatarAnimation.js';
import { AnimationClip, QuaternionKeyframeTrack } from 'three';
import { profile } from '../src/data/profile.js';
import { products, services } from '../src/data/offerings.js';
import { resolvePortalBackground } from '../src/app/project/sticker/backgroundConfig.js';

test('mode permissions prevent activation/manipulation during transitions and overlays', () => {
  assert.deepEqual(cubePermissions('project', false, false, 'id'), { manipulate: false, activate: true });
  assert.deepEqual(cubePermissions('cube', false, false, 'id'), { manipulate: true, activate: false });
  for (const mode of ['project', 'cube']) {
    assert.deepEqual(cubePermissions(mode, true, false, 'id'), { manipulate: false, activate: false });
    assert.deepEqual(cubePermissions(mode, false, true, 'id'), { manipulate: false, activate: false });
  }
  assert.equal(cubePermissions('project', false, false, null).activate, false);
});
test('transitions retain intermediate frames even for reduced motion', () => {
  for (const reduced of [false, true]) assert.ok(transitionDuration(reduced) > 0.2);
  assert.equal(easeTransition(0), 0); assert.equal(easeTransition(1), 1);
  assert.ok(easeTransition(0.25) > 0 && easeTransition(0.25) < 1);
});
test('bubble schedule preserves the full text, limits DOM count and removes expired bubbles', () => {
  const text = 'A short sentence. '.repeat(45) + 'Last word.';
  const timeline = createTextTimeline(text), schedule = bubbleSchedule(timeline);
  assert.equal(schedule.map(item => timeline.text.slice(item.startIndex, item.endIndex)).join(''), text);
  for (let time = 0; time < timeline.durationMs + 2500; time += 57) {
    const visible = visibleBubbles(schedule, timeline, time);
    assert.ok(visible.length <= 3);
    for (const bubble of visible) { assert.ok(bubble.opacity >= 0 && bubble.opacity <= 1); assert.ok(text.includes(bubble.text)); }
  }
  const last = schedule.at(-1), halfway = visibleBubbles(schedule, timeline, last.finish + 2225).at(-1);
  assert.ok(halfway.opacity > 0 && halfway.opacity < 1);
  assert.deepEqual(visibleBubbles(schedule, timeline, timeline.durationMs + 2500), []);
});
test('greeting, talking and idle phases follow the shared narration clock', () => {
  const at = elapsedMs => gestureAt({ playing: true, elapsedMs }, 10000);
  assert.equal(at(-5200), 'neutral'); assert.equal(at(-4000), 'greeting'); assert.equal(at(-200), 'neutral');
  assert.equal(at(0), 'acknowledge'); assert.equal(at(7200), 'happy'); assert.equal(at(11000), 'neutral');
  assert.equal(gestureAt({ playing: false, elapsedMs: 7200 }, 10000), 'neutral');
  for (let time = 0; time < 30; time += 0.05) { const gaze = gazeOffset(time); assert.ok(Math.abs(gaze.x) <= 0.02 && Math.abs(gaze.y) <= 0.045); }
});
test('the new catalog entry retains its destination and backgrounds inherit half opacity with valid overrides', () => {
  const records = JSON.parse(readFileSync(new URL('../src/data/projects.json', import.meta.url)));
  const settings = JSON.parse(readFileSync(new URL('../src/app/project/sticker/params/stickers.json', import.meta.url)));
  assert.equal(records.length, 18);
  assert.equal(records.find(p => p.id === 'simple-rubix-cube').links[0].url, 'https://janson2025.github.io/simpleRubixCube/');
  assert.equal(settings.projects.find(p => p.id === 'simple-rubix-cube').portal.mesh.props.url, '/models/rubix_cube.glb');
  assert.equal(settings.defaults.portalBackground.opacity, 0.5);
  assert.equal(resolvePortalBackground(settings.defaults.portalBackground).opacity, 0.5);
  for (const project of settings.projects) {
    const opacity = resolvePortalBackground(settings.defaults.portalBackground, project.portal?.background).opacity;
    assert.ok(opacity >= 0 && opacity <= 1);
    assert.equal(opacity, project.portal?.background?.opacity ?? 0.5);
  }
  assert.equal(resolvePortalBackground(settings.defaults.portalBackground, { opacity: 0.35 }).opacity, 0.35);
  assert.equal(resolvePortalBackground(settings.defaults.portalBackground, { opacity: 0 }).opacity, 0);
});
test('product/service assets and marketplace links are local, complete and honest', () => {
  assert.equal(products.length, 1); assert.equal(products[0].url, 'https://jamescall7.gumroad.com/l/Moore_Idol');
  for (const product of products) for (const key of ['image', 'gif', 'model', 'environment']) assert.ok(existsSync(new URL(`../public${product[key]}`, import.meta.url)), product[key]);
  assert.equal(services.length, 3);
  for (const service of services) { assert.ok(!service.url); assert.ok(service.details && service.narration && service.scope.length); assert.ok(existsSync(new URL(`../public${service.image}`, import.meta.url))); }
});
test('neutral idle breathes, returns to its first pose and occasionally selects a secondary gesture', () => {
  const source = new AnimationClip('base', 1, [new QuaternionKeyframeTrack('Spine.quaternion', [0], [0, 0, 0, 1])]);
  const idle = neutralClip(source), values = idle.tracks[0].values;
  assert.equal(idle.duration, 6);
  assert.notDeepEqual([...values.slice(4, 8)], [...values.slice(0, 4)]);
  assert.ok(Math.abs(values[0] - values.at(-4)) < 1e-6);
  assert.equal(idleGestureAt(0), 'neutral'); assert.equal(idleGestureAt(16), 'acknowledge'); assert.equal(idleGestureAt(18), 'neutral');
  assert.deepEqual([...source.tracks[0].values], [0, 0, 0, 1]);
});
test('contact and invisible About shape resolve from local configuration', () => {
  assert.equal(profile.email, 'jamescall2012@gmail.com');
  assert.ok(existsSync(new URL('../public/images/avatar-wrap.svg', import.meta.url)));
});
