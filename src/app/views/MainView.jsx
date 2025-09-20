// src/app/views/MainView.jsx
import SceneRoot from "../project/scene/SceneRoot.jsx";
import SummaryContainer from "../components/summary/SummaryContainer.jsx";

export default function MainView() {
  return (
    <div className="relative h-full">
      {/* Background Canvas */}
      <SceneRoot />

      {/* Foreground UI */}
      <div className="relative z-10 h-full grid grid-cols-1 lg:grid-cols-[minmax(320px,480px)_1fr] gap-4 p-4 pointer-events-none">
        <SummaryContainer />
      </div>
    </div>
  );
}
