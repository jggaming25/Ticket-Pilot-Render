"use client";

import { useEffect, useRef } from "react";

const STORAGE_KEY = "tp.lastReloadTick";

function readLastReloadTick(): number {
  try {
    const val = Number(window.sessionStorage.getItem(STORAGE_KEY) || 0);
    return Number.isFinite(val) && val > 0 ? val : 0;
  } catch {
    return 0;
  }
}

function writeLastReloadTick(tick: number) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, String(tick));
  } catch {
    // Speicher nicht verfügbar -> Server-TTL verhindert dann trotzdem
    // unbegrenztes Nachladen.
  }
}

// URL mit Cache-Busting-Parameter, damit der Browser die Seite wirklich
// komplett neu lädt. `replace` vermeidet zusätzliche History-Einträge.
function hardReloadUrl(tick: number): string {
  const url = new URL(window.location.href);
  url.searchParams.set("tp", String(tick));
  return url.toString();
}

export function ForceReloadListener() {
  const sinceRef = useRef(0);
  const busyRef = useRef(false);

  useEffect(() => {
    // Nach einem erzwungenen Reload nicht sofort wieder neu laden
    sinceRef.current = readLastReloadTick() || 0;

    async function poll() {
      // Nur sichtbare Tabs prüfen + keine überlappenden Anfragen
      if (document.visibilityState !== "visible" || busyRef.current) return;
      busyRef.current = true;
      try {
        const res = await fetch(
          `/api/system/reload-status?since=${sinceRef.current}`,
          { cache: "no-store" }
        );
        if (!res.ok) return;
        const data = await res.json();
        const tick = Number(data.tick) || 0;

        if (tick > sinceRef.current) {
          // Pro Reload-Befehl genau EIN kompletter Hard-Refresh.
          sinceRef.current = tick;
          writeLastReloadTick(tick);
          window.location.replace(hardReloadUrl(tick));
          return;
        }

        // Nie rückwärts setzen: Stale-Server (verfallener/leerer Tick) dürfen
        // den Stand nicht zurückdrehen, sonst würde der Reload wiederholen.
        sinceRef.current = Math.max(sinceRef.current, tick);
      } catch {
        // Server nicht erreichbar - beim nächsten Intervall erneut versuchen
      } finally {
        busyRef.current = false;
      }
    }

    poll();
    const interval = setInterval(poll, 8000);

    // Nach Tab-Wechsel sofort prüfen statt aufs nächste Intervall zu warten
    const onVisibility = () => {
      if (document.visibilityState === "visible") poll();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return null;
}