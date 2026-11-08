"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../_lib/api";
import type { ApiProgress } from "../../_lib/progress";

// The progress of every group this user follows. It is a nice-to-have on top of a page, so a failure
// leaves the list empty instead of breaking the page.
export function useProgress() {
  const [items, setItems] = useState<ApiProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    apiFetch<ApiProgress[]>("/progress")
      .then((result) => {
        if (!cancelled) setItems(result);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { items, loading };
}
