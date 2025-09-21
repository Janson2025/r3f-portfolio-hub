// animationsPack.js
export const GESTURE_BASE = "/animations/Gestures-Pack-Basic/";

// Comment any file that misbehaves (e.g., re-export later and re-enable)
export const GESTURE_FILES = [
  "acknowledging.fbx",
  "angry-gesture.fbx",
  "annoyed-head-shake.fbx",
  "being-cocky.fbx",
  "dismissing-gesture.fbx",
  "happy-hand-gesture.fbx",
  "hard-head-nod.fbx",
  "head-nod-yes.fbx",
  "lengthy-head-nod.fbx",
  "look-away-gesture.fbx",
  "relieved-sigh.fbx",
  "sarcastic-head-nod.fbx",
  "shaking-head-no.fbx",
  "thoughtful-head-shake.fbx",
  "Jumping.fbx",
  "Throw.fbx",
  "Falling-Idle.fbx",
  "Robot-Hip-Hop-Dance.fbx",
  "Swing-Dancing.fbx",
];

export const DEFAULT_INITIAL_CLIP = "relieved-sigh";

export const gestureUrls = (files = GESTURE_FILES) =>
  files.map((name) => `${GESTURE_BASE}${name}`);
