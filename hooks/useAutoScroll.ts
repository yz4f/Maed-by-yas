import { useLayoutEffect, useRef } from 'react';

/**
 * Keeps the dashboard shell scrollable only when its content exceeds the viewport.
 * Updates are batched into one animation frame so message rendering does not cause
 * scrollbar flicker or force the visitor back to the top of the page.
 */
export function useAutoScroll() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let frame = 0;
    const updateScrollBehavior = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const hasOverflow = container.scrollHeight > container.clientHeight + 1;
        const nextOverflow = hasOverflow ? 'auto' : 'hidden';
        if (container.style.overflowY !== nextOverflow) container.style.overflowY = nextOverflow;
      });
    };

    updateScrollBehavior();
    const resizeObserver = new ResizeObserver(updateScrollBehavior);
    resizeObserver.observe(container);

    const mutationObserver = new MutationObserver(updateScrollBehavior);
    mutationObserver.observe(container, { childList: true, subtree: true, characterData: true });

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  return containerRef;
}
