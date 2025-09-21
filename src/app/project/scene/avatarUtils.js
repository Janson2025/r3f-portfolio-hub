// avatarUtils.js
import { useEffect, useMemo, useState } from "react";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { SkeletonUtils } from "three-stdlib";

/** Clone the GLB scene and enable cast/receive shadows on meshes. */
export function cloneWithShadows(scene) {
  const clone = SkeletonUtils.clone(scene);
  clone.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return clone;
}

/** "happy-hand-gesture.fbx" -> "happy-hand-gesture" */
export const filenameToClipName = (filename) =>
  filename.replace(/^.*\//, "").replace(/\.fbx$/i, "");

/**
 * Load FBX files and return named THREE.AnimationClip[] (first clip per file),
 * tolerating per-file failures.
 */
export function useFBXClips(urls) {
  const [clips, setClips] = useState([]);

  useEffect(() => {
    let alive = true;
    const loader = new FBXLoader();

    (async () => {
      const results = await Promise.allSettled(urls.map((u) => loader.loadAsync(u)));
      if (!alive) return;

      const usable = [];
      results.forEach((r, i) => {
        if (r.status !== "fulfilled") {
          console.warn("[useFBXClips] Skip (load failed):", urls[i], r.reason);
          return;
        }
        const group = r.value;
        const clip = group?.animations?.[0];
        if (!clip) {
          console.warn("[useFBXClips] Skip (no animation):", urls[i]);
          return;
        }
        const named = clip.clone();
        named.name = filenameToClipName(urls[i]);
        usable.push(named);
      });

      setClips(usable);
    })();

    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(urls)]); // stable enough for URL list changes

  return clips;
}
