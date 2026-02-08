import { Skeleton } from "@/components/ui/skeleton";

export default function FeedCardSkeleton() {
  return (
    <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-4 rounded-lg border p-3">
      <Skeleton className="h-24 w-24 rounded-md" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
    </div>
  );
}
