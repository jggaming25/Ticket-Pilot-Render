"use client";

import { useEffect, useRef } from "react";

export function ForceReloadListener() {
  const sinceRef = useRef(0);

  useEffect(() => {
    async function poll() {
      try {
        const res = await fetch(
          `/api/system/reload-status?since=${sinceRef.current}`,
          { cache: "no-store" }
        );
        if (!res.ok) return;
        const data = await res.json();
        if (data.reload) {
          sinceRef.current = data.tick;
          window.location.reload();
          return;
        }
        if (typeof data.tick === "number") {
          sinceRef.current = data.tick;
        }
      } catch {
        // Server nicht erreichbar - beim nächsten Intervall erneut versuchen
      }
    }

    poll();
    const interval = setInterval(poll, 8000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return null;
}