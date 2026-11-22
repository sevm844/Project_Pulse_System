"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

// Makes the page bigger or smaller on screen only (like the zoom of Google Docs). The page itself stays 8.5 inches wide, so the page count and the
// exports never change; the page-break drawing measures the page with this scale taken out (see measure() in pagination.ts).
export default function ZoomBox({ zoom, children }: { zoom: number; children: ReactNode }) {
  const inner = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | null>(null);

  // The scaled page takes the room it really covers, so there is no empty space under a small page and nothing is cut under a big one.
  useLayoutEffect(() => {
    const el = inner.current;
    if (!el) return;

    const update = () => setHeight(el.offsetHeight * zoom);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);

    return () => observer.disconnect();
  }, [zoom]);

  if (zoom === 1) return <>{children}</>;

  return (
    <div style={{ width: 816 * zoom, height: height ?? undefined, margin: "0 auto" }}>
      <div ref={inner} style={{ width: 816, transform: `scale(${zoom})`, transformOrigin: "top left" }}>
        {children}
      </div>
    </div>
  );
}
