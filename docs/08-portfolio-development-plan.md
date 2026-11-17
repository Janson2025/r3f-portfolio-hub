# Portfolio refinement development plan

Next iteration: see [cube modes and avatar conversation](09-cube-modes-and-avatar-conversation.md) for the new planned stages. That plan supersedes conflicting behavior below.

Status: stages 1–6 implemented and validated. This extends the combined-page work in 06/07; newer requirements here take precedence. No deployment is included.

## Requirements retained

One menu: Projects, About, Products & services, Contact. One combined Project page with a contained canvas and vertical list, list/cube selection synchronization, mobile canvas above information, published-only catalog access, independent case studies and direct external demo links. Keep automatic browser light/dark appearance, the existing cube engine/history, reduced-motion support, and local content. No CMS/authentication, invented project outcomes, or checkout.

## New requirements and stages

1. **Portal background readability.** Shrink the background hemispheres and default to 0.5 opacity. A smaller full hemisphere alone still fills the view, so also reduce angular coverage to leave visible sticker-colored space around the image. Keep radius, angular coverage, position and opacity configurable in JSON. Render backgrounds without lighting, with transparency over the existing sticker color; preserve solid-color fallback.
2. **Home presentation.** Replace the right-hand cube/count teaser with the supplied profile photo, retaining Browse projects. Turn Selected work into a horizontally scrollable strip containing the published catalog (featured entries first), with ordinary project links and accessible previous/next scrolling controls. Keep the rest of the home page and normal page scrolling.
3. **Compact, viewport-contained Project page.** Put Projects, selectable discipline categories and the technology dropdown in a compact heading. Remove search input, discipline dropdown, count and extra introductory labels. Ignore retired search query parameters. Add an image/placeholder at the upper left of each project entry with title/summary alongside it. Remove Another perspective, Hide 3D and sequential Previous/Next. Keep the page itself within the viewport, with internal list scrolling; on mobile split the usable workspace evenly. Hide the regular footer on this workspace only. Rendering failures retain the list and a retry message.
4. **Focused cube and spatial arrows.** Restore project zoom/focus with default zoom 0% (18-degree FOV in the existing control scale). Center the selected portal in the actual canvas, fitting it with space for four arrow controls. Keep camera controls consistent with this pose and refocus after resizing or slice changes. Derive arrow destinations by moving along the current physical row/column and across cube edges, skipping empty slots, using the supplied cube-net image as a conceptual reference. Do not hard-code project IDs into the diagram. Filtered-out projects are ineligible. Retarget fast selection requests from the current pose and retain list synchronization. Test adjacency on a complete synthetic 2×2×2 surface, with missing projects and rotated transforms.
5. **About profile and independent avatar.** Add the profile photo and a separate lazy-loaded avatar canvas with its own lights, camera and fading ground disk. Reuse Avatar1.glb and one compatible idle clip rather than fetching the entire gesture pack. The actual model has Ready Player Me/OVR viseme morph targets, so adapt the supplied vowel-cue idea to those targets instead of adding a VRM loader to a non-VRM asset. Use one text timeline and playback clock for typewriter reveal and mouth cues. Include pause/resume/replay/full-text controls; leave a complete accessible biography and a static fallback when WebGL is unavailable. Reduced motion shows the biography immediately and avoids automatic facial/body animation. This is text-driven visual lip sync; no recorded speech, TTS service or microphone is introduced.
6. **Validation and handoff.** Run existing tests plus focused tests for transparency/config validation, physical navigation, focus framing, text timing and mouth targets. Build and verify that cube/avatar code remains outside the normal initial bundle. Browser-check home, horizontal strip, compact filters, focused arrows, internal list scrolling, mobile dimensions, about playback/fallback and route transitions. Save representative screenshots and document the actual results and limitations.

## Implementation boundaries

- Content/profile fields remain in data modules; scene configuration stays in the portal JSON and dedicated avatar settings.
- Use the existing closeup-profile.png. Do not fabricate new project screenshots. Entries without an image keep an explicit visual placeholder.
- Keep current model positions/rotations, project links and user-authored data intact except for requested background settings.
- Speech timing is an approximate text-to-viseme animation, not phonetic alignment to an audio recording. The visible text and mouth movements share the same timeline and stop at the same time.
- Reduced motion and failed asset loading must never prevent reading the About text or accessing projects.
- Existing uncommitted work stays in place; changed files are backed up in the plain workspace's `.refinement-work/original/` directory.

## Baseline evidence

33 tests pass before changes. Avatar1.glb exists locally (about 4.1 MB) and exposes `viseme_aa`, `viseme_E`, `viseme_I`, `viseme_O`, `viseme_U`, consonant visemes and `mouthOpen`. Its Hips/Spine/Head/Arm bone names match the existing relieved-sigh FBX clip. The existing standalone cube-navigation helper is reusable in concept but currently permits diagonal same-face jumps; the updated search will follow physical surface lanes instead.

## Completed validation

- All 44 tests pass, including physical surface adjacency/wraps, empty lanes, whole-cube transforms, desktop/mobile focus centering and arrow margins, background configuration, shared text timing, Unicode, mouth blending and non-mutating idle retargeting.
- Production build and import-boundary check pass. Initial JavaScript is 241.72 kB (74.86 kB gzip), below the 300 kB guard. Avatar and cube remain lazy loaded. The shared GLTF chunk still causes Vite's size warning; real-device performance has not been measured.
- Browser checks at desktop and 390×844 mobile show a centered focused portal with four spatial controls. Directional selection updates the URL and active list entry. Web apps filters to six matching entries. Camera controls report 0% zoom. The document height equals the viewport height on Projects; mobile document width is 390 px without overflow.
- Home contains all 17 published projects in the horizontal strip; its right control advances the strip. Both profile images load from the supplied local portrait.
- About loads the independently framed avatar and idle animation without console errors. Explicit playback under reduced motion reveals text progressively; pause holds the text, resume continues, and Show full text completes it. Automatic reduced-motion mode keeps the complete text visible.
- Screenshots: `refined-home-desktop.jpg`, `refined-projects-desktop.jpg`, `refined-projects-mobile.jpg`, and `refined-about-desktop.jpg` in this directory.

## Configuration and remaining limits

`defaults.portalBackground` in `src/app/project/sticker/params/stickers.json` now uses `radius: 4.5`, `coverage: 0.72` and `opacity: 0.5`. Override these in an individual project's `portal.background` to tune that scene. `opacity` accepts 0–1 and `coverage` accepts 0.2–1. Catalog screenshots remain the inherited background source.

The portrait is `profile.image` in `src/data/profile.js`; the biography there drives both the accessible full text and the visual playback. Vowel/punctuation timing lives in `src/features/about/textTimeline.js`, and GLB morph mappings in `mouthShapes.js`. Lip sync is silent and approximate, driven by text rather than audio. Existing portal model transforms are retained. Castle Chess still needs its project image and demo URL from the owner. WebGL/asset fallback behavior is implemented; a real GPU failure was not forced during browser QA.
