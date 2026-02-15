import { Badge } from "@/components/ui/badge";

const statusMap = {
  HIT: { label: "HIT", variant: "success" },
  STALE: { label: "STALE", variant: "warning" },
  REVALIDATING: { label: "REVALIDANDO", variant: "warning" },
  BYPASS: { label: "BYPASS", variant: "outline" },
  ERROR: { label: "ERRO", variant: "destructive" },
  UNKNOWN: { label: "DESCONHECIDO", variant: "default" },
} as const;

export type CacheStatus = keyof typeof statusMap;

export function CacheBadge({ status }: { status: CacheStatus }) {
  const data = statusMap[status] ?? statusMap.UNKNOWN;

  const dotColors: Record<CacheStatus, string> = {
    HIT: "bg-[color:var(--success)] shadow-[0_0_6px_var(--success)]",
    STALE: "bg-[color:var(--warning)] shadow-[0_0_6px_var(--warning)]",
    REVALIDATING: "bg-[color:var(--warning)] shadow-[0_0_6px_var(--warning)] animate-pulse",
    BYPASS: "bg-[color:var(--muted-foreground)] shadow-[0_0_6px_rgba(123,139,163,0.5)]",
    ERROR: "bg-[color:var(--destructive)] shadow-[0_0_6px_var(--destructive)] animate-pulse",
    UNKNOWN: "bg-[color:var(--muted-foreground)]",
  };

  return (
    <Badge variant={data.variant} className="gap-1.5">
      <span className={`inline-block h-2 w-2 rounded-full ${dotColors[status] ?? dotColors.UNKNOWN}`} />
      {data.label}
    </Badge>
  );
}
