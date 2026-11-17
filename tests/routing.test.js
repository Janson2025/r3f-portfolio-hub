import test from 'node:test';
import assert from 'node:assert/strict';
import {parseRoute,routeHref} from '../src/lib/routing.js';
test('hash routes preserve conventional project and filter addresses',()=>{
  const route=parseRoute('#/projects?category=Web+apps&q=maze&technology=React');
  assert.equal(route.path,'/projects');
  assert.equal(route.params.get('category'),'Web apps');
  assert.equal(route.params.get('q'),'maze');
  assert.equal(parseRoute('#/projects/character-config').path,'/projects/character-config');
  assert.equal(parseRoute('').path,'/');
  assert.equal(parseRoute('#bad-route').path,'/not-found');
  assert.equal(parseRoute('#/about/').path,'/about');
});
test('legacy portal hashes continue to resolve to the combined Project page',()=>{
  const route=parseRoute('#project/character-config');
  assert.equal(route.path,'/projects');
  assert.equal(route.params.get('project'),'character-config');
});
test('route construction safely encodes filter values',()=>{
  const href=routeHref('/projects',{q:'3D & interactive',technology:'',category:'Software'});
  assert.equal(parseRoute(href).params.get('q'),'3D & interactive');
  assert.equal(parseRoute(href).params.has('technology'),false);
});

test('removed Explore addresses normalize to the combined page',()=>{assert.equal(parseRoute('#/explore?focus=character-config').path,'/projects');});
