# James Call — portfolio hub

A React portfolio with a combined project list and React Three Fiber cube explorer, plus a separate About avatar. Built with Vite, React 19, Three.js/Drei, Tailwind 4, and Sass. The existing cube engine, project models, 19 configured project identities and original demo links are retained.

## Run locally

Requires Node.js 20.19+ or 22.12+ and npm. Use the npm lockfile for this workflow; the pre-existing Yarn lockfile has been retained.

```sh
npm ci
npm run dev
npm test
npm run build
npm run verify:build
npm run preview
```

Dev normally serves at http://localhost:5173. Preview normally serves at http://localhost:4173. Nothing in this migration deploys a site or connects a backend.

## Routes and rendering

Pages: `#/`, `#/projects`, `#/projects/<slug>`, `#/about`, `#/offerings`, `#/contact`, and `#/privacy`. The menu contains Projects, About, Products & services, and Contact. Projects combines a vertical list and contained cube viewer: list/title on the left, canvas on the right; canvas below the list on mobile. Scroll selection works in both directions. Old `#/explore` and `#project/<id>` addresses redirect into the combined page. Discipline category, technology and focus live in the URL; the retired search input is removed. `#/admin` remains an informational notice, not an authenticated editor.

Hash routing preserves deep links on static hosts without server rewrite rules. This remains a client-rendered Vite application: it does **not** gain Next.js server rendering, per-route HTTP status codes, prerendered case studies, or complete per-route search/social metadata. Unknown routes display an in-app not-found page. For full SEO, plan prerendering or a separate framework migration. The no-JavaScript notice links to the owner's GitHub; a full no-JavaScript portfolio is not implemented.

## Content ownership

- `src/data/projects.json`: the single public-content catalog. Add title, slug, descriptions, tags, screenshots, links, order, featured selection, progress status and publication visibility here.
- `src/features/projects/catalog.js`: JSDoc domain contract, validation, published-only selection and composable filtering.
- `src/features/projects/queries.js`: the replaceable public query boundary. Conventional components do not import the cube, models, or placement JSON.
- `src/app/project/sticker/params/stickers.json`: **scene configuration only**, joined to project records by `id`. Keep portal meshes, material options, placement hints and priorities here.
- `src/app/project/catalogAdapter.js` and `projectCatalog.js`: join published content to the original scene API. Do not copy project titles, summaries or URLs back into sticker settings.
- `src/data/profile.js`: existing biography and verified public GitHub/previous-portfolio URLs; email is jamescall2012@gmail.com; LinkedIn and resume remain unset.

The existing descriptions are retained as supplied, rather than replaced with invented case studies. Unverified roles, progress, dates, results and metrics are unset. `caseStudy` can contain `{ heading, body }` sections once the owner supplies them. Products & services contains the supplied Moore Idol fish, linked to Gumroad, and three service cards with in-page detail dialogs. Its 3D fish preview uses the supplied HDR, the relocated model’s embedded `slow swim.007` clip, and a separate idle bob. Rotation is controlled by orbit dragging or a labeled slider. The supplied GIF and thumbnail remain selectable. No price or license terms are invented.

`visibility` and `status` have separate meanings. Local filtering excludes drafts and archived items from both presentations, but static source files are **not confidential storage**. Future private drafts and owner mutations require a server, authentication/owner authorization, RLS and protected media storage. Never store credentials or sensitive draft content in this catalog.

## Browser-driven themes

There is no theme selector. The site follows the light/dark preference reported by the browser, including live changes. The old manual preference is retired; unrelated local storage is preserved. Palette values stay in `src/lib/themes/registry.js`, including scene colors. Additional palettes can still be authored in that registry. JSDoc documents the shape and contract/contrast tests validate it.

## Combined 3D browsing

The scene is lazy-loaded on entering Projects. List scrolling focuses cube projects; cube wheel/spatial-arrow navigation and settled manipulation update the list. Selection is shared at page level and programmatic scrolls do not feed back into the cube. Filtered-out projects remain at their assigned positions as plain stickers. No floating summary or duplicate project grid appears on this page. The home page keeps the horizontal project strip and portrait, and adds a lazy double helix in one canvas: eight local models are randomized into disjoint strands travelling in opposite directions. Darker bordered bands, models and technology labels share real depth-based crossings. It autoplays and pauses offscreen/hidden; keyboard links remain available without animation controls.

