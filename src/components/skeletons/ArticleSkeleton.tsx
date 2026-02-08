import { Skeleton } from "@/components/ui/skeleton";

export default function ArticleSkeleton() {
  return (
    <div className="space-y-4 rounded-lg border p-4">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-64 w-full rounded-md" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}
