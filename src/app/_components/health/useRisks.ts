"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../_lib/api";
import type { ApiRisk } from "../../_lib/health";

// The groups that need attention. A nice-to-have on top of a page, so a failure leaves the list empty.
export function useRisks(enabled = true) {
  const [items, setItems] = useState<ApiRisk[]>([]);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    apiFetch<ApiRisk[]>("/risks")
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
  }, [enabled]);

  return { items, loading };
}