The renderer centers and zooms to the selected portal in its actual container, with four physical-direction arrows around it. Default camera zoom is 0%; camera position, look-at target and cube pose transition together. The Project page stays within the viewport, with a bounded, repeating project-list window and thumbnails. Hover/focus selects; card clicks open the project. Responsive resizing preserves selection. Mobile has one-row compact filters and list above canvas, with card descriptions hidden. The canvas is always present; WebGL failure and loading leave the same list and direct links usable. Ambient motion stays paused, and OS reduced-motion preferences skip focus interpolation. The engine/history source is retained. The development control panel is unmounted. The Cube view / Project view button transitions between a manipulable overview and a locked focused portal. Only the current settled portal opens a project in Project view. Its rising title bubble sits above the centered down arrow and also opens the project. A stationary Cube-view portal click focuses it; dragging continues to turn slices. Hovered overview portals animate, while the focused portal animates continuously. After 35 seconds without activity, Cube view starts a subtle idle bob/rotation; activity and overlays reset the idle clock.

Each portal has an image-textured rear hemisphere behind the model. `defaults.portalBackground` controls radius (4.5), angular coverage (0.72), position, rotation and opacity (0.5); `portal.background.image: null` inherits the catalog image. A per-project override can use different artwork. Existing screenshots are connected for the prior catalog; the owner’s Castle Chess image, project link and model transforms are retained. See [the current stages and configuration](docs/10-interaction-and-loading-plan.md). Older guides record previous defaults. Individual portal opacity overrides are preserved over the shared 0.5 default.

Cards, focused portals and title bubbles open the project detail page. Live demo links there navigate in the same tab. Session storage retains workspace filters/focus, list offset, view mode, completed cube moves and page scroll for Back navigation. Mobile cards have a More details disclosure; technologies sit below the title beside the image. External demos can fail independently.

## About introduction

The About page has a profile photo and its own transparent, lazy avatar canvas on the left of flowing desktop text. An invisible local SVG defines the text-wrap curve; content fills the width below the float and stacks on mobile. A shared timeline synchronizes transient speech bubbles with mouth morphs and blended greeting/talking gestures. A generated breathing idle occasionally blends into an acknowledgement. The full biography stays visible. Content-width questions are immediately available in a horizontal strip and interrupt the automatic introduction. Pointer-facing gaze, click/keyboard duck then nervous-look-around, and long-idle dance supplement the existing talking and idle gestures. Skills link to verified showcases and show image/title/summary tooltips on hover or keyboard focus; unsupported examples are hidden, including Astro. This is silent, text-driven lip sync. Products & services does not mount an avatar.

## Validation and limits

`npm test` runs 102 checks covering spatial adjacency, focus framing, synchronized text/mouth playback, background configuration, cube state invariants, catalog identity and visibility, links/previews, filters, route handling, themes/contrast/storage, WebGL capability fallback and iframe message validation. `npm run verify:build` checks the production import graph and a measured 300 kB initial JavaScript budget. The large scene chunk still triggers Vite's bundle-size warning; models can still be expensive on the Project page. No real-device performance or exhaustive external-demo availability claims are made.

See [the original migration record](docs/05-r3f-migration-plan.md), [combined-page plan](docs/06-unified-project-page-plan.md), and [current development stages](docs/10-interaction-and-loading-plan.md) for comparison, decisions, completed checks and follow-up work. Supabase CMS/auth/storage, additional product records, detailed case studies, full TypeScript conversion, and commercial-host review remain future work.


## Readiness and product assets

Product/service files now live in `public/products-and-services/`; the fish preview uses `public/products-and-services/moore_idol/Moore_Idol.glb`. The supplied GIF, thumbnail and service SVGs use the same tree. The underwater HDR remains in `public/environments/`.

A shared DOM/CSS cube loader runs without WebGL, with a solved-to-scrambled-to-solved preset, jump/full turn and bobbing pause. It covers delayed cube/avatar/ribbon readiness, and static startup markup can animate while JavaScript downloads. Individual portal models have their own suspension/error boundaries. Renderer readiness is based on committed frames; recoverable context loss retains the canvas, with bounded automatic remounts and an actionable fallback if recovery fails. Lazy component retries reset the component cache. Decorative loader/cube/ribbon motion honors reduced motion; the double helix autoplays while visible. About autoplay follows the owner’s explicit preference.


## Latest development stages

See [inspector, interactions and navigation](docs/11-inspector-navigation-and-audio-plan.md), [audio narration research](docs/12-audio-narration-research.md), and [double helix integration](docs/13-double-helix-ribbon-plan.md). Product preview modes share a persistent canvas, isolated materials and owned animation mixer, with bounded recovery and retry. The sound icon defaults off; current optional sounds are synthesized effects/ambient prototypes, not spoken narration. Production voice selection and aligned audio clips remain a separate step.

