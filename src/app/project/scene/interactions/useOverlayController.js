// src/scene/interactions/useOverlayController.js
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import stickerDefaults from "../../sticker/params/stickerDefaults.json";
import pubsub from "../../shared/pubsub"; // ← add this

export default function useOverlayController() {
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);
  const [targetUrl, setTargetUrl] = useState(null);
  const [projectSlug, setProjectSlug] = useState(null);
  const [projectTitle, setProjectTitle] = useState(null);
  const [prevTitle, setPrevTitle] = useState(null);

  const universalEnterDelayMs = useMemo(() => {
    const v = stickerDefaults?.enterDelayMs;
    return Number.isFinite(v) && v >= 0 ? v : 0;
  }, []);

  const enterTimerRef = useRef(null);

  const targetOrigin = useMemo(
    () => (targetUrl ? new URL(targetUrl).origin : ""),
    [targetUrl]
  );

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
  const isProjectHash = (hash) =>
    typeof hash === "string" && hash.startsWith("#project/");

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

  const setPortalClass = (on) => {
    try {
      document.documentElement.classList.toggle("portal-open", !!on);
    } catch {}
  };

  /** show(...) accepts string or { href, slug?, title?, delayMs? } */
  const show = useCallback(
    (hrefOrObj) => {
      if (enterTimerRef.current) {
        clearTimeout(enterTimerRef.current);
        enterTimerRef.current = null;
      }
      const href =
        typeof hrefOrObj === "string" ? hrefOrObj : hrefOrObj?.href;
      const slug =
        (typeof hrefOrObj === "object" && hrefOrObj?.slug) ||
        deriveSlugFromHref(href);
      const title =
        (typeof hrefOrObj === "object" && hrefOrObj?.title) || slug;
      const overrideDelay =
        typeof hrefOrObj === "object" ? hrefOrObj?.delayMs : undefined;
      const delayMs = Number.isFinite(overrideDelay)
        ? overrideDelay
        : universalEnterDelayMs;

      setTargetUrl(href);
      setProjectSlug(slug);
      setProjectTitle(title);

      const goVisible = () => {
        try {
          const hash = makeHash(slug);
          window.history.pushState({ overlay: "project", slug }, "", hash);
        } catch {}
        try {
          setPrevTitle(document.title);
          document.title = `${title} • Hub`;
        } catch {}
        setVisible(true);
        setPortalClass(true);
        pubsub?.emit?.("overlay:change", { visible: true, href, slug, title });
        enterTimerRef.current = null;
      };

      if (delayMs > 0) {
        enterTimerRef.current = setTimeout(goVisible, delayMs);
      } else {
        goVisible();
      }
    },
    [universalEnterDelayMs]
  );

  const hide = useCallback(
    (fromPopstate = false) => {
      if (enterTimerRef.current) {
        clearTimeout(enterTimerRef.current);
        enterTimerRef.current = null;
      }
      setVisible(false);
      setReady(false);
      setTargetUrl(null);
      setProjectSlug(null);
      try {
        if (prevTitle) document.title = prevTitle;
      } catch {}
      setPortalClass(false);
      pubsub?.emit?.("overlay:change", { visible: false });

      if (!fromPopstate && isProjectHash(window.location.hash)) {
        try {
          window.history.back(); // ← keeps Back button behavior intact
        } catch {}
      }
    },
    [prevTitle]
  );

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
