let intersectionObserver: IntersectionObserver;

function createIntersectionObserver() {
  intersectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        const eventName = entry.isIntersecting ? 'enterViewport' : 'exitViewport';
        entry.target.dispatchEvent(new CustomEvent(eventName));
      });
    });
}

export default function viewport(element: HTMLElement) {
  if (!intersectionObserver) createIntersectionObserver();
  intersectionObserver.observe(element);
  return {
    destroy() {
      intersectionObserver.unobserve(element);
    }
  }
}
