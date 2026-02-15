import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingProduct() {
  return (
    <div className="space-y-8">
      <div className="animate-in">
        <Skeleton className="h-4 w-40" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5 animate-in delay-1">
        <div className="lg:col-span-2">
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>

        <div className="lg:col-span-3 space-y-5">
          <div className="space-y-2">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-9 w-3/4" />
          </div>

          <Skeleton className="h-24 w-full rounded-2xl" />

          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 animate-in delay-3">
        <Skeleton className="h-5 w-48 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-4 w-4 rounded-full shrink-0 mt-1" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
