// src/app/project/shared/pubsub.js

/**
 * Tiny event pub/sub with HMR-safe singleton behavior.
 * 
 * Usage:
 *   import pubsub from "./pubsub";
 *   const sub = pubsub.on("project:hover", ({ id }) => { ... });
 *   // later
 *   sub.off(); // unsubscribe
 * 
 *   pubsub.emit("project:focus", { id: "rubiks-portal" });
 *   pubsub.once("overlay:open", () => console.log("opened"));
 */

const GLOBAL_KEY = "__R3F_PORTFOLIO_HUB_PUBSUB__";
const g = (typeof window !== "undefined" ? window : globalThis);

/** Create a new emitter instance. */
function createEmitter() {
  /** @type {Map<string, Set<Function>>} */
  const listeners = new Map();

  const ensure = (event) => {
    if (!listeners.has(event)) listeners.set(event, new Set());
    return listeners.get(event);
  };

  return {
    /**
     * Subscribe to an event.
     * @param {string} event 
     * @param {(detail:any)=>void} handler
     * @returns {{ off: () => void, event: string, handler: Function }}
     */
    on(event, handler) {
      const set = ensure(event);
      set.add(handler);
      return {
        event,
        handler,
        off() {
          const s = listeners.get(event);
          if (s) s.delete(handler);
        }
      };
    },

    /**
     * Subscribe once, auto-unsubscribe after first emit.
     * @param {string} event
     * @param {(detail:any)=>void} handler
     * @returns {{ off: () => void, event: string, handler: Function }}
     */
    once(event, handler) {
      const wrapper = (detail) => {
        try { handler(detail); }
        finally { sub.off(); }
      };
      const sub = this.on(event, wrapper);
      return sub;
    },

    /**
     * Unsubscribe a specific handler.
     * @param {string} event
     * @param {(detail:any)=>void} handler
     */
    off(event, handler) {
      const set = listeners.get(event);
      if (set) set.delete(handler);
    },

    /**
     * Emit an event with a payload.
     * @param {string} event
     * @param {any} detail
     * @returns {number} number of listeners invoked
     */
    emit(event, detail) {
      const set = listeners.get(event);
      if (!set || set.size === 0) return 0;
      // copy to array to avoid issues if handlers unsubscribe during emit
      const list = Array.from(set);
      let count = 0;
      for (const fn of list) {
        try { fn(detail); count++; }
        catch (err) {
          // Don't break other listeners; surface the error for debugging.
          // eslint-disable-next-line no-console
          console.error(`[pubsub] listener for "${event}" threw:`, err);
        }
      }
      return count;
    },

    /**
     * Remove all listeners for an event (or all events if omitted).
     * @param {string} [event]
     */
    clear(event) {
      if (typeof event === "string") {
        listeners.delete(event);
      } else {
        listeners.clear();
      }
    },

    /**
     * Count listeners for an event.
     * @param {string} event
     * @returns {number}
     */
    listenerCount(event) {
      return listeners.get(event)?.size ?? 0;
    },

    /** Expose for debugging if needed. */
    _listeners: listeners,
  };
}

// HMR-safe singleton: reuse existing instance across hot reloads
if (!g[GLOBAL_KEY]) {
  g[GLOBAL_KEY] = createEmitter();
}

/** @type {ReturnType<typeof createEmitter>} */
const pubsub = g[GLOBAL_KEY];

export default pubsub;