Latest validation: regression tests and production import budget checks; Render/Wireframe and eight repeated GIF/image/3D format cycles were browser-checked without console errors. Further visual checks of the new helix, avatar interactions, mobile and external-demo Back restoration remain outstanding because computer-use verification was interrupted by URL detection. No deployment was performed.


### Ribbon transforms and hover previews

Edit `src/features/home/ribbonConfig.js` for global model/card sizing and per-model `position`, `rotation` (degrees), `scale`, destination and content reference. Both larger models and text cards navigate to their configured project/offerings destination. Hover/focus previews use catalog images, titles and summaries. Hovering either surface eases the shared clock to a full stop; leaving resumes smoothly. Text cards clear the frontmost depth of their own ribbon across their entire width. See [configuration and interaction details](docs/14-ribbon-interaction-and-config.md).


### Portrait reveal and orientation polish

Home and About portraits now share `PortraitReveal`, using the original close-up photo and the local pencil portrait with clustered/drizzle canvas masks. Hover enlarges openings temporarily and spawns falling drops near the pointer. `src/features/portrait/portraitRevealConfig.js` holds the effect settings. Static fallback remains for initialization failure; reduced-motion fallback is configurable, and animation pauses offscreen/hidden. Ribbon config adds reusable fixed/camera/path orientation modes and a forward axis, and hover easing is gentler. Tooltips wait for measured placement before becoming visible. See [stage 15 and validation limits](docs/15-portrait-reveal-and-ribbon-polish.md).


### Portrait autoplay fix and Cultural API

The browser was reporting reduced motion, so the initial portrait implementation never initialized. `respectReducedMotion: false` in the portrait config now enables the requested autoplay; setting it to `true` restores a system-driven static fallback. Both React and CSS use that same policy. Initialization state is visible as `data-reveal-state` for diagnosis, and genuine errors are logged instead of silently swallowed. Pencil zoom and position align the different source crops.

Cultural API is the 19th published project, available at `#/projects/cultural-api` with the provided background and a configurable cone placeholder. See [stage 16](docs/16-portrait-autoplay-and-cultural-api.md) for validation and remaining browser checks.


### Uncropped portrait frames and settling drops

Both original portrait sources now fit wholly into the same photo-ratio artwork frame, preserving proportions; the wider pencil source receives padding. Image borders and cover/zoom cropping are removed, and Browse projects sits below the artwork. Original-style radii/growth/fade/lifetimes return with explicit rendering caps. New droplets briefly smear downwards, settle, finish growing and fade where they stop. See [stage 17](docs/17-uncropped-portraits-and-settling-drops.md) and `src/features/portrait/portraitRevealConfig.js` for settings and verification.


### Spiky splats and satellites

The portrait's `contour` config controls sharper, persistent angular tips. Its `satellites` config gives large splats a chance of emitting adjacent mini splats, with size/count/probability controls and no recursive generation. Both use the existing population limits. See [stage 18](docs/18-spiky-splats-and-satellites.md). All 88 regression tests and production build/import-budget checks pass; a fresh browser visual check was not performed for this adjustment.


### Fine contours, tiny edge feather and continuous hover rain

Large/medium/small splats use adaptive 320/160/80-point outlines with a dense fringe of shorter tips. A 0.6px feather softens the very edge. Hover keeps emitting while the pointer is stationary; each primary drop has a 60% chance of matching openings through both pencil/photo masks and 40% of opening only the pencil layer. Density gradually shortens holds/fades, with reserved crossfade slots keeping total counts inside the existing 80/64 limits. Your live smear-distance tuning is preserved. See [contour plan](docs/19-fine-splatter-contours.md) and [hover/fade plan](docs/20-hover-continuity-and-edge-feather.md). All 92 tests and production checks pass; no new live-browser check is claimed for this final refinement.


### Latest portfolio polish

[Stage 21](docs/21-portfolio-layout-contact-audio-and-questions.md) covers the cropped/glass hero link, contact photo/email copying/social icons, focused capability links, recorded rock-slide excerpts and the ? question menu. Tune sample offsets/levels in `src/features/audio/soundConfig.js`. Sound remains off initially. All 99 automated tests and production import-budget checks pass; browser/audio listening verification is recorded in the stage document.


### Short slice sound hits

[Stage 22](docs/22-short-slice-sound-hits.md) uses one randomly chosen 220ms hit from the 4–5 or 6–7 second source range. Significant held-drag displacement retriggers it before release, with a single slide voice and no queued catch-up playback. Tune `maxDuration`, `dragThresholdRadians` and the clip ranges in `src/features/audio/soundConfig.js`. All 102 tests and production checks pass.
