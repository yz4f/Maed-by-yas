/**
 * useAutoScroll.ts
 * 
 * A custom React hook that dynamically detects if content overflows the container's height
 * and automatically toggles between scrollable (overflow-y: auto) and non-scrollable (overflow-y: hidden) states.
 * It uses a ResizeObserver to monitor the container and its children, preventing layout shift or scrollbar flickering.
 */

import { useLayoutEffect, useRef } from 'react';

export function useAutoScroll() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateScrollBehavior = () => {
      // Compare scrollHeight (full content height) with clientHeight (viewport/visible container height)
      const hasOverflow = container.scrollHeight > container.clientHeight;
      
      if (hasOverflow) {
        container.style.overflowY = 'auto';
      } else {
        container.style.overflowY = 'hidden';
        container.scrollTop = 0; // Reset scroll position to top
      }
    };

    // Run initial calculation before paint
    updateScrollBehavior();

    // Setup ResizeObserver to detect dimensional changes of the container and its children
    const resizeObserver = new ResizeObserver(() => {
      updateScrollBehavior();
    });

    resizeObserver.observe(container);

    // Observe all initial direct children to catch content expansion (e.g. accordion, content load)
    const observeChildren = () => {
      Array.from(container.children).forEach((child) => {
        resizeObserver.observe(child);
      });
    };
    observeChildren();

    // Setup MutationObserver to watch for DOM updates (addition/deletion of nodes)
    const mutationObserver = new MutationObserver((mutations) => {
      updateScrollBehavior();
      // Ensure newly added children are also observed for resizing
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          observeChildren();
        }
      });
    });

    mutationObserver.observe(container, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    // Cleanup observers on unmount
    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  return containerRef;
}
