# Next development stages: cube modes and avatar conversation

Current iteration: [interaction and loading stages](10-interaction-and-loading-plan.md) supersedes conflicting behavior in this historical record.

Status: implemented and validated through stage 12, with stage 11’s product-page avatar/hover behavior superseded by stage 12. This document supersedes conflicting behavior in plan 08. The completed checks in 08 describe the previous version, not completion of these stages. No deployment is included.

Latest layout revision: stage 12 below takes precedence over stage 11's Products & services avatar and hover narration. The avatar now belongs on About only. Preserve owner-authored individual background opacity adjustments; the shared default remains 0.5.

## Retained foundation

Keep the four-link menu, system light/dark themes, home portrait and horizontal project strip, contained Project canvas, vertical thumbnail list, compact category/technology filters, mobile canvas/list split, internal list scrolling, catalog visibility rules, and existing demo/case-study routes. Keep the cube engine and history internals even though their development panel will be unmounted. Preserve local user assets and uncommitted work.

## Current code findings

- `ProjectCubeRig.jsx` already interpolates cube orientation and camera position over 0.6 seconds, but reduced motion changes progress directly to 1. Its look-at target is also updated immediately to the moving sticker. Investigate both before changing the transition: interpolate camera position, orientation/target and cube pose together, rather than fixing only duration.
- The rig currently enables whole-cube dragging, slice interactions and project selection together. It passes `isProjectView={false}` and `activationEnabled={false}`. These permissions must be derived from an explicit mode and transition state.
- `SceneRoot.jsx` always mounts `CubeControlPanel`. Remove that mount for now, including in development; retain its source for future development-only use.
- `PortalScene.jsx` requires `ambientMotion` for playback, while the Project page keeps ambient motion off. The selected portal needs an independent active-project playback rule.
- Background defaults/resolution already support 0.5 opacity and per-project overrides. Audit the complete resolved catalog, not just the default, and verify transparent rendering preserves sticker colors.
- About currently uses a bordered, scene-colored canvas, full-body framing, one looping idle clip and inline typewriter biography. Replace that presentation with a transparent upper-body avatar, timed gesture playback and transient speech bubbles; always render the complete biography below.
- Avatar1.glb uses GLB skeleton/morph targets rather than VRM. Adapt the supplied eye movement concept to actual eye bones/morphs, without introducing a VRM loader. `Waving.fbx`, `acknowledging.fbx`, `happy-hand-gesture.fbx`, and head-nod clips exist locally and are candidates, subject to retargeting checks. The currently referenced `relieved-sigh.fbx` is absent from the present asset inventory: replace that reference with a verified compatible idle/neutral solution before adding more animation dependencies.

## Stage 1 — Define mode state and permissions

Use one authoritative `project | cube` mode at the Project workspace boundary. Start in Project view. Share mode with the canvas, navigation, activation and input handlers; keep selected project ID independent of mode. Track transition activity separately.

| Behavior | Project view | Cube view |
| --- | --- | --- |
| Camera | Centered, zoomed selected portal | Entire cube fits the actual container |
| Top-right button | Cube view + arrow icon | Project view + arrow icon |
| Whole-cube drag | Disabled | Enabled |
| Slice turns, including keyboard/touch | Disabled | Enabled |
| Portal selection | Only current portal can activate | Disabled for every portal |
| Four directional project arrows | Available after focus settles | Hidden |
| List selection | Changes focus with a transition | Updates remembered selection; keeps overview |
| Selected portal animation | Continuously plays its configured animation | No forced preview playback |

While transitioning, block geometry manipulation and portal activation. Keep list selection responsive: a new project request retargets from the current interpolated pose. The mode button can remain disabled until its mode transition finishes. Manual rotation/slice turns in Cube view must not silently change the selected list project. Returning to Project view finds that project's current sticker position after any slice moves.

Acceptance: no development controls appear; the replacement button has the correct destination label/icon; input permissions hold for pointer, touch and keyboard, including events bubbling through portal meshes.

