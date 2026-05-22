"use client";

import { useEffect } from "react";

type VendorKeyboardOptions = {
  onToggleSidebar: () => void;
  onFocusSearch: () => void;
};

export function useVendorKeyboardShortcuts({
  onToggleSidebar,
  onFocusSearch,
}: VendorKeyboardOptions) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      const editable =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target?.isContentEditable;

      const mod = event.metaKey || event.ctrlKey;

      if (mod && event.key.toLowerCase() === "b") {
        event.preventDefault();
        onToggleSidebar();
        return;
      }

      if (mod && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onFocusSearch();
        return;
      }

      if (editable) return;

      if (event.key === "/") {
        event.preventDefault();
        onFocusSearch();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onToggleSidebar, onFocusSearch]);
}
