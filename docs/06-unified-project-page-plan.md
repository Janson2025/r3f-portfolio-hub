# Unified Project page plan

Status: implemented with the final requested layout: title/list on the left and contained canvas on the right, with canvas above the list on mobile. See 07-combined-project-workspace.md for the current guide. The design discussion below records the original proposal; final implementation details in 07 take precedence.

## Intended experience

Replace the separate Projects and Explore 3D destinations with one Project page at `#/projects`. The list and Rubik’s cube are two synchronized views of the same published project catalog. Individual case-study URLs remain `#/projects/<slug>`.

Desktop/tablet-wide:

```text
Header: Home / Projects / About / Products & services / Contact
┌──────────────────────────┬──────────────────────────┐
│                          │ Search / filters / count │
│ Contained 3D cube viewer  ├──────────────────────────┤
│                          │ Project list             │
│ Small contextual controls│ Scrollable within panel  │
│                          │ Active project highlighted│
└──────────────────────────┴──────────────────────────┘
```

Mobile/narrow:

```text
Header / compact page controls
┌────────────────────────────────────────────────────┐
│ Contained 3D cube viewer                            │
│ Upper half of available workspace                  │
├────────────────────────────────────────────────────┤
│ Search / filters + scrollable project information   │
│ Lower half of available workspace                  │
└────────────────────────────────────────────────────┘
```

The halves divide the space remaining after the header and compact page controls, rather than using two `50vh` sections and overflowing the screen. Use equal columns on wide layouts and equal rows on narrow layouts. Very short/zoomed layouts may use a minimum readable height and ordinary page scrolling. The footer remains reachable; avoid global body scroll locking.

## What exists and what needs to change

- `ProjectsPage.jsx` provides a separate three-column catalog with URL-backed search/discipline/technology filters. Retain its filtering/data access, but replace the grid with one scrollable list beside the cube.
- `ExplorePage.jsx` owns opt-in scene loading, motion settings and a second project list. Consolidate loading/fallback/motion handling into the combined workspace, then remove this separate page implementation after redirect compatibility is tested.
- `MainView.jsx` mounts both SceneRoot and the old floating SummaryContainer. Remove the duplicated chip/summary UI from the combined page; the list becomes the project summary and action area.
- `SceneRoot.jsx` owns selectedProject privately, emits pubsub selection, and ignores focus requests while transitioning. Its focusId prop is currently an initial-focus mechanism, not a reliable continuously controlled selection API. Replace these ownership boundaries before adding scroll synchronization.
- `CubeRig.jsx` already knows how to align project faces using current world transforms and can calculate directional neighbors. Reuse that math and the existing engine. Its desktop offset and zoom rules were designed around the larger scene and must be replaced with container-based framing. Current focused mode also disables whole-cube manipulation; combined browsing must allow intentional cube navigation without requiring a return-to-cube step for each project.
- `SummaryContainer.jsx` currently follows selection and hover by calling scrollIntoView on chips. This cannot become the two-way list controller: hovering would hijack reading, and programmatic scrolling would feed back into cube selection.
- `overlay.js`, `useOverlayController.js`, routing helpers, and multiple home/detail links currently target `/explore`. Migrate all of them together so iframe Back/Forward and legacy links remain functional.
- The theme store currently restores local overrides. Removing ThemeSwitcher alone would leave some visitors stuck on a saved theme. The runtime must follow the browser preference unconditionally.

## Design and interaction decisions

### One source of selection state

The combined page owns `activeProjectId`, the visible project IDs, and selection metadata such as `source` and a monotonically increasing request ID. The cube and list receive the active ID and report intentional changes through callbacks. Retain pubsub only where needed for older internal cube features; it must not compete with the page controller.

Recommended boundaries:

```text
ProjectsPage
  ├─ ProjectWorkspace (layout, filters, URL and active selection)
  │   ├─ ProjectCubePanel (lazy loading, fallback, local controls)
  │   │   └─ controlled SceneRoot / PortfolioCanvas / CubeRig
  │   └─ ProjectListPanel (scroll region, cards and actions)
  └─ useProjectSelection / useProjectScrollSync
```

Keep the existing catalog and scene adapter. Do not introduce another content source or rewrite the cube engine.

