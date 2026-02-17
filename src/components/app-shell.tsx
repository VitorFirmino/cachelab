import { ReactNode } from "react";

import { NavBar } from "@/components/nav-bar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-background">
      <div className="orb orb-1" aria-hidden="true" />
      <div className="orb orb-2" aria-hidden="true" />
      <div className="orb orb-3" aria-hidden="true" />
      <div className="orb orb-4" aria-hidden="true" />

      <div className="grid-pattern" aria-hidden="true" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <NavBar />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-12 sm:pb-20 pt-10 sm:px-6">
          {children}
        </main>
        <footer className="border-t border-border bg-[rgba(6,9,15,0.6)] py-8 text-center">
          <div className="text-sm font-semibold gradient-text mb-1">CacheLab</div>
          <div className="text-xs text-muted-foreground">
            Observabilidade de cache em m&uacute;ltiplas camadas
          </div>
        </footer>
      </div>
    </div>
  );
}
