import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingAdmin() {
  return (
    <div className="space-y-8">
      <div className="animate-in">
        <div className="section-line">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
        </div>
        <Skeleton className="h-10 w-32 rounded-lg mt-4" />
      </div>

      <div className="animate-in delay-1">
        <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
          <div className="flex gap-3">
            <Skeleton className="h-10 w-32 rounded-lg" />
            <Skeleton className="h-10 w-32 rounded-lg" />
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <Skeleton className="h-10 w-40 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
