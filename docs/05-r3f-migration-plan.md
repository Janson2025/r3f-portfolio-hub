# R3F portfolio integration plan

Status: all five migration stages complete and verified. No deployment is included.

## What the two sites currently do

The plain portfolio uses Next.js App Router, React/TypeScript, server-rendered page composition, local illustrative fixtures, a published-only query boundary, searchable/filterable conventional projects and detail pages, semantic tokens, and a theme registry generating CSS and switcher options. System/light/dark selection survives visits, follows live system changes, and syncs tabs. It has no real CMS, login, products, or interactive cube. Its sample projects are not the owner's actual work and must not replace the hub's records.

The hub uses Vite, React 19 JavaScript, Sass/Tailwind 4, Three.js, R3F and Drei. App state switches between Projects and About without URLs. MainView eagerly mounts the full-screen scene. SceneRoot coordinates cube/project focus, directional navigation and iframe activation through a pubsub bridge. GridCube delegates cube state and undo/redo to a pure engine with 12 passing tests. JSON holds 16 real project records mixed with portal assets, materials and placement. SummaryContainer, SceneRoot and GridCube read those records directly. The project list depends on the scene for activation. The viewport-only body and fixed layers prevent normal document flow. Existing Sass has partially duplicated light/dark palettes but no preference control. HTML retains Vite metadata; footer contains placeholder email/LinkedIn links. Portal messages check origin but not iframe source; overlay timers/classes need cleanup on unmount. CSS reduced motion does not stop WebGL animation.

Baseline: production build passes; initial JS is 1,299.94 kB (370.53 kB gzip). All 12 cube-engine tests pass. Existing uncommitted changes in PortfolioCanvas.jsx, stickers.json and background images belong to the owner; preserve them. The current grid is 2×2×2; several legacy block coordinates are 3×3×3, but seeded assignment intentionally remaps projects. Preserve this engine behavior rather than silently changing cube size.

## Architecture decisions

- Keep Vite and the existing R3F engine. A Next.js rewrite would mix rendering migration with interaction changes. Use conventional hash-addressable pages for compatibility with the current static hosting; document their SEO limitations. Next.js/SSR can be a separate migration later.
- Add a normal scrolling portfolio with Home, Projects, About, Products & Services, Contact and Privacy, plus an explicit Explore in 3D route. Preserve direct project demo access and iframe exploration. Home is the default; the cube is opt-in.
- Keep the hub's JavaScript toolchain. Use JSDoc domain contracts, runtime validation, and focused Node tests at content/security boundaries. A wholesale TypeScript conversion is separate follow-up work.
- Extract public project content into one catalog; keep cube placement/material/model data separate and join by stable ID through an adapter. Both presentations consume published records. Static fixtures are not a security boundary: drafts must not contain secrets, and future CMS authorization requires server checks and RLS.
- Preserve supplied project descriptions, links, screenshots, priorities, and model settings. Do not invent roles, outcomes, completion dates, commercial products or contact addresses. Mark missing case-study evidence as pending rather than fabricate it.
- Port theme behavior, adapting its semantic contract to existing Sass. Include scene-background tokens and keep cube sticker/material identity. New palettes should require one registry entry.
- No database, authentication, marketplace account, external publication, or paid service setup in this migration. Offerings and admin remain honest foundations until configured.

## Stages and exit checks

1. **Baseline and content boundary.** Snapshot owner-modified files locally, extract catalog, introduce published-only queries, safe URL handling and cube adapter, point existing consumers at the adapter. Preserve all 16 IDs, demo links and 3D settings. Exit: catalog/adapter tests, original engine suite and build pass.
2. **Conventional public experience.** Add URL-addressable hash routing with browser Back/Forward, responsive navigation, home, searchable/filterable projects, project details, existing biography/skills, offerings/contact/privacy/404 and a nonfunctional admin notice. Replace placeholders with configured real links only. Exit: every published project has a non-WebGL route and direct demo link; search/filter URLs survive reload.
3. **Extensible themes.** Introduce registry, system/light/dark selector, local preference persistence, live OS/tab updates, semantic surfaces and scene theme subscription. Exit: theme contract, bootstrap, storage and core contrast tests pass; no duplicate competing palette definitions.
4. **Progressive 3D integration.** Lazy-load MainView only from Explore, provide explicit enable/disable and static project alternatives, WebGL/error/loading/context-loss fallback. Keep cube controls, project focus and iframe demos. Scope fixed positioning to Explore. Stop nonessential WebGL motion when reduced motion or user pause applies; shorten user-triggered transitions. Fix keyboard enable dependencies, production logging, overlay URL/history/timer cleanup, URL validation and message-source checks. Exit: normal pages do not import the scene chunk; navigation remains usable after failure or overlay exit; engine tests still pass.
5. **Validation and handoff.** Run complete tests/build; inspect generated chunk split, local routes, light/dark layouts, filters and history, keyboard/mobile and Explore/fallback where browser tools permit. Document remaining content and platform limits. Update this plan with actual outcomes and commands. Exit: changes are reviewable in the target checkout and no deployment has occurred.

