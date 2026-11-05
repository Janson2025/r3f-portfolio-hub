import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import CubeControlPanel from "../grid/controls/CubeControlPanel";
import useOverlayController from "./interactions/useOverlayController";
import ProjectOverlay from "./ProjectOverlay";
import PortfolioCanvas from "./PortfolioCanvas";

import pubsub from "../shared/pubsub.js";
import stickerData from "../sticker/params/stickers.json";

export default function SceneRoot() {
  const {
    visible,
    ready,
    setReady,
    targetUrl,
    targetOrigin,
    show,
    hide,
    controlsDisabled,
  } = useOverlayController();

  const gridRef = useRef(null);
  const cameraControlRef = useRef(null);

  const [selectedProject, setSelectedProject] =
    useState(null);

  const [isTransitioning, setIsTransitioning] =
    useState(false);

  const [projectViewReady, setProjectViewReady] =
    useState(false);

  const isCubeView = selectedProject === null;
  const isProjectView = selectedProject !== null;

  // --------------------------------------------------
  // Project selection
  // --------------------------------------------------

  const handleSelectProject = useCallback(
    (project) => {
      if (
        !project?.id ||
        project.id === selectedProject?.id ||
        visible ||
        controlsDisabled ||
        isTransitioning
      ) {
        return;
      }

      const nextProject = {
        id: project.id,
        title: project.title ?? project.id,
        href: project.href ?? project.links?.demo ?? null,
      };

      setProjectViewReady(false);
      setIsTransitioning(true);
      setSelectedProject(nextProject);

      // Synchronize the summary bubble selection.
      // This works whether selection originated from
      // a cube sticker or a project bubble.
      pubsub?.emit?.("project:selected", {
        id: nextProject.id,
      });
    },
    [
      selectedProject?.id,
      visible,
      controlsDisabled,
      isTransitioning,
    ]
  );

  // --------------------------------------------------
  // Project bubble selection
  // --------------------------------------------------

  useEffect(() => {
    const onProjectFocus = ({ id } = {}) => {
      if (!id) return;

      const project = stickerData.projects.find(
        (item) => item.id === id
      );

      if (!project) {
        console.warn(
          `Project not found in sticker data: ${id}`
        );
        return;
      }

      handleSelectProject(project);
    };

    pubsub?.on?.("project:focus", onProjectFocus);

    return () => {
      pubsub?.off?.("project:focus", onProjectFocus);
    };
  }, [handleSelectProject]);

  // --------------------------------------------------
  // Header view-state synchronization
  // --------------------------------------------------

  useEffect(() => {
    pubsub?.emit?.("view:state", {
      isProjectView,
      projectTitle: selectedProject?.title ?? null,
    });
  }, [
    isProjectView,
    selectedProject?.title,
  ]);

  // --------------------------------------------------
  // Transition completion
  // --------------------------------------------------

  const handleTransitionComplete = useCallback(
    (destination) => {
      setIsTransitioning(false);
      setProjectViewReady(destination === "project");
    },
    []
  );

  // --------------------------------------------------
  // Return to Cube View
  // --------------------------------------------------

  const handleReturnToCube = useCallback(() => {
    if (
      !isProjectView ||
      visible ||
      controlsDisabled ||
      isTransitioning
    ) {
      return;
    }

    setProjectViewReady(false);
    setIsTransitioning(true);
    setSelectedProject(null);
  }, [
    isProjectView,
    visible,
    controlsDisabled,
    isTransitioning,
  ]);

  useEffect(() => {
    const onReturnToCube = () => {
      handleReturnToCube();
    };

    pubsub?.on?.(
      "view:return-to-cube",
      onReturnToCube
    );

    return () => {
      pubsub?.off?.(
        "view:return-to-cube",
        onReturnToCube
      );
    };
  }, [handleReturnToCube]);

  // --------------------------------------------------
  // Selected portal activation
  // --------------------------------------------------

  const handleActivateSticker = useCallback(
    (href, meta) => {
      if (
        !isProjectView ||
        !projectViewReady ||
        isTransitioning
      ) {
        return;
      }

      if (
        !selectedProject ||
        meta?.id !== selectedProject.id
      ) {
        return;
      }

      if (!href || href !== selectedProject.href) {
        return;
      }

      if (visible || controlsDisabled) {
        return;
      }

      show({
        href,
        slug: selectedProject.id,
        title: selectedProject.title,
      });
    },
    [
      isProjectView,
      projectViewReady,
      isTransitioning,
      selectedProject,
      visible,
      controlsDisabled,
      show,
    ]
  );

  // --------------------------------------------------
  // Development logging
  // --------------------------------------------------

  useEffect(() => {
    if (!ready || !gridRef.current) return;

    const projects =
      gridRef.current.getProjectStickers?.() ?? [];

    console.table(
      projects.map((project) => ({
        id: project.id,
        title: project.title,
        cubieId: project.cubieId,
        originalFace: project.originalFace,
        position: project.position
          ?.toArray()
          .map((value) => value.toFixed(2)),
        normal: project.normal
          ?.toArray()
          .map((value) => value.toFixed(2)),
      }))
    );
  }, [ready]);

  // --------------------------------------------------
  // Interaction permissions
  // --------------------------------------------------

  const activationEnabled =
    isProjectView &&
    projectViewReady &&
    !isTransitioning &&
    !!selectedProject?.id &&
    !!selectedProject?.href &&
    !visible &&
    !controlsDisabled;

  const controlsEnabled =
    isCubeView &&
    !isTransitioning &&
    !controlsDisabled;

  // --------------------------------------------------
  // Render
  // --------------------------------------------------

  return (
    <>
      <div className="fixed inset-0 z-0">
        <PortfolioCanvas
          gridRef={gridRef}
          cameraControlRef={cameraControlRef}
          onSelectProject={handleSelectProject}
          onActivateSticker={handleActivateSticker}
          onTransitionComplete={handleTransitionComplete}
          selectedProject={selectedProject}
          isProjectView={isProjectView}
          frameReady={ready}
          controlsEnabled={controlsEnabled}
          activationEnabled={activationEnabled}
          activationProjectId={
            selectedProject?.id ?? null
          }
          onReturnToCube={handleReturnToCube}
          isTransitioning={isTransitioning}
        />

        <CubeControlPanel
          gridRef={gridRef}
          cameraControlRef={cameraControlRef}
        />
      </div>

      {visible && (
        <div className="fixed inset-0 z-40">
          <ProjectOverlay
            targetUrl={targetUrl}
            targetOrigin={targetOrigin}
            visible={visible}
            onReady={() => setReady(true)}
            onBack={hide}
          />
        </div>
      )}
    </>
  );
}