## Stage 2 — Smooth project and mode camera transitions

Create a unified transition controller for project-to-project focus and both mode changes. Store starting and destination camera position, look-at target/orientation and cube orientation. Use time-based easing with a configurable duration (initially around 650 ms). Avoid target snapping and frame-rate-dependent movement. Keep the selected portal centered at rest, preserve the 0% focused zoom baseline, and fit Cube view against the full rotated cube bounds and container aspect ratio.

Preserve the user's Cube view orientation between mode visits when possible. Resize and filtering retarget the appropriate mode pose. Hidden-tab resume must not introduce a large animation delta. A filter with no results must still allow a stable overview and usable empty list.

Respect reduced motion with a short, gentle camera movement and minimal cube rotation rather than the existing hard cut; test that this remains comfortable and does not silently restore the previous instant behavior. Keep durations centralized for future tuning.

Acceptance: list clicks, list scrolling, wheel project browsing and spatial arrows visibly transition in Project view. Cube view does not wheel-step or auto-focus projects. Switching back focuses the current list project even after slice changes. Rapid requests do not queue stale destinations or open a project mid-transition.

## Stage 3 — Portal activation, animation and background defaults

Enable activation only for the currently selected portal, in settled Project view, with no overlay already open. Use the existing project demo-page flow and its direct external link; projects without a demo open their case-study page. This preserves the current demo/case-study distinction. Other stickers cannot activate or select projects. Cube view portal presses must still permit cube manipulation without navigating.

Run the selected project's configured model animation continuously in Project view, independently of hover and the ambient-motion flag. Do not override an explicit animation type of `none` or invent motion for static assets. Stop inactive previews to limit GPU work, suspend while an overlay hides the viewer, and retain a reduced-motion policy for decorative model motion. Verify that authored GLTF clips loop where configured, as well as procedural spin/idle animators.

Use 0.5 as the shared default, preserving the owner’s newer individual adjustments as explicitly confirmed during implementation. Keep optional individual overrides rather than hard-coding material opacity:

```json
{
  "defaults": {
    "portalBackground": { "radius": 4.5, "coverage": 0.72, "opacity": 0.5 }
  },
  "projects": [
    { "id": "existing-project-id", "portal": { "background": { "opacity": 0.5 } } }
  ]
}
```

This is a partial example of the existing `projects` schema; preserve all other fields. Omit the individual opacity to inherit 0.5; a future value such as 0.35 changes only that background. Keep 0 valid, clamp invalid ranges, preserve unlit alpha blending and solid sticker-color fallback.

Acceptance: unspecified opacities inherit 0.5; owner-authored overrides remain effective, and changing a single override affects only its hemisphere. A current-portal click opens exactly once, and no activation is possible in Cube view or during transitions.

## Stage 4 — Transparent About canvas and upper-body framing

Remove the avatar container border, colored background and panel-like styling. Use an alpha-transparent WebGL canvas with no scene background color, so the page's light/dark background shows through directly. Remove the floor disk from this close-up composition. Retain the separate profile image and existing About content.

Frame face and upper torso from model bounds/eye height, with responsive headroom for waving and adjacent bubbles. Check narrow screens so the head, shoulders and important hand gestures are not clipped. Keep loading/error presentation readable on the page background and leave the complete biography visible during asset loading/failure.

Acceptance: no rectangle or border is visible around the avatar in either theme; face and upper torso remain legible on desktop/mobile.

## Stage 5 — Greeting, talking gestures and natural gaze

Build a small animation manifest and playback state machine: neutral idle → brief crossfade into one greeting wave on page entry → talking gesture sequence during narration → idle when complete. Use roughly 200–350 ms blends, tuned after visual checks. Wave once per About mount, not on every React rerender or pause/resume. Replay restarts the narration/gesture sequence deliberately.

