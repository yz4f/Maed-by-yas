'use client';

import { useEffect } from 'react';

function isEditableTarget(target: EventTarget | null): boolean {
  const element = target instanceof HTMLElement ? target : null;
  return Boolean(element?.closest('input, textarea, select, [contenteditable="true"], [data-allow-copy]'));
}

export function CopyProtection() {
  useEffect(() => {
    const blockContextMenu = (event: MouseEvent) => {
      if (!isEditableTarget(event.target)) event.preventDefault();
    };
    const blockSelection = (event: Event) => {
      if (!isEditableTarget(event.target)) event.preventDefault();
    };
    const blockDrag = (event: DragEvent) => {
      if (!isEditableTarget(event.target)) event.preventDefault();
    };
    const blockClipboard = (event: ClipboardEvent) => {
      if (!isEditableTarget(event.target)) event.preventDefault();
    };
    const blockShortcuts = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target) || !(event.ctrlKey || event.metaKey)) return;
      if (['c', 'x', 'a', 'u', 's', 'p'].includes(event.key.toLowerCase())) {
        event.preventDefault();
      }
    };

    document.addEventListener('contextmenu', blockContextMenu);
    document.addEventListener('selectstart', blockSelection);
    document.addEventListener('dragstart', blockDrag);
    document.addEventListener('copy', blockClipboard);
    document.addEventListener('cut', blockClipboard);
    document.addEventListener('keydown', blockShortcuts);
    return () => {
      document.removeEventListener('contextmenu', blockContextMenu);
      document.removeEventListener('selectstart', blockSelection);
      document.removeEventListener('dragstart', blockDrag);
      document.removeEventListener('copy', blockClipboard);
      document.removeEventListener('cut', blockClipboard);
      document.removeEventListener('keydown', blockShortcuts);
    };
  }, []);

  return null;
}
