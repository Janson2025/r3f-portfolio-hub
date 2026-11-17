# Portrait, contact, capability links, sound and questions

1. **Portrait layout.** Put Browse projects back over the artwork near its lower edge as a translucent glass link with hover/focus treatment. Match the desktop portrait viewport to the adjacent hero copy, using a mild, predominantly bottom crop; preserve the shared underlying photo/pencil canvas frame. Use a shallower crop and natural sizing on mobile.
2. **Contact.** Add a photo to the right of the title. Turn the email and adjacent copy icon into one keyboard-accessible copy action with success/failure feedback. Add icon links for Facebook, X, TikTok and LinkedIn, using the existing owner profile URLs, opening in new tabs with safe rel attributes.
3. **Capabilities.** Link the three home capability cards to the combined project page with a verified showcase selected: Feedback Library for interfaces, Drug Screening Analysis for software/data, and Character Configurator for 3D.
4. **Recorded cube sounds.** The supplied MP3 is approximately 8.229 seconds. Interpret the requested timeline markers as 0:04–0:06 and 0:06–0:07, stored as 4–6 and 6–7 seconds in a sound config. Fetch/decode only after audio enablement, randomly choose an excerpt per slice movement, apply short edge fades and bound simultaneous voices. Stop effects on mute/hidden/teardown and never play a late decode after mute. Trigger at slice movement start, not after its completion. Keep timings easy to tune.
5. **About question menu.** Replace the horizontal strip/scrollbar with a ? trigger. Hover, click or keyboard focus opens bubble questions beneath it with staggered downward bounce. Leave/outside click/Escape closes with a short bounce-out. Preserve question interruption and biography autoplay. Reserve the menu area in the invisible float shape so the About title/text cannot overlap it, then retain text wrapping lower down. Stack naturally on mobile.
6. **Verification.** Run meaningful copy, audio timing/mute/race, showcase routing and menu/lifecycle checks, existing regressions and production import-budget checks. Inspect responsive layouts and interaction in the browser when available; record visual/audio limits honestly.

Status: implemented; automated validation passed. Local project updates only.


## Validation and settings

All 99 tests pass. Added checks cover native/fallback email copying, verified focused showcase routes, safe social URLs, excerpt offsets/durations, no audio allocation/fetch while muted, one decoded asset reused across moves, stopping active sounds on mute and preventing delayed decode playback after mute. Production compilation and the import-budget guard pass (282.71 kB initial JavaScript).

The portrait's full photo/pencil artwork frame is preserved underneath a viewport: approximately 15% of its lower portion can be cropped on desktop to match the opposite copy height, and mobile uses a 10% lower crop. The glass link overlays the viewport near the bottom. Contact uses the existing owner profile photo and social URLs; no profile URLs were changed.

The question menu has mouse, touch and keyboard paths, retains questions while the closing animation completes, clears timers/listeners on teardown, and reserves space through the updated invisible SVG. Its bounce animation follows the explicit requested behavior.

Audio settings are in `src/features/audio/soundConfig.js`. The recorded slide replaces the synthesized slide tone. The existing synthetic poke/ambient prototypes remain. Default sound is off. Excerpts use 4–6 and 6–7 seconds from the ~8.2-second MP3, with edge fades, two simultaneous slide voices and bounded request delay. Real-device volume/timing and browser layout/menu interaction checks remain separate from the automated checks.


Browser verification could not proceed: computer use stopped because its Windows browser URL check could not confidently identify the active URL. No fresh desktop/mobile layout, question-menu interaction, clipboard UI or audio listening result is claimed. The full automated suite and production build checks passed; the temporary preview server was stopped.


[Stage 22](22-short-slice-sound-hits.md) refines slice audio into single short hits from the revised 4–5 / 6–7 second ranges, with held-drag retriggering and no playback queue.