Audit FBX skeletons, axes, scale and root-motion tracks; generalize the existing non-mutating retarget helper. Select only a few compatible local gestures (initial candidates: acknowledging, happy-hand-gesture and a gentle head nod), avoiding large or repetitive head movements. Treat these as speech gestures only after viewing them; filenames alone do not prove suitability. Use a verified neutral clip or stable relaxed pose if no proper idle clip is available. Lazy-load only the chosen clips, and fall back to idle if an optional clip fails.

Crossfade gestures into/out of idle. Keep lips driven by the shared narration clock, with facial/eye tracks excluded or layered so body clips cannot overwrite mouth/gaze updates. Pause narration-driven gestures with playback; keep a calm neutral expression when paused or complete.

Adapt natural eye movement to the actual GLB rig. Prefer a camera-directed gaze with small occasional eased deviations and gentle blinks, returning toward the camera between deviations. Account for animated head/world transforms and eye rest rotations; clamp offsets to avoid cross-eyed/extreme gaze. Use cached bone references and reusable vectors/quaternions in the frame loop. Restore rest gaze on teardown/disable. Reduced motion uses a calm static pose and full text by default, retaining explicit opt-in playback.

Acceptance: greeting runs once, several restrained talking gestures blend without T-poses/root jumps, mouth cues remain synchronized, eyes mostly address the camera, and replay/pause/route changes clean up actions and timers.

## Stage 6 — Speech bubbles with permanent biography below

Replace inline typewriter biography with a permanently visible complete About text below the avatar experience. Segment the same biography into short sentence/phrase bubbles; preserve a single narration clock for lip cues, reveal timing, gesture scheduling and bubble lifetime. This remains silent, text-driven speech animation; audio/TTS is a separate future requirement.

Bubbles fill progressively above and beside the avatar, remain briefly after filling (initially about 2 seconds), fade (about 400 ms), then unmount. Use at most 2–3 visible bubbles, stable left/right slots, and sufficient contrast in each theme. Avoid the face and important gestures. On mobile place bubbles in reserved space above/beside the torso without horizontal overflow; do not obscure navigation or the permanent biography. Reserve layout space to prevent text-driven page jumps.

Pause freezes text reveal, hold timers and fading; resume continues from the same clock. Replay clears old bubbles and starts from the beginning. Completion lets the final bubble finish its hold/fade; route exit clears everything. Reduced motion shows the complete biography without automatic bubbles or gestures; user-initiated playback can opt in. Keep bubble text decorative to assistive technology since the complete accessible biography is already present. Retain accessible pause/resume/replay controls; retire the now-redundant Show full text button.

Acceptance: text fills bubbles in narration order, bubbles fade and are removed with bounded DOM count, full biography is always readable, and pause/resume/replay work without stale bubbles.

## Stage 7 — Regression checks and handoff

Add focused tests for mode permissions, transition retargeting/final framing, selected-only activation, background inheritance/overrides, animation state sequencing, gaze bounds/restoration, and shared-clock bubble timing/cleanup. Retain cube invariants, physical arrow adjacency, catalog/routing/overlay/theme checks. Run the existing test suite, production build and initial-bundle boundary guard; keep avatar and cube lazy loaded.

Browser-check desktop and mobile: actual intermediate transition frames; all four directional moves; mode switches after slice turns; blocked Project-view drags/shortcuts; nonselectable Cube-view portals; current-only demo activation; animation loop; opacity/color readability; both themes; transparent torso framing; greeting/talking/gaze; bubble lifecycle; reduced motion; loading/failure behavior and navigation away/back. Save representative screenshots and record checks actually performed. Do not carry forward plan 08's 44-test result as evidence for new behavior.

## Execution order and scope

Implement the catalog addition first, stages 1–3 as the cube milestone, stages 4–6 as the About milestone, then product/services and contextual narration. Finish regression checks across all milestones.

## Stage 8 — Simple Rubix Cube project

