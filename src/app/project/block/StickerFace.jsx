
import { FACE_NORMAL, FACE_ROT } from "./constrants";
import Sticker from "../sticker/Sticker";

/**
 * One face of a block.
 *
 * The outer group provides:
 * - Sticker position and orientation
 * - Project identity metadata
 * - Pointer interaction forwarding
 *
 * Project selection and slice gestures are handled by
 * useCubePointerSelection in GridCube.
 */
export default function StickerFace({
  size = 1,
  faceConfig,
  cubieId,
  onActivateSticker,
  frameReady,
  activationEnabled = false,
  activationProjectId = null,
  blockIndex,
  onPointerDown,

  stickerSizeRatio = 0.99,
  stickerDepthRatio = 0.99,
  epsilon = -0.966,
}) {
  const { face } = faceConfig;

  const rot = FACE_ROT[face];
  const n = FACE_NORMAL[face];

  if (!rot || !n) return null;

  const w = size * stickerSizeRatio;
  const h = size * stickerSizeRatio;
  const d = size * stickerDepthRatio;

  // Position slightly outside the rounded block body.
  const offset =
    (0.5 + stickerDepthRatio / 2 + epsilon) * size;

  const pos = [
    n[0] * offset,
    n[1] * offset,
    n[2] * offset,
  ];

  const isProjectPortal =
    faceConfig.type === "portal" && !!faceConfig.id;

  // Preserve the project's original assignment identity.
  const projectMetadata = isProjectPortal
    ? {
        id: faceConfig.id,
        title: faceConfig.title ?? faceConfig.id,
        href: faceConfig.links?.demo ?? null,

        originalBlock: faceConfig.block
          ? [...faceConfig.block]
          : null,

        originalFace: faceConfig.face,
        cubieId,
      }
    : undefined;

  const isCurrentlyFocused =
    isProjectPortal &&
    faceConfig.id === activationProjectId;

  return (
    <group
      name={
        isProjectPortal
          ? `project-sticker-${faceConfig.id}`
          : `sticker-${faceConfig.id}`
      }
      position={pos}
      rotation={rot}
      userData={
        projectMetadata
          ? {
              projectSticker: projectMetadata,
            }
          : undefined
      }
      onPointerDown={(event) => {
        event.stopPropagation();

        document.body.style.cursor = "grabbing";

        onPointerDown?.(event, {
          cubieId,
          gridPosition: blockIndex,
          face,
          project: projectMetadata,
        });
      }}
      onPointerUp={() => {
        document.body.style.cursor = "";
      }}
      onPointerCancel={() => {
        document.body.style.cursor = "";
      }}
    >
      <Sticker
        config={faceConfig}
        dims={[w, h, d]}
        activationEnabled={activationEnabled}
        onActivate={() => {
          const projectUrl = faceConfig.links?.demo;

          if (!activationEnabled || !projectUrl) return;

          onActivateSticker?.(projectUrl, faceConfig);
        }}
        frameReady={frameReady}
      />
    </group>
  );
}
