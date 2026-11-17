> The static-portrait cause and autoplay fix are resolved in [stage 16](16-portrait-autoplay-and-cultural-api.md). Reduced-motion fallback is now an explicit portrait configuration option, off by default at the owner's request.

# Portrait reveal and ribbon polish

1. **Tooltip first paint.** Keep a new/changed preview invisible until its measured position is ready; remove the visible top-left default. Retain viewport clamping and keyboard previews.
2. **Softer ribbon motion and generic orientation.** Lengthen stop/resume easing. Add reusable `fixed`, `camera`, and `path` orientation modes with a configurable model forward axis and existing degree rotation offsets. Configure the fish to follow its strand's travel tangent and the flat revealer to face the camera. No model-ID rules in rendering code.
3. **Portrait reveal.** Adapt the supplied CodePen into a shared React portrait component and a separately loaded 2D mask controller. Use the existing closeup photo as the base and the local pencil portrait as the cover. A page-colored clustered mask provides organic openings; a second drizzle mask reveals the color photograph. Pointer hover temporarily enlarges all drops and emits frequent falling drops from the pointer. Preserve Browse projects, accessibility and the existing layout.
4. **Lifecycle and performance.** Reuse one animation loop per portrait, cap DPR/drop counts/path resolution, use elapsed time rather than frame count, resize both masks consistently, follow theme changes, pause offscreen/hidden and dispose on route changes. Static photo fallback for failed image/canvas loads or reduced motion. Tune the smaller About portrait using the same normalized geometry.
5. **Verification.** Test cover cropping, bounded droplet lifetimes/counts, edge-safe clustered spawning, pointer origin/falling motion, temporary expansion, generic orientations and slower easing. Run the existing suite/build/import budgets, then visually inspect the portrait and ribbon hover when browser access is available.

Status: implementation complete; automated validation passed; animated browser validation incomplete. The pasted CodePen is a visual/behavior reference; its global styles, external placeholder images, duplicated image loader and unbounded controller loops are not copied into the app.


## Configuration and validation

- `src/features/portrait/portraitRevealConfig.js` controls the pencil image, image crop position, drop radii/lifetimes/rates/count limits, hover expansion, DPR and FPS. The original `profile.image` remains the accessible photo/base layer. No remote placeholder images are requested.
- `src/features/home/ribbonConfig.js` controls generic orientation, degree corrections and softer hover easing. See document 14 for examples.
- All 81 tests pass, including five portrait tests and three new orientation/easing cases. Production compilation and import-budget verification pass (274.00 kB initial JavaScript before the final wrap-margin-only adjustment). Whitespace checks pass.
- The browser showed the static photo fallback in the production preview and no console error was visible when developer tools opened. Animated mask and hover visuals were not verified. Computer use stopped with Escape during inspection, so remaining visual checks (including reduced-motion emulation, first-frame tooltip placement and portrait hover) are explicitly open. Static fallback is intentional when reduced motion is reported or the pencil/canvas cannot initialize; the observed reason was not established.

The renderer uses two bounded 2D mask layers and one loop per portrait at 30 FPS/DPR up to 1.5. It clears previous masks each frame, responds to pointer/focus, suspends on visibility/intersection changes and disposes its frame/resize observer on unmount. Smaller About portraits use the same normalized drop geometry. The original image and Browse projects link are always available if enhancement cannot start.
