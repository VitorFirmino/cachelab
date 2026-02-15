"use client";

import { useCallback, useEffect, useState } from "react";

import { cacheStats } from "@/service/api-cache";
import { getLastRequest } from "@/service/api-client";

export function CacheIndicator() {
  const [expanded, setExpanded] = useState(false);
  const [stats, setStats] = useState(() => cacheStats());
  const [lastReq, setLastReq] = useState<{ url: string; hit: boolean; durationMs: number } | null>(() => getLastRequest());

  const refresh = useCallback(() => {
    setStats(cacheStats());
    setLastReq(getLastRequest());
  }, []);

  useEffect(() => {
    const interval = setInterval(refresh, 1000);
    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "c" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
        setExpanded((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  if (stats.entries === 0 && !lastReq) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setExpanded((p) => !p)}
        className="flex items-center gap-2 rounded-full border border-[rgba(34,211,238,0.2)] bg-[color:rgba(6,9,15,0.85)] backdrop-blur-xl px-3 py-1.5 text-[10px] font-mono text-muted-foreground shadow-lg transition-all hover:border-[rgba(34,211,238,0.4)]"
      >
        <span className={`inline-block h-1.5 w-1.5 rounded-full ${lastReq?.hit ? "bg-[color:var(--success)] shadow-[0_0_6px_var(--success)]" : "bg-[color:var(--accent-cyan)] shadow-[0_0_6px_var(--accent-cyan)]"}`} />
        Cache: {stats.entries}
        {lastReq && (
          <>
            {" | "}
            <span className={lastReq.hit ? "text-[color:var(--success)]" : "text-accent-cyan"}>
              {lastReq.hit ? "HIT" : "MISS"}
            </span>
            {!lastReq.hit && ` ${lastReq.durationMs}ms`}
          </>
        )}
      </button>

      {expanded && (
        <div className="absolute bottom-full right-0 mb-2 w-64 rounded-xl border border-[rgba(34,211,238,0.15)] bg-[color:rgba(6,9,15,0.95)] backdrop-blur-xl p-4 shadow-xl">
          <div className="text-[10px] uppercase tracking-wider text-accent-cyan mb-3 font-semibold">
            Client Cache Stats
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Entries</span>
              <span className="text-foreground">{stats.entries}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Hits</span>
              <span className="text-[color:var(--success)]">{stats.hits}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Misses</span>
              <span className="text-accent-cyan">{stats.misses}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Hit Rate</span>
              <span className="text-foreground">
                {stats.hits + stats.misses > 0
                  ? `${Math.round((stats.hits / (stats.hits + stats.misses)) * 100)}%`
                  : "—"}
              </span>
            </div>
            {lastReq && (
              <>
                <div className="border-t border-[rgba(255,255,255,0.06)] my-2" />
                <div className="text-muted-foreground truncate" title={lastReq.url}>
                  {lastReq.url}
                </div>
              </>
            )}
          </div>
          <div className="mt-3 text-[9px] text-muted-foreground opacity-60">
            Press C to toggle
          </div>
        </div>
      )}
    </div>
  );
}
