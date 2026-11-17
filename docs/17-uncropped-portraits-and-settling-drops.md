# Uncropped portrait frames and settling raindrops

1. Replace cover/zoom cropping with a shared frame using the original photograph's 1018:1544 aspect ratio. Contain each entire image inside that frame, preserving proportions and padding the wider pencil source. Both mask canvases match that same frame. Remove image borders/corner clipping; place Browse projects below the artwork.
2. Bring radii, growth, fade speed, lifetimes, clustered spread/margin and normal drop cadence closer to the supplied original. Preserve bounded active counts, 30 FPS and capped DPR. Reduce the original 900-point blob paths to two layers of noise with 64 contour samples.
3. Give raindrops a short, decelerating downward drag with an elastic-looking smear. Stop their position exactly after the configured duration, then finish growing and fade in place. Pointer hover still expands all openings temporarily and emits frequent drops from the pointer.
4. Verify complete image fitting, common frame dimensions, finite settled positions, continued growth after settling, lifetimes/count limits, resizing and controller cleanup. Build and browser-check when available.

Status: implemented; automated checks passed; borderless rendering observed in the browser.

The two source files have different aspect ratios. Matching their frame dimensions with containment preserves both complete images. Filling every pixel with each source would require either cropping or distortion, so the pencil source receives page-colored padding instead.


## Settings and verification

The exact source files remain `/images/closeup-profile.png` (through `profile.image`) and `/images/closeup-profile-pencil.png`. Their pixels are unchanged. The shared artwork frame follows the photograph's original 1018:1544 ratio and both mask canvases use identical CSS/backing dimensions. The photo is contained in CSS; the pencil is contained with the same scale-preserving rule on the middle canvas. Cover cropping, the pencil's old 1.32 zoom and its crop offsets were removed. Browse projects sits below the image, and image borders/rounded-corner clipping are removed on Home and About.

`src/features/portrait/portraitRevealConfig.js` controls the common frame, original-style rates and new `smear` parameters. Radii are 6–60 at the 375px reference size, growth is 12% at a base 0.005px/ms, opacity decays at 0.00012/ms, lifetimes are 2500/8000ms, normal drop cadence is 100ms with up to 600ms interval variation, and clustered spread/margin are 60/24 reference pixels. Hover uses safe 32/55ms minimum intervals rather than the reference's unbounded 1ms request rate. Active drops are capped at 80 drizzle + 64 clustered openings, contours at 64 points with 16 coarse noise samples, rendering at 30 FPS and DPR at 1.5. Offscreen/hidden pausing and cleanup are retained.

New drizzles and pointer-emitted openings ease downward over 650ms, stretching briefly into a smear before returning to rounder blobs. Their positions then stay fixed. Growth lasts through and beyond this motion; fade begins after the original life delay and completed growth. The two jitter scales soften as growth completes. Ambient clustered openings remain stationary, like the reference's clustered reveal layer.

All 85 tests pass. They cover full-source containment, common mask sizes, bounded populations, settled motion, growth/fade order, resizing and animation-loop cleanup. Production compilation/import budget checks pass (275.19 kB initial JavaScript). No real-device frame-rate measurements are claimed.


Browser observation: the updated reveal rendered on Home with the image border removed and the portrait shown in the taller natural-ratio layout. The final pointer-hover smear check could not be completed: computer use was stopped with Escape after a browser activation conflict. Settling/growth/fade order and no-crop drawing are verified by tests; no additional interactive visual result is claimed.


[Stage 18](18-spiky-splats-and-satellites.md) adds sharper contours and optional adjacent satellite droplets while retaining this frame and settling behavior.
