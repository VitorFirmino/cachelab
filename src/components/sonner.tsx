"use client";

import { Toaster } from "sonner";

export function SonnerToaster() {
  return (
    <Toaster
      richColors
      position="top-right"
      toastOptions={{
        style: {
          background: "rgba(17, 27, 46, 0.9)",
          color: "var(--foreground)",
          border: "1px solid rgba(79, 125, 255, 0.2)",
          backdropFilter: "blur(16px)",
          boxShadow: "0 0 20px rgba(79, 125, 255, 0.1)",
        },
      }}
    />
  );
}
