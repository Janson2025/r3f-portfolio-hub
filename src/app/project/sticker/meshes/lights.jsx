// src/sticker/meshes/lights.jsx

/** Preset: studio key + fill */
function PresetStudioKey({
  ambient = 0.5,
  key = { pos: [2, 3, 2], intensity: 1.1 },
  fill = { pos: [-2, 1.5, -1.5], intensity: 0.5 },
}) {
  return (
    <>
      <ambientLight intensity={ambient} />
      <directionalLight position={key.pos} intensity={key.intensity} />
      <directionalLight position={fill.pos} intensity={fill.intensity} />
    </>
  );
}

/** Preset: edge rim + gentle fill */
function PresetEdgeRim({
  ambient = 0.4,
  rim = { pos: [-3, 2, 3], intensity: 1.4 },
  fill = { pos: [1.2, 1.6, 1.2], intensity: 0.6 },
}) {
  return (
    <>
      <ambientLight intensity={ambient} />
      <directionalLight position={rim.pos} intensity={rim.intensity} />
      <directionalLight position={fill.pos} intensity={fill.intensity} />
    </>
  );
}

/** Preset: none */
function PresetNone() {
  return null;
}

/** Generic ad-hoc lights (ambient + array of dir lights) */
function GenericLights({
  ambient = 0.75,
  dirs = [{ position: [1.2, 1.6, 1.2], intensity: 1.0 }],
}) {
  return (
    <>
      <ambientLight intensity={ambient} />
      {dirs.map((d, i) => (
        <directionalLight key={i} position={d.position} intensity={d.intensity ?? 1.0} />
      ))}
    </>
  );
}

export const LIGHT_PRESETS = {
  studioKey: PresetStudioKey,
  edgeRim: PresetEdgeRim,
  none: PresetNone,
};

/**
 * ResolveLights usage:
 *  - <ResolveLights lights={{ preset: "studioKey", ambient: 0.5 }} />
 *  - <ResolveLights lights={{ ambient: 0.8, dirs: [{ position:[2,2,0], intensity:1.2 }] }} />
 */
export function ResolveLights({ lights }) {
  if (!lights) return <GenericLights />;

  const presetName = lights.preset;
  if (presetName && LIGHT_PRESETS[presetName]) {
    const Preset = LIGHT_PRESETS[presetName];
    const { preset, ...rest } = lights;
    return <Preset {...rest} />;
    // ^ allows tweaking preset params via props (e.g., ambient override)
  }
  return <GenericLights {...lights} />;
}
