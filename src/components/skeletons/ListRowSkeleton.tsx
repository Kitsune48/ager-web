import { Skeleton } from "@/components/ui/skeleton";

export default function ListRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-md border p-3">
      <Skeleton className="h-10 w-10 rounded-md" />
      <div className="min-w-0 flex-1 space-y-1">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="h-8 w-16" />
    </div>
  );
}