Add one published catalog entry pointing to `https://janson2025.github.io/simpleRubixCube/`, with `rubix_cube.glb` as its portal model and a stable new ID/slug. Retain all existing projects, add a stable cube assignment, and use a clearly drawn cube placeholder where no screenshot was supplied. Validate the project link and asset resolution in the list, home strip, case study and cube.

## Stage 9 — First product and local media

Create `public/images/products-and-services/moore_idol/`, copy the supplied GIF and thumbnail unchanged, and copy the supplied underwater HDR to a local environment-assets directory. Add one Moore Idol fish product with the exact Gumroad destination `https://jamescall7.gumroad.com/l/Moore_Idol`. Do not invent pricing, licensing, reviews or downloadable formats beyond the supplied preview model.

Use Moore_Idol.glb in a lazy, small product-card canvas with orbit controls, HDR background/environment, ambient and directional lighting. Fit the fish from its bounds; limit DPR and pause offscreen rendering/animation. The supplied model has no animation clip: use a restrained procedural swim motion and label it as a preview, retaining the supplied animated GIF as a separate media option. Keep thumbnail fallback on loading/error/reduced motion, with an explicit option to enable 3D. Buying remains a normal outbound Gumroad link, separate from canvas interactions.

## Stage 10 — Service cards and accessible detail dialogs

Add Web development, Interface design, and 3D & interaction service cards with locally authored SVG placeholder artwork. Each opens an in-page details dialog with description, example scope, and a Contact action; do not invent fixed prices or guaranteed availability. Support Escape, backdrop close, keyboard focus trapping/restoration, mobile layout and body scroll locking. Cards do not navigate to external websites.

## Stage 11 — Contextual avatar conversation

Use a shared configurable introduction component on About and Products & services, loading avatar code only on those routes. Keep the expression neutral-to-happy with subtle smile blending and no sad/angry expression clips. After the main biography ends, retain a few topic chips beside the avatar; each starts an additional explanation using the same lips/gestures/bubbles clock.

Product/service hover or keyboard focus starts its concise factual explanation after a small intent delay, crossfading from the current gesture/narration without competing timers. Add a visible Explain button for touch/click. Deduplicate repeated hover/focus, clear pending requests on route exit, do not restart the main biography on pointer leave, and let explicit topic selection take priority. Keep all descriptions readable without animation and narration silent/text-driven. Reduced motion never auto-starts narration from hover; explicit playback remains available.

Extend stage 7 with catalog identity/asset checks for 18 projects, product media/HDR resolution, safe Gumroad destination, service-dialog keyboard behavior, bounded narration interruption/bubbles and optional-scene fallback checks. Record which browser checks were actually run.

## Stage 12 — About text wrapping, contact and living idle

Place the avatar to the right of the About me title, biography and following content on desktop. Float its contained canvas and use an invisible local SVG alpha shape with CSS `shape-outside` to define the curved text boundary. Keep readable line lengths; once the text passes the float's height, let subsequent content fill the available width. The SVG is only a layout guide, never a visible decoration. Reduce empty canvas headroom and preserve upper-torso/face framing. Stack the avatar and text cleanly on mobile, with no shape wrapping.

Remove the avatar canvas, contextual hover narration, and its empty layout column from Products & services. Keep product previews, GIF/image options, outbound Gumroad link and service detail dialogs. This supersedes stage 11's shared route avatar requirement; About topic explanations remain.

Add `jamescall2012@gmail.com` to the centralized profile/contact data and expose a working mailto link on Contact. Keep it a user-initiated link rather than sending email.

When no greeting, narration or explicit topic action is active, loop a calm breathing idle, occasionally crossfading into a restrained secondary gesture and back. Reuse a suitable supplied idle clip if present; otherwise create a small neutral-pose breathing clip without root motion. Do not repeat the greeting automatically during idle. Keep a neutral/happy face and camera-directed natural gaze. Reduce canvas top padding and re-place speech bubbles beside the avatar so they do not require a large blank region overhead. Preserve reduced-motion behavior, pause/resume and cleanup.