## Future work

Owner-reviewed case studies and contact/resume details; real product/licensing records; Supabase migrations, storage, owner allowlist/RLS and policy tests; prerendering or an independently planned Next.js migration for full per-route SEO; measured asset optimization and device coverage. Do not describe the admin notice or published-only local queries as a working protected CMS.


## Completed stage record

1. **Content boundary — complete.** Extracted all 16 existing project records without replacing them with the plain portfolio concepts. Scene settings and published content join by ID. Catalog, visibility, HTTPS link, screenshot existence and engine tests pass. Corrected the supplied `multiplex.hts.png` URL to the actual `multiplex-hts.png` file. Owner-modified scene/model configuration was read before editing and preserved through the adapter; original copies are retained in the plain workspace’s `.migration-work/original/` folder.
2. **Conventional experience — complete.** Added home, projects, project details, About, offerings, contact, privacy, owner-area notice and not-found views. URL filters, Back/Forward and reload preserve browsing state. Existing biography and skills remain. Placeholder email/LinkedIn links are removed; real GitHub and previous portfolio links remain.
3. **Themes — complete.** One registry generates Light/Dark palettes and selector options. System/default, local persistence, blocked storage and tab synchronization are tested. Scene background/shadows and the logo follow the palette; core text pairs meet the tested AA contrast threshold.
4. **Progressive 3D — complete.** The scene loads only after opting in. Retained the existing 2×2×2 cube and engine controls, portal models, focus/arrow navigation and embedded demos. Added loading/error/WebGL/context-loss paths and a permanent text list. Ambient animation is paused by default; reduced motion is live. Focused projects have ordinary case-study and embedded-demo buttons. Overlay routing/history, iframe-source checks, timer-free teardown, inert background and focus restoration are implemented. The renderer uses a capped pixel ratio and local lights instead of a remote environment HDR dependency.
5. **Validation — complete.** `npm test`: 27 passing tests, including all 12 original engine tests. `npm run build`: passes. `npm run verify:build`: passes. `git diff --check`: no whitespace errors (Git reports ordinary LF/CRLF notices). No new runtime dependencies were required.

### Measured production output

- Before: 1,299.94 kB initial JavaScript, 370.53 kB gzip.
- After: 224.25 kB initial JavaScript, 69.10 kB gzip; roughly 83% less initial JavaScript.
- Explore shell: 3.81 kB loaded on navigation to Explore.
- Scene: 1,043.23 kB, 288.58 kB gzip, loaded only after enabling 3D. The existing large-chunk warning remains for this deferred bundle.
- A 300 kB initial-JavaScript budget is checked against the generated production manifest. It is a measured regression guard, not a promise about device performance or total model-download size.

### Browser validation performed

Production preview at localhost:4173; existing user dev server at localhost:5173 was left running. Checked narrow/mobile and 1280px desktop layouts, light/dark switching and saved preference, mobile navigation, combined search/technology filtering, filter reload, browser Back to the filtered index, real project details and retained links, About/offerings/contact/privacy, enabling and disabling the actual rendered cube, project focus, ambient-motion controls under the browser’s reduced-motion setting, embedded character-configurator activation, Back, Escape, Forward reopening the overlay, and restored launch-button focus. Final captured console error list was empty. A dark-theme preview is saved alongside this document.

Unavailable WebGL behavior and blocked-storage cases are covered with focused tests; a physical device and a deliberately lost GPU context were not tested. The external iframe target was observed loading, but all external applications were not audited for uptime, embedding policy or their own accessibility.

### Remaining limits

This is a client-rendered Vite site with hash routing, not the Next.js server-rendered plain portfolio. Per-route HTTP statuses/social metadata and full no-JavaScript content require separate prerendering/framework work. Static catalog visibility is not a security boundary. No working CMS/authentication, private drafts, real product catalog, payment flow, invented roles/metrics, or deployment is included. Existing case studies still need owner-confirmed contribution and outcome details. These are documented follow-ups rather than partially enabled backend features.
