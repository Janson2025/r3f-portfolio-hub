# James Call — portfolio hub

A React portfolio with a combined project list and React Three Fiber cube explorer, plus a separate About avatar. Built with Vite, React 19, Three.js/Drei, Tailwind 4, and Sass. The existing cube engine, project models, 18 configured project identities and original demo links are retained.

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

The scene is lazy-loaded on entering Projects. List scrolling focuses cube projects; cube wheel/spatial-arrow navigation and settled manipulation update the list. Selection is shared at page level and programmatic scrolls do not feed back into the cube. Filtered-out projects remain at their assigned positions as plain stickers. No floating summary or duplicate project grid appears on this page. The home page keeps the horizontal project strip and portrait, and adds a single lazy 3D ribbon: four randomly chosen lightweight models travel along a wavy loop with technology/project links. It pauses offscreen and has play/pause controls.

The renderer centers and zooms to the selected portal in its actual container, with four physical-direction arrows around it. Default camera zoom is 0%; camera position, look-at target and cube pose transition together. The Project page stays within the viewport, with a bounded, repeating project-list window and thumbnails. Hover/focus selects; card clicks open the project. Responsive resizing preserves selection. Mobile has one-row compact filters and list above canvas, with card descriptions hidden. The canvas is always present; WebGL failure and loading leave the same list and direct links usable. Ambient motion stays paused, and OS reduced-motion preferences skip focus interpolation. The engine/history source is retained. The development control panel is unmounted. The Cube view / Project view button transitions between a manipulable overview and a locked focused portal. Only the current settled portal opens a project in Project view. Its rising title bubble sits above the centered down arrow and also opens the project. A stationary Cube-view portal click focuses it; dragging continues to turn slices. Hovered overview portals animate, while the focused portal animates continuously. After 35 seconds without activity, Cube view starts a subtle idle bob/rotation; activity and overlays reset the idle clock.

Each portal has an image-textured rear hemisphere behind the model. `defaults.portalBackground` controls radius (4.5), angular coverage (0.72), position, rotation and opacity (0.5); `portal.background.image: null` inherits the catalog image. A per-project override can use different artwork. Existing screenshots are connected for the prior catalog; the owner’s Castle Chess image, project link and model transforms are retained. See [the current stages and configuration](docs/10-interaction-and-loading-plan.md). Older guides record previous defaults. Individual portal opacity overrides are preserved over the shared 0.5 default.

Embedded demos remain fullscreen dialogs outside the contained canvas, with Back, Escape from hub controls, browser Back/Forward, direct external links, source/origin validation and restored focus. External sites may refuse embedding or fail independently.

## About introduction

The About page has a profile photo and its own transparent, lazy avatar canvas on the left of flowing desktop text. An invisible local SVG defines the text-wrap curve; content fills the width below the float and stacks on mobile. A shared timeline synchronizes transient speech bubbles with mouth morphs and blended greeting/talking gestures. A generated breathing idle occasionally blends into an acknowledgement. The full biography stays visible, with pause/resume/replay and follow-up topic controls. The introduction starts automatically after model readiness, with pause/resume/replay available. Skills link to verified showcases and show image/title/summary tooltips on hover or keyboard focus; unsupported examples are hidden, including Astro. This is silent, text-driven lip sync. Products & services does not mount an avatar.

## Validation and limits

`npm test` runs 59 checks covering spatial adjacency, focus framing, synchronized text/mouth playback, background configuration, cube state invariants, catalog identity and visibility, links/previews, filters, route handling, themes/contrast/storage, WebGL capability fallback and iframe message validation. `npm run verify:build` checks the production import graph and a measured 300 kB initial JavaScript budget. The large scene chunk still triggers Vite's bundle-size warning; models can still be expensive on the Project page. No real-device performance or exhaustive external-demo availability claims are made.

See [the original migration record](docs/05-r3f-migration-plan.md), [combined-page plan](docs/06-unified-project-page-plan.md), and [current development stages](docs/10-interaction-and-loading-plan.md) for comparison, decisions, completed checks and follow-up work. Supabase CMS/auth/storage, actual product records, detailed case studies, full TypeScript conversion, and commercial-host review remain future work.


## Readiness and product assets

Product/service files now live in `public/products-and-services/`; the fish preview uses `public/products-and-services/moore_idol/Moore_Idol.glb`. The supplied GIF, thumbnail and service SVGs use the same tree. The underwater HDR remains in `public/environments/`.

A shared DOM/CSS cube loader runs without WebGL, with a solved-to-scrambled-to-solved preset, jump/full turn and bobbing pause. It covers delayed cube/avatar/ribbon readiness, and static startup markup can animate while JavaScript downloads. Individual portal models have their own suspension/error boundaries. Renderer readiness is based on committed frames; recoverable context loss retains the canvas, with bounded automatic remounts and an actionable fallback if recovery fails. Lazy component retries reset the component cache. Decorative loader/cube/ribbon motion honors reduced motion; the ribbon also supports explicit play. About autoplay follows the owner’s explicit preference.