### List → cube

1. Observe only the project-list scroll container.
2. Treat the card nearest a stable reading position in the list as the candidate. Use a center band and a short settling interval so tiny movements do not alternate selection between neighboring cards.
3. Commit a new active ID only when it changes. The cube rotates toward that project’s face while the visitor keeps scrolling normally.
4. Do not snap or scroll the list in response to its own user scrolling.
5. While the reader scrolls rapidly, keep the latest desired target. Retarget from the current rendered cube pose or briefly coalesce requests; do not drop requests behind an `isTransitioning` early return or queue a long animation for every intermediate card.
6. Keep the cube at a useful browsing scale rather than repeatedly running the old dramatic zoom-to-portal transition.

The reading-position calculation must handle different card heights and the first/last card. A requestAnimationFrame-throttled scroll calculation with cached card references is sufficient for the current small catalog; use IntersectionObserver for visibility bookkeeping if useful. Do not add virtualization until the catalog size warrants it.

### Cube → list

- Selecting a cube project or using its directional navigation selects the same ID and scrolls that card into the list’s reading position.
- Scrolling with a wheel/trackpad over the cube steps through the filtered project order. Accumulate wheel deltas into discrete changes; suppress trackpad inertia bursts rather than selecting dozens of projects per gesture. Preserve browser zoom gestures, and do not attach wheel prevention to the whole page.
- Touch users can rotate/select the cube or use accessible previous/next controls. Ordinary vertical gestures in the lower panel scroll the list. Cube gestures stay scoped to the upper viewer.
- After a free rotation or slice manipulation settles, evaluate the current rendered project faces using the existing world-transform lookup. Select the visible project face nearest the viewer’s center, using a facing/visibility check and hysteresis. A plain colored face must not clear the list selection. Do not update on every frame or use hover as a committed selection.
- Free cube dragging should remain possible while a project is active. Distinguish user manipulation from a programmatic focus animation so automatic alignment does not fight the user’s drag.
- Highlight selection without moving keyboard focus. Only explicit keyboard actions move focus.

Wheel stepping is sequential through the filtered list; free rotation is spatial. This gives each gesture predictable behavior while sharing the same selected ID.

### Prevent scroll feedback and settle competing inputs

Selection changes carry their origin (`list-scroll`, `list-click`, `cube-wheel`, `cube-select`, `cube-drag`, `keyboard`, `filter`, `url`). When the cube requests a list scroll, mark that scroll as programmatic and temporarily prevent list observation from emitting a new cube request. Release suppression on scroll completion or a guarded fallback; a real pointer/touch/wheel/keyboard input in the list immediately takes control. Never use a permanent boolean or a fixed timeout as the only completion signal.

The last explicit user interaction takes priority. Do not replay intermediate selections after scrolling stops. Scope animation cancellation and cleanup to request IDs so stale completions cannot overwrite a newer selection. Suspend synchronization while an external demo dialog is open.

### Filters and selection

- Search, category and technology continue to live in the URL.
- A filter change keeps the active project if it is still visible; otherwise selects the first result. No results show an empty state and suspend cube focus requests.
- Retain the physical cube and seeded placement rather than remapping/scrambling it on every search. Dim or make nonmatching portal projects inactive. Cube navigation, scroll stepping and spatial selection operate on the filtered IDs.
- Clearing a filter restores the full eligible set. Never automatically clear filters because a hidden cube project was selected.
- Store the active project using `focus=<id>` and replaceState during browsing, avoiding a new browser-history entry for every wheel tick. Intentional case-study and demo navigation still use normal history entries.

### Contained rendering and responsive camera

