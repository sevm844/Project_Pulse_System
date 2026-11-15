"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { PAGE_HEIGHT, GAP } from "./pagination";

// A scrolling area for a paged document. While it scrolls, a small bubble beside the scrollbar says which page is on
// screen ("7 of 70"), like a PDF viewer.
export default function PagedScroll({
  pages,
  className = "",
  padding = 20,
  outerClassName = "",
  children,
}: {
  pages: number;
  className?: string;
  outerClassName?: string;
  // Space between the top of the scrolling area and the first page, so the page number lines up.
  padding?: number;
  children: ReactNode;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [bubble, setBubble] = useState({ page: 1, top: 0, show: false });

  const update = useCallback(() => {
    const el = scroller.current;
    if (!el) return;

    const room = el.scrollHeight - el.clientHeight;
    const fraction = room > 0 ? el.scrollTop / room : 0;
    // The page under the middle of the screen.
    const middle = el.scrollTop + el.clientHeight / 2 - padding;
    const page = Math.min(pages, Math.max(1, Math.floor(middle / (PAGE_HEIGHT + GAP)) + 1));

    setBubble({ page, top: fraction * Math.max(0, el.clientHeight - 34), show: true });
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setBubble((current) => ({ ...current, show: false })), 1400);
  }, [pages, padding]);

  useEffect(
    () => () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    },
    [],
  );

  return (
    <div className={`relative ${outerClassName}`}>
      <div ref={scroller} onScroll={update} className={`overflow-auto ${className}`}>
        {children}
      </div>
      {pages > 1 && (
        <div
          aria-hidden
          style={{ top: bubble.top }}
          className={`pointer-events-none absolute right-5 rounded-lg bg-[#202124] px-3 py-1.5 text-xs font-semibold text-white shadow-lg transition-opacity duration-200 ${
            bubble.show ? "opacity-100" : "opacity-0"
          }`}
        >
          {bubble.page} of {pages}
        </div>
      )}
    </div>
  );
}
