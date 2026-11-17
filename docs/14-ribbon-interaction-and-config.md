# Ribbon sizing, previews and configuration

This extends stage 13. Implemented: larger models and rounded text cards, shared hover slowdown, linked project/product/service previews, and per-model presentation settings. Validation results are recorded below.

## Configuration

Edit `src/features/home/ribbonConfig.js`. This file contains the model pool and global sizing/hover settings; no scene component edits are needed for model placement.

Each model supports:

| Field | Meaning |
| --- | --- |
| `id` | Unique ribbon identifier. |
| `url` | GLB path under `public`, written with a leading slash. |
| `kind` / `contentId` | `project`, `product`, or `service`, and its catalog ID. The tooltip takes its image, title and summary from that catalog. |
| `href` | Destination for both the model and its text card. Project detail hashes, the offerings page and absolute HTTPS links are supported. |
| `technology` | First line of the text card. |
| `position` | `[x, y, z]` offset in scene units relative to its moving ribbon anchor. Defaults to `[0, 0, 0]`. |
| `rotation` | `[x, y, z]` Euler rotation in **degrees**. Defaults to `[6, 20, 0]`; rotations remain independent of the orientation mode. |
| `scale` | Positive size multiplier after normalization, default `1`, capped at `4`. |

For example, add `position: [0, .1, 0], rotation: [0, 45, 5], scale: 1.15` to a model entry. Placement offsets use the selected orientation frame; models are centered and normalized before the offset/rotation/scale group. A negative Z offset deliberately moves a model back towards its ribbon, so use it sparingly if you want the whole model visible.

Global `modelSize` sets normalized model extent (`1.45`, previously `1.05`). `label.width`, `height`, and `offsetX` control the larger text cards. `hover.stopRate` and `resumeRate` control exponential easing; the `stopThreshold` snaps the final crawl to a true stop. Changes are picked up by Vite or the next build. Model selection remains random per page session, split into disjoint strands. Offscreen wrapping margins include configured model extents and the entire label.

## Rendering and interaction

- A label uses the maximum of its own ribbon's depth over its full width, with a small clearance. This prevents a curved ribbon from cutting through a flat label. Model placement also includes a conservative bounding radius. The other strand can still pass in front.
- Models and full rounded text cards share the configured destination. Internal project links open details; the fish goes to Products & services. HTTPS destinations navigate in the same tab.
- Hovering either surface shows a fixed image/title/summary tooltip and eases the one shared animation clock down through a crawl to zero (about half a second). Leaving eases both ribbons, their models and bobbing back to normal speed. Switching between the model and label uses the same interaction behavior.
- Keyboard links provide the same destinations and tooltips, and pause the animation while focused. Escape dismisses previews. Touch taps navigate directly without a sticky hover stop. Blur, scrolling, resizing, leaving the ribbon, hidden tabs and unmounting clear transient state.

## Validation

Automated checks cover full-width depth clearance, opposite-strand occlusion remaining possible, configured transforms and invalid values, metadata/destination resolution, local preview assets, gradual hover stop/resume, tooltip viewport bounds and wrap margins. Existing helix/cube/avatar/product checks and production import-budget verification are also run. Browser visual/input verification is separate from these automated checks; no new browser visual result is claimed without a recorded observation.

Verification: all 73 automated tests pass; production compilation, import/bundle budget (270.49 kB initial JavaScript) and whitespace checks pass.


Browser observations on the local production preview: enlarged rounded cards and models render; a label hover shows the catalog image/title/summary and settles both ribbons to a stop; the stopped positions persist across a later screenshot. Clicking the Spinning Circle Image Revealer card opens its detail route. Hovering the Rubix Cube model shows its own preview and clicking the model opens Simple Rubix Cube details. Back returned to the home ribbon's previous page-scroll position. A screenshot is saved at `.ribbon-work/ribbon-hover-preview.jpg` in the shared plain-portfolio workspace. The user stopped computer use with Escape before the separate product-click and mobile checks; no claim is made that those browser checks passed. Catalog destination resolution, including product and service links, passes automated tests.


## Orientation and gentler easing

`orientation` accepts `fixed` (default), `camera` (follow the camera's orientation), or `path` (align the model's `forwardAxis` with the strand travel tangent). `forwardAxis` is a local direction vector, default `[1,0,0]`. Existing `rotation` in degrees is an additional asset correction after that frame is selected. There are no model-ID branches in the scene.

The fish configuration uses `orientation: 'path', forwardAxis: [0,0,1], rotation: [0,0,0]`. The revealer's local plane is YZ, so it uses `orientation: 'camera', rotation: [0,-90,0]` to put its normal toward the camera. These settings can be changed for any item. Stop/resume easing rates are now `5` / `2.5` instead of `11` / `4`, giving about 1.1 seconds to settle to a full stop and 2.2 seconds to return fully to normal speed. New previews remain hidden until measured placement is available, preventing a visible top-left provisional position.