- The canvas wrapper owns width and height. Use CSS grid with `minmax(0, 1fr)`, `min-height: 0`, and `min-width: 0` so the list can scroll without stretching the viewer.
- Scope absolute scene overlays to the viewer’s positioned container. Keep the external demo dialog viewport-wide through its existing portal.
- Use the R3F canvas container size/aspect ratio and cube bounds to fit the camera, including resize/orientation changes. Remove the desktop offset based on a full-scene layout. Reserve room for compact controls without centering the cube behind them.
- Put project title, description, technologies and primary demo/detail links in the list. Remove floating chips, the old welcome summary and the second list. Keep cube controls compact and collapsible.
- Load 3D automatically, lazily, when entering the Project page, after the list is usable. This implements the combined experience without a separate Explore or Enable gate. Keep a compact pause/hide-3D control for accessibility and constrained devices. If WebGL fails or is disabled, the same project list remains functional and expands into the available space.
- Respect reduced motion: disable ambient animation and momentum; align selections instantly or with a minimal transition; use instant programmatic list scrolling. Ambient animation stays paused by default.

### Browser-driven appearance

- Remove the visible ThemeSwitcher from Header and its unused component styling.
- Keep the semantic palette registry so colors remain centralized and future palettes can still be added in code.
- Resolve light/dark from `matchMedia('(prefers-color-scheme: dark)')` at initialization and on preference changes. Feed the same resolved theme to CSS and the canvas.
- Stop restoring or writing a manual preference. Safely remove only the old `portfolio-theme` key if desired; never clear all site storage. Update privacy copy and tests to reflect the absence of a stored theme choice.
- Browser color preference is the supported signal. A decorative Chrome toolbar theme does not provide a separate, universally readable website-theme API. Follow the preference reported by the browser/OS, not toolbar color sampling.

Reference: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-color-scheme

## Implementation stages

1. **Selection contract and regression baseline.** Check the current working tree, preserve unrelated edits, and record passing engine/catalog/overlay tests. Introduce the page-level controller and test origin handling, latest-request wins, filtered selection and invalid IDs. Adapt SceneRoot to controlled selection and transition completion/readiness callbacks before wiring scrolling.
2. **Unified responsive shell.** Implement the equal-width/equal-height contained panels, one list with existing filters and direct actions, compact scene controls and lazy automatic scene loading. Remove the floating summary from this view. Fit the camera to the canvas container. Verify wide, narrow, short-height, zoomed and orientation-changing layouts with no unwanted horizontal overflow.
3. **Two-way synchronization.** Implement user list scrolling, cube selection/arrows/wheel, and settled free-rotation selection in that order. Add input-origin and animation cancellation guards, then filtered eligibility. Verify fast scrolling, interrupted scrolling, long cards, endpoints and no-result states.
4. **Routes, overlays and automatic themes.** Remove the Explore navigation item, update home/detail actions, and normalize `/explore` plus legacy `#project/<id>` links into `/projects` while preserving focus/demo parameters. Move iframe routing to the combined page; verify Back/Forward and focus restoration. Remove manual theme behavior, retain palette definitions, and test live browser light/dark changes with old saved settings present.
5. **Cleanup and browser validation.** Remove unused Explore/summary wiring only after compatibility is established. Update build-boundary checks: the normal home/about routes must still exclude the 3D chunk; Project may request it dynamically. Run unit tests and production build, then browser checks for both layouts, real cube/list sync, filters, touch/keyboard alternatives, reduced motion, failure fallback, and overlay navigation. Update docs with measured results and remaining limits.

## Acceptance criteria

- There is one Project destination and no separate Explore navigation entry.
- Wide layout has a contained cube on one half and an independently scrollable list on the other.
- Narrow layout has the viewer in the upper half and readable project information in the lower half of the available workspace.
- Scrolling the list updates cube focus; cube project navigation scrolls/highlights the matching card. Neither direction oscillates, fights user scrolling, or loses the final target after fast input.
- Hover alone does not scroll the list. Programmatic list scrolling does not move keyboard focus or trigger a feedback loop.
- Filtering produces the same eligible selection set in both panels without rearranging physical cube assignments.
- All project/demo links remain available without successful WebGL rendering.
- Existing external overlays, old links, Back/Forward and case-study pages continue to work.
- No theme toggle is shown; prior stored choices cannot override the browser’s current light/dark preference.
- Existing cube-engine tests and updated routing/theme/selection/overlay tests pass, and the production build succeeds.

## Out of scope

No backend/CMS, new project claims, database migration, full framework rewrite, total cube-engine rewrite, or deployment. Do not remove the separate case-study pages. The change combines browsing interfaces rather than discarding project evidence or direct demo access.
