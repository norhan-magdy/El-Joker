"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createCategory, updateCategory, listAllCategoriesFlattened, errorMessage } from "@/lib/api";
import type { ApiError } from "@/lib/api";
import type { Category } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Label } from "@/components/ui/Label";
import { Skeleton } from "@/components/ui/Skeleton";

const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name must be 255 characters or fewer"),
  slug: z.string().max(255, "Slug must be 255 characters or fewer").optional().or(z.literal("")),
  parent_id: z
    .preprocess(
      (v) => (v === "" || v === undefined || v === null ? undefined : v),
      z.coerce.number({ message: "Invalid parent" }).int().nonnegative().optional(),
    ),
});

type CategoryInput = z.input<typeof categorySchema>;
type CategoryFormValues = z.output<typeof categorySchema>;

function descendantIds(categories: Category[], rootId: number): Set<number> {
  const result = new Set<number>([rootId]);
  const changed = true;
  while (changed) {
    let next = false;
    for (const c of categories) {
      if (c.parent_id !== null && result.has(c.parent_id) && !result.has(c.id)) {
        result.add(c.id);
        next = true;
      }
    }
    if (!next) break;
  }
  return result;
}

function buildCategoryOptions(
  categories: Category[],
  excludeIds: Set<number>,
): { id: number; name: string; depth: number }[] {
  const byParent = new Map<number | null, Category[]>();
  for (const c of categories) {
    if (excludeIds.has(c.id)) continue;
    const list = byParent.get(c.parent_id) ?? [];
    list.push(c);
    byParent.set(c.parent_id, list);
  }
  const options: { id: number; name: string; depth: number }[] = [];
  const visit = (parentId: number | null, depth: number) => {
    for (const c of byParent.get(parentId) ?? []) {
      if (!excludeIds.has(c.id)) {
        options.push({ id: c.id, name: c.name, depth });
        visit(c.id, depth + 1);
      }
    }
  };
  visit(null, 0);
  return options;
}

interface CategoryFormProps {
  category?: Category;
}

export function CategoryForm({ category }: CategoryFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const categories = useQuery({
    queryKey: ["admin", "categories", "flattened"],
    queryFn: () => listAllCategoriesFlattened(),
  });

  const form = useForm<CategoryInput, unknown, CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name ?? "",
      slug: category?.slug ?? "",
      parent_id: category?.parent_id ?? undefined,
    },
  });

  const mutation = useMutation({
    mutationFn: (values: CategoryFormValues) => {
      const parent_id = values.parent_id ?? null;
      const body = { name: values.name, parent_id, slug: values.slug || undefined };
      return category ? updateCategory(category.id, body) : createCategory(body);
    },
    onSuccess: () => {
      toast.success(category ? "Category updated" : "Category created");
      void queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      void queryClient.invalidateQueries({ queryKey: ["categories"] });
      router.push("/admin/categories");
    },
    onError: (err) => {
      const apiErr = err as Partial<ApiError>;
      if (apiErr.kind === "validation" && apiErr.errors) {
        for (const [field, msgs] of Object.entries(apiErr.errors)) {
          const key = field as keyof CategoryFormValues;
          form.setError(key, { message: msgs[0] });
        }
      } else {
        toast.error(errorMessage(err));
      }
    },
  });

  const items = categories.data ?? [];
  const exclude = category ? descendantIds(items, category.id) : new Set<number>();
  const options = categories.isPending ? [] : buildCategoryOptions(items, exclude);
  const { register, handleSubmit, formState } = form;

  return (
    <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate className="space-y-6">
      <Card className="max-w-xl p-5 sm:p-6">
        <div className="grid gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" invalid={!!formState.errors.name} {...register("name")} />
            {formState.errors.name ? (
              <p className="text-sm text-error" role="alert">{formState.errors.name.message}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="parent_id">Parent category</Label>
            {categories.isPending ? (
              <Skeleton className="h-10" />
            ) : (
              <Select
                id="parent_id"
                invalid={!!formState.errors.parent_id}
                {...register("parent_id")}
              >
                <option value="">None (top-level)</option>
                {options.map((c) => (
                  <option key={c.id} value={c.id}>
                    {"\u00A0".repeat(c.depth * 3)}
                    {c.name}
                  </option>
                ))}
              </Select>
            )}
            {categories.isPending ? (
              <p className="text-xs text-text-muted">Loading categories…</p>
            ) : options.length === 0 ? (
              <p className="text-xs text-text-muted">No other categories available.</p>
            ) : null}
            {formState.errors.parent_id ? (
              <p className="text-sm text-error" role="alert">{formState.errors.parent_id.message}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" placeholder="auto from name" invalid={!!formState.errors.slug} {...register("slug")} />
            {formState.errors.slug ? (
              <p className="text-sm text-error" role="alert">{formState.errors.slug.message}</p>
            ) : null}
          </div>
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" loading={mutation.isPending}>
          {category ? "Save changes" : "Create category"}
        </Button>
        <Button asChild variant="secondary">
          <Link href="/admin/categories">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}