// animationsPack.js
export const GESTURE_BASE = "/animations/Gestures-Pack-Basic/";

// Comment any file that misbehaves (e.g., re-export later and re-enable)
export const GESTURE_FILES = [
  "happy-hand-gesture.fbx",
  "acknowledging.fbx",
  "angry-gesture.fbx",
  "thoughtful-head-shake.fbx",
  "annoyed-head-shake.fbx",
  "Jumping.fbx",
  "being-cocky.fbx",
  "Throw.fbx",
  "dismissing-gesture.fbx",
  "hard-head-nod.fbx",
  "Falling-Idle.fbx",
  "head-nod-yes.fbx",
  "lengthy-head-nod.fbx",
  "look-away-gesture.fbx",
  "relieved-sigh.fbx",
  "sarcastic-head-nod.fbx",
  "shaking-head-no.fbx",
];

export const DEFAULT_INITIAL_CLIP = "relieved-sigh";

export const gestureUrls = (files = GESTURE_FILES) =>
  files.map((name) => `${GESTURE_BASE}${name}`);
