"use client";

import { useEffect, useState } from "react";

interface Announcement {
  id: string;
  message: string;
  color: string;
}

export function AnnouncementBar() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    let active = true;

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

    fetchAnnouncements();
    const interval = setInterval(fetchAnnouncements, 30000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  if (announcements.length === 0) return null;

  return (
    <div className="w-full">
      {announcements.map((a) => (
        <div
          key={a.id}
          className="w-full px-4 py-2 text-center text-sm font-medium text-white"
          style={{ backgroundColor: a.color }}
        >
          {a.message}
        </div>
      ))}
    </div>
  );
}