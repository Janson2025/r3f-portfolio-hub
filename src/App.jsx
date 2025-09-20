import { useState } from "react";

import Header from "./app/components/Header.jsx";
import Footer from "./app/components/Footer.jsx";
import MainView from "./app/views/MainView.jsx";

export default function App() {
  const [page, setPage] = useState("projects");

  return (
    <div className="relative grid h-[100dvh] grid-rows-[auto_1fr_auto] overflow-hidden bg-[--color-bg] text-[--color-fg]">
      <header className="relative z-20">
        <Header active={page} onNavigate={setPage} />
      </header>

      <main className="relative z-10 min-h-0">
        {page === "projects" ? <MainView /> : <AboutView />}
      </main>

      <footer className="relative z-20">
        <Footer />
      </footer>
    </div>
  );
}

function AboutView() {
  return (
    <div className="h-full p-4">
      <div className="h-full rounded-xl bg-[--color-bg-elev] shadow-sm p-6 overflow-hidden">
        <h2 className="h-title mb-2">About</h2>
        <p className="text-[--color-muted]">Generic about page placeholder.</p>
      </div>
    </div>
  );
}
