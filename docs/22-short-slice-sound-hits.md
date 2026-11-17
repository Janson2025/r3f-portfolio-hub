# Short slice sound hits

- Randomly choose one source range, 0:04–0:05 or 0:06–0:07, per sound event. Play a short 220ms hit from it rather than chaining the ranges or playing their entire second. `maxDuration` and the source range endpoints remain configurable in `src/features/audio/soundConfig.js`.
- A new movement replaces the existing slide hit with a 15ms handoff. No sound sequence or loop is scheduled. Pending requests during decode collapse to the latest request; mute cancels them.
- Fixed animated turns trigger one hit at movement start. Held drags trigger again after another significant displacement (45 degrees by default), including reversing direction; stationary holds and tiny jitter do not trigger. Fast jumps create one hit, not a queue of hits for every crossed angle.
- Existing mute, visibility, decoding-cache and resource cleanup rules remain. `minGap` caps rapid triggering, and `dragThresholdRadians` tunes what counts as significant movement.

Validation: regression checks cover the two source offsets, shortened durations, replacing an active hit, suppressing queued decode playback, repeated significant held-drag movement, jitter suppression and no catch-up bursts. Listening/real-device timing remains a manual tuning step.

All 102 tests, the production build, import-budget guard and whitespace checks pass. No fresh listening session was performed; clip duration, movement threshold and source timings remain available for fine tuning.
