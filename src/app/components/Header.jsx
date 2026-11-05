import { useEffect, useState } from "react";
import Logo from "./Logo.jsx";
import Nav from "./Nav.jsx";
import pubsub from "../project/shared/pubsub.js";

export default function Header({ active, onNavigate }) {
  const [isProjectView, setIsProjectView] = useState(false);
  const [projectTitle, setProjectTitle] = useState(null);

  useEffect(() => {
    const onViewState = (state = {}) => {
      setIsProjectView(!!state.isProjectView);
      setProjectTitle(state.projectTitle ?? null);
    };

    pubsub?.on?.("view:state", onViewState);
    return () => pubsub?.off?.("view:state", onViewState);
  }, []);

  const viewLabel = isProjectView ? "Project View" : "Cube View";
  const viewTitle = isProjectView
    ? `Return to Cube View${projectTitle ? ` from ${projectTitle}` : ""}`
    : "Select a project to enter Project View";

  return (
    <div className="site-header__inner flex items-center h-14 px-3 sm:px-4 bg-[--bg-elev] shadow-[--shadow-sm]">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <Logo size={28} />

        <span className="h-title truncate">
          James Call
        </span>

        <button
          type="button"
          className="header-view-state"
          disabled={!isProjectView}
          onClick={() => pubsub?.emit?.("view:return-to-cube")}
          aria-label={
            isProjectView
              ? "Return to Cube View"
              : "Current view: Cube View"
          }
          title={viewTitle}
        >
          {viewLabel}
        </button>
      </div>

      <div className="flex-1 min-w-[8px]" />

      <Nav
        active={active}
        onNavigate={onNavigate}
      />
    </div>
  );
}