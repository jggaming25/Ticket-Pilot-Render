"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { ForceReloadListener } from "./ForceReloadListener";
import { BanGuard } from "./BanGuard";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <ForceReloadListener />
        <BanGuard>{children}</BanGuard>
      </ThemeProvider>
    </SessionProvider>
  );
}