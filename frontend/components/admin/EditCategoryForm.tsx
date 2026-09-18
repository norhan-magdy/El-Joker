"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getCategory, errorMessage } from "@/lib/api";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";

export function EditCategoryForm({ categoryId }: { categoryId: number }) {
  const query = useQuery({
    queryKey: ["admin", "categories", categoryId],
    queryFn: () => getCategory(categoryId),
    retry: 0,
  });

  if (query.isPending) {
    return (
      <div className="space-y-6" aria-busy="true">
        <div>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-2 h-8 w-56" />
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="space-y-4">
        <Link href="/admin/categories" className="text-sm font-medium text-primary hover:text-primary-hover">
          ← Back to categories
        </Link>
        <ErrorState
          title="Couldn't load category"
          message={
            (query.error as { status?: number })?.status === 404
              ? "This category doesn't exist."
              : errorMessage(query.error)
          }
          onRetry={() => query.refetch()}
          action={
            <Button asChild variant="secondary">
              <Link href="/admin/categories">Back to categories</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/categories" className="text-sm font-medium text-primary hover:text-primary-hover">
          ← Back to categories
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-text-primary">Edit category</h1>
      </div>
      <CategoryForm category={query.data.data} />
    </div>
  );
}