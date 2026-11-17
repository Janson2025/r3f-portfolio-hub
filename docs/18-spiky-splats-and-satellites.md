> Dense, narrower tip sampling is tuned in [stage 19](19-fine-splatter-contours.md). Satellite controls remain available.

# Sharper splats and satellite droplets

The portrait now adds persistent, narrow angular tips to its existing two-scale contour noise. The mask's edge remains more opaque so those tips read as splashed droplets rather than soft circles. Each contour is generated once per birth; it stays stable while the drop smears, grows and fades.

Edit `contour` in `src/features/portrait/portraitRevealConfig.js` to change spike count, minimum/maximum extension, retained sharpness and edge opacity. The default has 12 tips with 22–48% extension and retains 85% of that extension after growth.

The same config's `satellites` section controls the extra mini splats:

- `enabled`: turn satellites on/off.
- `chance`: probability per eligible parent, default `0.4`.
- `threshold`: minimum parent radius, default 40 at the 375px reference size.
- `minCount`/`maxCount`: 2–4 candidate satellites.
- `minScale`/`maxScale`, `minRadius`/`maxRadius`: small size relative to the parent and reference-size bounds.
- `minDistance`/`maxDistance`: adjacent distance from the parent's grown radius.

Satellites use the same mask layer and settling/growth/fade behavior. They cannot create further satellites. Out-of-frame candidates are skipped. Satellite drops count toward the existing 80 drizzle / 64 clustered limit, so maximum rendering work and the 64-point contour budget remain bounded. The clustered placement margin includes the new extended tips.

Validation: tests cover stable sharp tips, retained contours, finite bounds, neighboring mini sizes/positions, no recursive multiplication, enable/probability switches and the shared population cap. Existing uncropped framing and finite smear/settle behavior are retained.

Verification: all 88 tests pass, production build and import-budget guard pass (275.43 kB initial JavaScript). No fresh browser visual verification was performed for this adjustment.
