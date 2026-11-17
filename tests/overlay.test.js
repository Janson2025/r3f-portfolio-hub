import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolveOverlayProject,overlayHref,isTrustedProjectMessage } from '../src/lib/overlay.js';
const records=JSON.parse(readFileSync(new URL('../src/data/projects.json',import.meta.url)));
test('overlay deep links only resolve published catalog entries with safe demos',()=>{
  assert.equal(resolveOverlayProject(overlayHref('character-config'),records).id,'character-config');
  assert.equal(resolveOverlayProject('#/explore?project=missing',records),null);
  assert.equal(resolveOverlayProject('#/about?project=character-config',records),null);
  assert.equal(resolveOverlayProject(overlayHref('character-config'),records.map(p=>({...p,visibility:'draft'}))),null);
});
test('project postMessage requires the exact iframe source and origin',()=>{
  const frame={};const origin='https://example.com';
  assert.equal(isTrustedProjectMessage({origin,source:frame,data:{type:'project-ready'}},origin,frame),true);
  assert.equal(isTrustedProjectMessage({origin,source:{},data:{type:'project-ready'}},origin,frame),false);
  assert.equal(isTrustedProjectMessage({origin:'https://other.example',source:frame,data:{type:'back-from-project'}},origin,frame),false);
  assert.equal(isTrustedProjectMessage({origin,source:frame,data:{type:'unexpected'}},origin,frame),false);
});
