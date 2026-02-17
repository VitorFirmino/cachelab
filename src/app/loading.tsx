import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingHome() {
  return (
    <div className="flex flex-col gap-14">
      <section className="animate-in py-6">
        <div className="max-w-3xl space-y-4">
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-5 w-80" />
        </div>
      </section>

      <section className="animate-in delay-2">
        <Skeleton className="h-7 w-56 mb-6" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`rounded-2xl border border-border bg-card overflow-hidden animate-in delay-${Math.min(i + 2, 8)}`}
            >
              <Skeleton className="h-32 w-full rounded-none" />
              <div className="p-5 space-y-3">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-7 w-28" />
                <Skeleton className="h-1 w-full" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="animate-in delay-3">
        <Skeleton className="h-28 w-full rounded-2xl" />
      </section>
    </div>
  );
}
