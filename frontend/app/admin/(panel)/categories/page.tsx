"use client";

import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { listAllCategoriesFlattened, deleteCategory, errorMessage } from "@/lib/api";
import type { Category } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useState } from "react";

function buildTree(categories: Category[]) {
  const byParent = new Map<number | null, Category[]>();
  for (const c of categories) {
    const list = byParent.get(c.parent_id) ?? [];
    list.push(c);
    byParent.set(c.parent_id, list);
  }
  const rows: { category: Category; depth: number }[] = [];
  const visit = (parentId: number | null, depth: number) => {
    for (const c of byParent.get(parentId) ?? []) {
      rows.push({ category: c, depth });
      visit(c.id, depth + 1);
    }
  };
  visit(null, 0);
  return rows;
}

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const query = useQuery({
    queryKey: ["admin", "categories", "flattened"],
    queryFn: () => listAllCategoriesFlattened(),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteCategory(deleteTarget!.id),
    onSuccess: () => {
      toast.success("Category deleted");
      setDeleteTarget(null);
      void queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      void queryClient.invalidateQueries({ queryKey: ["categories"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-text-primary">Categories</h1>
        <Button asChild>
          <Link href="/admin/categories/new">Add category</Link>
        </Button>
      </div>

      {query.isPending ? (
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      ) : query.isError ? (
        <ErrorState title="Couldn't load categories" message={errorMessage(query.error)} onRetry={() => query.refetch()} />
      ) : query.data.length === 0 ? (
        <EmptyState
          title="No categories yet"
          caption="Create your first category to start organizing products."
          action={
            <Button asChild>
              <Link href="/admin/categories/new">Add category</Link>
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-text-muted">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Slug</th>
                  <th className="px-5 py-3 text-right font-medium">Products</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {buildTree(query.data).map(({ category, depth }) => (
                  <tr key={category.id} className="border-b border-border transition-colors last:border-0 hover:bg-black/[0.02]">
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center font-medium text-text-primary" style={{ paddingLeft: `${depth * 16}px` }}>
                        {depth > 0 ? (
                          <svg aria-hidden className="mr-1.5 h-3 w-3 shrink-0 text-text-muted" viewBox="0 0 20 20" fill="currentColor">
                            <path
                              fillRule="evenodd"
                              d="M2 6.75A2.75 2.75 0 0 1 4.75 4h2.908a1.75 1.75 0 0 1 1.238.512l1.138 1.122a.25.25 0 0 0 .177.073h5.239A2.75 2.75 0 0 1 18 8.457V14.25A2.75 2.75 0 0 1 15.25 17H4.75A2.75 2.75 0 0 1 2 14.25V6.75Z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : null}
                        {category.name}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-text-muted">{category.slug}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-text-secondary">{category.products_count}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button asChild variant="secondary" className="h-8 px-3 text-xs">
                          <Link href={`/admin/categories/${category.id}/edit`}>Edit</Link>
                        </Button>
                        <Button
                          variant="ghost"
                          className="h-8 px-3 text-xs text-error hover:bg-error-bg"
                          onClick={() => setDeleteTarget(category)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        title="Delete category"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? Categories with products can't be deleted.`}
        confirmText="Delete"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
      />
    </div>
  );
}