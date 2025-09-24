// App.jsx
import { useEffect, useState } from "react";
import Header from "./app/components/Header.jsx";
import Footer from "./app/components/Footer.jsx";
import MainView from "./app/views/MainView.jsx";
import AboutView from "./app/views/AboutView.jsx";  // ← NEW
import pubsub from "./app/project/shared/pubsub.js";

export default function App() {
  const [page, setPage] = useState("projects");
  const [inOverlay, setInOverlay] = useState(false);
  const [inIframe, setInIframe] = useState(false);

  // Detect iframe environment
  useEffect(() => {
    const embedded = (() => {
      try {
        return window.top !== window.self;
      } catch {
        return true;
      }
    })();
    setInIframe(embedded);
    document.documentElement.classList.toggle("in-iframe", embedded);
  }, []);

  // Listen for overlay changes from the controller
  useEffect(() => {
    const onChange = ({ visible }) => setInOverlay(!!visible);
    pubsub?.on?.("overlay:change", onChange);
    return () => pubsub?.off?.("overlay:change", onChange);
  }, []);

  const showShell = !(inOverlay || inIframe);

  return (
    <div
      className={[
        "relative grid h-[100dvh] grid-rows-[auto_1fr_auto] overflow-hidden bg-[--color-bg] text-[--color-fg]",
        inOverlay ? "app--overlay" : "",
      ].join(" ")}
    >
      {/* Header */}
      {showShell && (
        <header className="relative z-20 site-header">
          <Header active={page} onNavigate={setPage} />
        </header>
      )}

      {/* Main */}
      <main className="relative z-10 min-h-0">
        {page === "projects" ? <MainView /> : <AboutView />}
      </main>

      {/* Footer */}
      {showShell && (
        <footer className="relative z-20 site-footer">
          <Footer />
        </footer>
      )}
    </div>
  );
}
