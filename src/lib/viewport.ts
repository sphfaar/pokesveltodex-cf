import type { Attachment } from "svelte/attachments";

export type ViewportHandlers = {
  onenterViewport?: (element: HTMLElement) => void;
  onexitViewport?: (element: HTMLElement) => void;
};

export type ViewportOptions = {
  rootMargin?: string;
  threshold?: number | number[];
};

type ObserverEntry = {
  observer: IntersectionObserver;
  handlers: WeakMap<Element, ViewportHandlers>;
};

const observers = new Map<string, ObserverEntry>();

function observerKey(options: ViewportOptions) {
  const margin = options.rootMargin ?? "0px";
  const threshold = options.threshold ?? 0;
  const thresholdKey = Array.isArray(threshold) ? threshold.join(",") : String(threshold);
  return `${margin}|${thresholdKey}`;
}

function getEntry(options: ViewportOptions) {
  const key = observerKey(options);
  let entry = observers.get(key);
  if (!entry) {
    const handlers = new WeakMap<Element, ViewportHandlers>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const element = entry.target;
          if (!(element instanceof HTMLElement)) continue;
          const callbacks = handlers.get(element);
          if (!callbacks) continue;
          if (entry.isIntersecting) callbacks.onenterViewport?.(element);
          else callbacks.onexitViewport?.(element);
        }
      },
      {
        rootMargin: options.rootMargin ?? "0px",
        threshold: options.threshold ?? 0,
      },
    );
    entry = { observer, handlers };
    observers.set(key, entry);
  }
  return entry;
}

// One observer per rootMargin/threshold pair. Play/pause stays on the tight
// band; the next-page sentinel uses a taller margin.
export function viewport(
  handlers: ViewportHandlers,
  options: ViewportOptions = {},
): Attachment {
  return (element) => {
    if (!(element instanceof HTMLElement)) return;
    const entry = getEntry(options);
    entry.handlers.set(element, handlers);
    entry.observer.observe(element);
    return () => {
      entry.observer.unobserve(element);
      entry.handlers.delete(element);
    };
  };
}
