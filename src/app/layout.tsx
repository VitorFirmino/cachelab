import type { Metadata } from "next";

import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { CacheIndicator } from "@/components/cache-indicator";
import { SonnerToaster } from "@/components/sonner";

export const metadata: Metadata = {
  title: "CacheLab — Mini Store",
  description: "Mini Store de observabilidade de cache com ISR, fetch cache e headers de edge cache.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        <AppShell>{children}</AppShell>
        <CacheIndicator />
        <SonnerToaster />
      </body>
    </html>
  );
}
