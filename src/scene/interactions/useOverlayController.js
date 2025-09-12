import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * Controls the project iframe overlay:
 * - visible/ready state
 * - current target URL (per-click)
 * - preconnect on URL change
 * - Esc to close
 * - history (#project/<slug>) so browser Back closes the overlay
 * - sets document.title while open
 */
export default function useOverlayController() {
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);
  const [targetUrl, setTargetUrl] = useState(null);

  const [projectSlug, setProjectSlug] = useState(null);
  const [projectTitle, setProjectTitle] = useState(null);
  const [prevTitle, setPrevTitle] = useState(null);

  const targetOrigin = useMemo(
    () => (targetUrl ? new URL(targetUrl).origin : ""),
    [targetUrl]
  );

  // Helpers
  const deriveSlugFromHref = (href) => {
    try {
      const u = new URL(href);
      const segs = u.pathname.split("/").filter(Boolean);
      if (segs.length) return segs[segs.length - 1].toLowerCase();
      return u.hostname.replace(/\./g, "-").toLowerCase();
    } catch {
      return "project";
    }
  };

  const makeHash = (slug) => `#project/${encodeURIComponent(slug || "project")}`;
  const isProjectHash = (hash) => typeof hash === "string" && hash.startsWith("#project/");

  // Preconnect when URL changes
  useEffect(() => {
    if (!targetOrigin) return;
    const l = document.createElement("link");
    l.rel = "preconnect";
    l.href = targetOrigin;
    document.head.appendChild(l);
    return () => document.head.removeChild(l);
  }, [targetOrigin]);

  // Esc + browser Back close behavior
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && visible && hide();
    const onPop = () => {
      // Only auto-hide if hash is no longer a project hash
      if (visible && !isProjectHash(window.location.hash)) hide(true);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("popstate", onPop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  /**
   * show() accepts either:
   *   show("https://example.com/app")
   * or show({ href, slug?, title? })
   */
  const show = useCallback((hrefOrObj) => {
    const href = typeof hrefOrObj === "string" ? hrefOrObj : hrefOrObj?.href;
    const slug =
      (typeof hrefOrObj === "object" && hrefOrObj?.slug) ||
      deriveSlugFromHref(href);
    const title = (typeof hrefOrObj === "object" && hrefOrObj?.title) || slug;

    setTargetUrl(href);
    setProjectSlug(slug);
    setProjectTitle(title);

    try {
      const hash = makeHash(slug);
      window.history.pushState({ overlay: "project", slug }, "", hash);
    } catch {}

    try {
      setPrevTitle(document.title);
      document.title = `${title} • Hub`;
    } catch {}

    setVisible(true);
  }, []);

  const hide = useCallback((fromPopstate = false) => {
    setVisible(false);
    setReady(false);
    setTargetUrl(null);
    setProjectSlug(null);

    // restore title
    try {
      if (prevTitle) document.title = prevTitle;
    } catch {}

    if (!fromPopstate && isProjectHash(window.location.hash)) {
      try { window.history.back(); } catch {}
    }
  }, [prevTitle]);

  return {
    // state
    visible,
    ready,
    targetUrl,
    targetOrigin,
    projectSlug,
    projectTitle,
    // mutators
    setReady,
    show,
    hide,
    // convenience
    controlsDisabled: visible,
  };
}
