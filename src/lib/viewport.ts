import type { Attachment } from "svelte/attachments";

type ViewportHandlers = {
  onenterViewport?: (element: HTMLElement) => void;
  onexitViewport?: (element: HTMLElement) => void;
};

const handlersByElement = new Map<HTMLElement, ViewportHandlers>();
let intersectionObserver: IntersectionObserver | undefined;

function getObserver() {
  if (!intersectionObserver) {
    intersectionObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const element = entry.target;
        if (!(element instanceof HTMLElement)) continue;
        const handlers = handlersByElement.get(element);
        if (!handlers) continue;
        if (entry.isIntersecting) handlers.onenterViewport?.(element);
        else handlers.onexitViewport?.(element);
      }
    });
  }
  return intersectionObserver;
}

export function viewport(handlers: ViewportHandlers): Attachment {
  return (element) => {
    if (!(element instanceof HTMLElement)) return;
    handlersByElement.set(element, handlers);
    getObserver().observe(element);
    return () => {
      getObserver().unobserve(element);
      handlersByElement.delete(element);
    };
  };
}
