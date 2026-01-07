"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function EditorSkeleton() {
  return (
    <Card className="h-full w-full flex flex-col p-4 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 w-20" />
      </div>
      <Skeleton className="flex-1 w-full" />
    </Card>
  );
}

export function OutputSkeleton() {
  return (
    <Card className="h-full w-full flex flex-col p-4 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-8 w-24" />
      </div>
      <Skeleton className="flex-1 w-full" />
    </Card>
  );
}

export function SidebarSkeleton() {
  return (
    <div className="w-80 border-r p-4 space-y-4">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-6 w-5/6" />
    </div>
  );
}
