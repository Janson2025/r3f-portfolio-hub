# Fine edge feather and continuous hover rain

1. Add a 0.6 CSS-pixel contour feather using a faint, narrow stroke around the same jagged path. This softens the boundary without smoothing away the fine tips or adding full-canvas blur passes.
2. Use a single hover emitter that runs while the pointer stays inside the artwork, including when stationary. Each primary drop randomly chooses a pencil opening (40%) or matching openings through both masks (60%). Paired masks share position, size, contour and short settling motion.
3. As layer occupancy approaches its limit, ease up the internal lifetime/fade clocks. At a full active layer, crossfade an older drop out over 180ms using reserved slots so new hover drops can still enter. Reserved and active slots together stay within the existing 80/64 limits. Satellites take spare capacity and pause under high pressure.
4. Verify the hover distribution, matching paired masks, continuous stationary-pointer emission, crossfade behavior and total caps, then rerun settling/satellite/build checks.

Settings: `contour.edgeFeather`, `hoverDrops.interval`, `hoverDrops.revealBothChance`, and the `pressure` object in `portraitRevealConfig.js`. Density pressure is eased rather than abruptly changing opacity. Life shortening never starts a normal fade before growth completes. Fade progress never runs backwards when pressure drops. Natural-lifetime behavior can be retained by setting `pressure.enabled` to false.

Status: implemented; automated checks passed.


All 92 tests pass. A seeded distribution check confirms the approximate 60/40 selection and exact shared geometry/motion for paired masks. A 40-second stationary hover simulation keeps producing fresh primary drops under pressure while every layer stays within its total count cap, including retiring drops. Replacement crossfades and existing smear/settle behavior pass. Production build/import-budget and whitespace checks pass. No fresh live-browser visual verification was performed for the tiny feather or final density transitions.
