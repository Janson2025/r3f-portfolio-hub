# Combined Project workspace and portal backgrounds

Implemented in the R3F/Vite project. The primary menu contains only Projects, About, Products & services, and Contact. The logo still returns home.

## Page layout and selection

`#/projects` is the single browsing destination. Desktop has the title/filter area above a vertical project list on the left and a contained cube canvas on the right. Mobile puts the viewer above the list, dividing the space below the header. The list scrolls independently of the canvas. The old floating summary and chip strip are not mounted; summaries, technology tags, details and demo actions are in each list entry.

The page owns selection. User list scrolling selects the project at the reading position; cube previous/next controls, wheel stepping, sticker selection, and settled manual manipulation update the list. Programmatic scrolling is guarded so it does not emit a competing selection. New focus requests retarget the cube from its current orientation rather than waiting through a queue. The selected portal has an accent outline.

Filters determine the eligible project set. Cube assignments stay stable: nonmatching portal previews become plain stickers and cannot drive the filtered list. Zero results retain an empty list state. Keyboard shortcuts are scoped to the cube panel, and reduced motion skips focus interpolation and disables idle movement. The cube engine and undo/redo remain unchanged.

The canvas fits its own container using the cube bounds and aspect ratio. It does not need a full-page viewport. Scene loading is lazy on the Project page; the list remains usable during loading or rendering failure. The optional Hide 3D control keeps direct project/demo browsing available.

Old `#/explore` and `#project/<id>` links normalize to the combined route, preserving relevant query parameters. Case-study routes remain separate. Embedded demos are still viewport-wide dialogs with origin/source checks, Back/Forward, Escape from hub controls and focus restoration.

## Automatic themes

The header has no theme selector. Initialization and live updates use the browser's `prefers-color-scheme` signal. The old manual `portfolio-theme` key is retired without clearing unrelated storage. Palette values remain centralized in `src/lib/themes/registry.js`, including canvas colors; additional palettes can still be authored in code.

## Portal background JSON

Defaults are in `src/app/project/sticker/params/stickers.json`:

```json
{
  "defaults": {
    "portalBackground": {
      "type": "hemisphere",
      "radius": 6,
      "position": [0, 0, 0],
      "rotation": [0, 0, 0],
      "opacity": 1
    }
  }
}
```

Each project's `portal` includes:

```json
{
  "background": { "image": null }
}
```

`image: null` inherits the project's `image` from `src/data/projects.json`. This avoids maintaining the same screenshot in two content records. Override only when the portal needs a different image or framing:

```json
{
  "background": {
    "image": "/images/backgrounds/my-project.png",
    "radius": 8,
    "position": [0, 0, -1],
    "rotation": [0, 0.15, 0],
    "opacity": 1
  }
}
```

The geometry is the rear half of a sphere, rendered from its interior with an unlit image material. It sits behind the model, does not rotate with model animations, and does not intercept pointer selection. Its radius is measured in portal-scene units; it should comfortably surround the model. Ordinary screenshots stretch over the curved surface, so panoramic art will give more natural spatial coverage. A missing/unloadable image does not take down the cube: the solid portal color remains as fallback.

Existing screenshots were connected for all 16 prior catalog entries. Castle Chess was present in the supplied scene JSON but absent from the public catalog; a minimal catalog entry now makes its model available. It uses the neutral `portal-fallback.svg` until its background image is supplied, and has no invented demo URL, role, or outcomes.

## Validation

Run `npm test`, `npm run build`, and `npm run verify:build`. Coverage includes cube invariants, catalog/scene identity, image existence, selection/filter endpoints, route compatibility, hemisphere inheritance/validation, automatic theme behavior, overlay safety and WebGL detection. Browser checks cover the rendered cube with image backgrounds, desktop/mobile layout, list-to-cube and cube-to-list selection, filter behavior and embedded demo navigation. No deployment is included.

The deferred 3D bundle remains large and Vite still reports its size warning. These changes do not introduce a CMS or verify external demos' uptime. Castle Chess still needs an owner-supplied background image and demo URL.
