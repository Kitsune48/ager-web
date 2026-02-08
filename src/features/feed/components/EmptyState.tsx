export default function EmptyState() {
  return (
    <div className="flex h-48 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
      <div className="text-lg font-medium">No articles yet</div>
      <div className="text-sm">Try following more sources or check back later.</div>
    </div>
  );
}
