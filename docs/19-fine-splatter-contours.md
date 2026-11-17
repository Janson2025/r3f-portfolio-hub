# Fine splatter contour tuning

## Comparison and plan

The reference has a dense fringe of short, needle-like tips. The previous implementation has 12 long tips on a 64-point polygon; even single-sample peaks have broad angular bases, producing the large triangular notches visible in the current screenshot.

1. Increase contour sampling adaptively to 80/160/320 points for small/medium/large splats, rather than 64 points for all sizes. Precompute the angular tables and per-drop detail once.
2. Increase tip density to 80 on large outlines (scaled to the smaller resolutions), shorten extensions from 22–48% to 4–18%, and remove neighboring raised shoulders. Interpolate the low-frequency noise instead of jumping between coarse values.
3. Keep fine edge variation visible during growth and soften tip opacity toward the original reference. Compare a representative before/after contour sample and run the existing settling, satellite, population and production checks.

Satellite probability/counts and the established image framing, smear/settling and lifetime settings remain as configured. Total drops, 30 FPS and DPR limits continue to bound work; adaptive contours keep mini drops cheaper than large ones. Actual device performance is not inferred from these limits.

Status: implemented and contour comparison inspected.


A representative before/after geometry sample generated from the real contour functions was inspected: broad triangular points become a denser, shorter fringe. The sample is stored in the shared workspace at `.contour-work/contour-comparison.png`; it is an outline comparison, not a browser screenshot. Regression tests include the reduced angular base, adaptive resolution and retained tip shape. The subsequent edge/hover refinements are recorded in document 20.
