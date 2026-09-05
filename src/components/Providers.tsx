"use client";

import { useEffect } from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { AnnouncementBar } from "./AnnouncementBar";
import { ForceReloadListener } from "./ForceReloadListener";
import { BanGuard } from "./BanGuard";
import { initClickSound } from "@/lib/clickSound";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initClickSound();
  }, []);

  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <AnnouncementBar />
        <ForceReloadListener />
        <BanGuard>{children}</BanGuard>
      </ThemeProvider>
    </SessionProvider>
  );
}