Validation: desktop text follows the SVG curve and fills the width below the float; mobile has no overflow; Products & services mounts only its product canvas; Contact exposes the exact mailto link; idle/secondary/greeting/talking states do not fight for animation control; the complete biography and service/product descriptions remain readable without 3D.


## Completion record

- Cube modes implemented: no development panel, labeled mode switch, interpolated camera/cube/target poses, locked Project view, manipulable Cube view, selected-only activation, spatial arrows, remembered list selection and active-portal animation. Embedded GLTF clips and procedural portal animation use the same selected-project permission.
- Simple Rubix Cube is published as project 18 with the supplied URL/model and a labeled illustrative placeholder. Its live page opened successfully in the existing demo overlay during browser testing.
- Product media is in `public/images/products-and-services/moore_idol/`; HDR is `public/environments/underwater-2k.hdr`. The fish has an orbitable lit HDR scene, accessible left/right rotation buttons, motion pause, supplied GIF, thumbnail and exact Gumroad link. Three service cards use local SVG artwork and native modal detail dialogs with explicit focus wrapping, Escape and focus restoration.
- About uses a transparent upper-body canvas alongside full readable biography and subsequent content. The invisible curve is `public/images/avatar-wrap.svg`; the desktop float ends after 600 px and text then fills the available width. Mobile disables shape wrapping and stacks the content. Products & services mounts no avatar.
- Avatar playback combines a single greeting, restrained talking gestures, neutral/happy facial morphs, camera-directed gaze/blinks, a generated six-second breathing idle and an occasional acknowledgement crossfade. Camera framing briefly widens for the greeting hand, then eases back in. Speech bubbles fill, hold and fade on the narration clock; topic chips appear once, and the complete biography stays readable. All narration is silent and text-driven.
- Contact exposes `mailto:jamescall2012@gmail.com`. Owner portrait selection, Castle Chess image/link and model-transform edits were preserved. Background default is 0.5; individually adjusted values are preserved per the owner’s explicit confirmation.

### Validation evidence

All **52 tests pass**. Production build and `verify:build` pass with **252.39 kB initial JavaScript** (78.11 kB gzip), below the 300 kB guard. Cube, avatar and product renderer remain dynamic chunks. The shared GLTF chunk still triggers Vite’s size warning.

Browser checks covered desktop and 390×844 mobile: cube overview/project switching, whole-cube and slice gestures, remembered list selection, new-project focus, project-view drag blocking, focused-portal demo opening/back, nonselectable Cube view portals, viewport-contained Projects (390×844 document), transparent About canvas, curved wrap, mobile no-wrap/no-overflow, greeting hand framing, mouth/bubble progression, pause stability, follow-up topic, supplied GIF, HDR fish render/orbit, keyboard fish rotation, service-dialog focus wrapping/Escape/restoration and exact email/Gumroad links. Final route transitions produced no new warning/error logs. Products & services showed one product canvas and zero avatar canvases.

Screenshots in this directory: `cube-modes-project.jpg`, `cube-modes-mobile.jpg`, `about-curved-wrap-desktop.jpg`, `offerings-fish-desktop.jpg`, `offerings-fish-mobile.jpg`, and `services-cards-desktop.jpg`.

### Practical limits

The model includes no embedded fish animation, so its 3D swim preview is procedural; the supplied GIF remains unchanged. No suitable standing-idle clip was present, so the avatar breathing idle is generated from a neutral pose. Reduced-motion mode uses static text/pose by default and explicit playback/3D controls. Browser QA used the browser’s reported dark/reduced-motion preferences plus explicit playback; palette contrast and theme behavior are covered by tests, but no claim of real-device performance or forced GPU-failure testing is made. Optional animation-load failure currently falls back to readable content rather than guaranteeing a partial gesture set. No audio/TTS, checkout, deployment, purchases or email sending was added.
