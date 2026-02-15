import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingAdminStats() {
  return (
    <div className="space-y-8">
      <div className="animate-in">
        <div className="section-line">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3 animate-in delay-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border bg-card p-6"
          >
            <Skeleton className="h-3 w-24 mb-3" />
            <Skeleton className="h-8 w-full" />
          </div>
        ))}
      </div>

      <div className="animate-in delay-2">
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 animate-in delay-3">
        <Skeleton className="h-5 w-48 mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
