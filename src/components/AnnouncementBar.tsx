"use client";

import { useEffect, useState } from "react";

interface Announcement {
  id: string;
  message: string;
  color: string;
}

// Kontrastabhängige Textfarbe zur Hintergrundfarbe auswählen
function getTextColor(background: string): string {
  const hex = (background || "#6366f1").replace("#", "");
  const full =
    hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
  const num = parseInt(full, 16);
  if (Number.isNaN(num)) return "#ffffff";

  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.6 ? "#111827" : "#ffffff";
}

export function AnnouncementBar() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    let active = true;
    let bc: BroadcastChannel | null = null;

    async function fetchAnnouncements() {
      try {
        const res = await fetch("/api/announcements", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (active) setAnnouncements(data.announcements || []);
        }
      } catch {
        // ignorieren
      }
    }

    const onChanged = () => fetchAnnouncements();

    fetchAnnouncements();
    const interval = setInterval(fetchAnnouncements, 30000);

    // Sofort aktualisieren, wenn Meldungen erstellt/gelöscht werden:
    // - im selben Tab (Custom-Event)
    // - in anderen Tabs desselben Browsers (BroadcastChannel)
    window.addEventListener("tp:announcements-changed", onChanged);
    if (typeof BroadcastChannel !== "undefined") {
      bc = new BroadcastChannel("tp.announcements");
      bc.onmessage = onChanged;
    }

    return () => {
      active = false;
      bc?.close();
      window.removeEventListener("tp:announcements-changed", onChanged);
      clearInterval(interval);
    };
  }, []);

  if (announcements.length === 0) return null;

  return (
    <div className="w-full">
      {announcements.map((a) => (
        <div
          key={a.id}
          className="w-full px-4 py-2 text-center text-sm font-medium"
          style={{ backgroundColor: a.color, color: getTextColor(a.color) }}
        >
          {a.message}
        </div>
      ))}
    </div>
  );
}