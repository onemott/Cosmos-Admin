import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function NotificationSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col space-y-3", className)}>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-start gap-4 p-4 border rounded-lg bg-card text-card-foreground shadow-sm animate-pulse">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      ))}
    </div>
  );
}
