# Double helix home ribbon

This extends stage 5 in document 11. The supplied CodePen is a motion reference; its speed slider, play button and standalone page styles are not carried over.

1. **Shared geometry and clock.** Translate the reference's sine height / cosine depth into two mirrored 3D strips in one orthographic canvas. Animate a shared wave phase, with model travel reversed for strand B. Use the GPU depth buffer for actual over/under crossings; continuous strip edges avoid internal segment seams.
2. **Distinct content.** Randomize the local model pool once per session, then partition eight objects into two disjoint groups. Keep project and technology labels together, idle bobbing and matching local project links. Wrap outside the viewport so entire model/label pairs enter and leave cleanly.
3. **Integration.** Autoplay only while visible, pause while offscreen/hidden, retain the cube loader and non-WebGL links. Scene labels respect occlusion; equivalent keyboard-accessible links are revealed on focus. Both strips inherit the system theme, darker fills, borders and edge fades. No extra canvas or animation controls.
4. **Validation.** Verify distinct assets, alternating depth, mirrored paths, opposite travel and seamless wrapping in tests; compile and inspect home at desktop and narrow sizes. Retest product inspector and detail/back navigation from document 11.

Status: implemented. Geometry/content regression tests pass; production build verification completed. Desktop/mobile visual verification remains open after computer-use URL detection stopped browser access.


## Next interaction stage

[Document 14](14-ribbon-interaction-and-config.md) implements larger linked models/text cards, full-width label depth clearance, catalog preview tooltips, model transform configuration and smooth hover stop/resume.
