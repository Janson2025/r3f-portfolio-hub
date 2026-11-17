import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { themes, themeCss, themeInitScript } from '../src/lib/themes/registry.js';
import { initializeThemes, getResolvedTheme, subscribeTheme } from '../src/lib/themes/store.js';

test('every palette implements the same semantic contract', () => {
  assert.equal(new Set(themes.map(theme => theme.id)).size, themes.length);
  for (const theme of themes) {
    assert.deepEqual(Object.keys(theme.colors).sort(), Object.keys(themes[0].colors).sort());
    assert.ok(themeCss.includes(`[data-theme="${theme.id}"]`));
  }
});
test('theme bootstrap follows the browser even with a previous saved override', () => {
  for (const dark of [false, true]) {
    const root = { dataset: {} };
    vm.runInNewContext(themeInitScript, { document: { documentElement: root }, matchMedia: () => ({ matches: dark }), localStorage: { getItem() { throw new Error('Manual storage must not be read'); } } });
    assert.equal(root.dataset.theme, dark ? 'dark' : 'light');
    assert.equal(root.dataset.themePreference, 'system');
  }
});
function luminance(hex) {
  const c = hex.slice(1).match(/../g).map(v => parseInt(v, 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
  return c[0] * .2126 + c[1] * .7152 + c[2] * .0722;
}
test('core text and interactive states meet AA contrast', () => {
  for (const { id, colors: c } of themes) for (const [fg, bg] of [['text', 'canvas'], ['text-muted', 'canvas'], ['text-muted', 'surface-raised'], ['text-muted', 'accent-weak'], ['accent', 'canvas'], ['accent-contrast', 'accent']]) {
    const a = luminance(c[fg]), b = luminance(c[bg]);
    assert.ok((Math.max(a, b) + .05) / (Math.min(a, b) + .05) >= 4.5, `${id}: ${fg}/${bg}`);
  }
});
test('live browser preference changes update CSS and canvas subscribers without manual storage', () => {
  const originals = { window: globalThis.window, document: globalThis.document, localStorage: globalThis.localStorage };
  const events = new EventTarget(), media = new EventTarget(); media.matches = false;
  let removedKey = null, removedStyle = false, notifications = 0;
  globalThis.window = events; events.matchMedia = () => media;
  globalThis.document = { documentElement: { dataset: {} }, head: { appendChild() {} }, createElement: () => ({ remove() { removedStyle = true; } }) };
  globalThis.localStorage = { removeItem(key) { removedKey = key; }, getItem() { throw new Error('Do not read stored themes'); } };
  try {
    const cleanup = initializeThemes();
    const unsubscribe = subscribeTheme(() => notifications++);
    assert.equal(getResolvedTheme(), 'light'); assert.equal(removedKey, 'portfolio-theme');
    media.matches = true; media.dispatchEvent(new Event('change'));
    assert.equal(getResolvedTheme(), 'dark'); assert.equal(notifications, 1);
    const storage = new Event('storage'); Object.assign(storage, { key: 'portfolio-theme', newValue: 'light' }); events.dispatchEvent(storage);
    assert.equal(getResolvedTheme(), 'dark');
    unsubscribe(); cleanup(); assert.equal(removedStyle, true);
    localStorage.removeItem = () => { throw new Error('Blocked storage'); };
    const stop = initializeThemes(); assert.equal(getResolvedTheme(), 'dark'); stop();
  } finally { for (const [key, value] of Object.entries(originals)) { if (value === undefined) delete globalThis[key]; else globalThis[key] = value; } }
});
