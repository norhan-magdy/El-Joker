"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createProduct, updateProduct, listAllCategoriesFlattened, errorMessage } from "@/lib/api";
import type { ApiError } from "@/lib/api";
import type { Product } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { Label } from "@/components/ui/Label";
import { Skeleton } from "@/components/ui/Skeleton";

const productSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title must be 255 characters or fewer"),
  category_id: z.coerce.number({ message: "Category is required" }).int().positive("Category is required"),
  price: z.coerce
    .number({ message: "Price is required" })
    .min(0, "Price must be at least 0")
    .max(9999999999.99, "Price is too large")
    .refine((v) => Number.isInteger(Math.round(v * 100)), "Price allows at most 2 decimals"),
  image_url: z
    .string()
    .min(1, "Image URL is required")
    .url("Enter a valid URL")
    .max(255, "Image URL must be 255 characters or fewer"),
  description: z.string().max(5000, "Description must be 5000 characters or fewer").optional().or(z.literal("")),
  stock: z.coerce.number({ message: "Stock is required" }).int("Stock must be a whole number").min(0, "Stock must be at least 0"),
  is_active: z.boolean(),
  slug: z.string().max(255, "Slug must be 255 characters or fewer").optional().or(z.literal("")),
});

type ProductInput = z.input<typeof productSchema>;
type ProductFormValues = z.output<typeof productSchema>;

interface ProductFormProps {
  product?: Product;
  categoryId?: number;
}

function buildCategoryOptions(categories: { id: number; name: string; parent_id: number | null }[]) {
  const byParent = new Map<number | null, { id: number; name: string }[]>();
  for (const c of categories) {
    const list = byParent.get(c.parent_id) ?? [];
    list.push({ id: c.id, name: c.name });
    byParent.set(c.parent_id, list);
  }
  const options: { id: number; name: string; depth: number }[] = [];
  const visit = (parentId: number | null, depth: number) => {
    for (const c of byParent.get(parentId) ?? []) {
      options.push({ id: c.id, name: c.name, depth });
      visit(c.id, depth + 1);
    }
  };
  visit(null, 0);
  return options;
}

export function ProductForm({ product, categoryId }: ProductFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const categoriesQuery = useQuery({
    queryKey: ["admin", "categories", "flattened"],
    queryFn: () => listAllCategoriesFlattened(),
  });
  const categories = categoriesQuery.data ?? [];

  const form = useForm<ProductInput, unknown, ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: product?.title ?? "",
      category_id: categoryId ?? "" as unknown as number,
      price: product?.price ?? undefined as unknown as number,
      image_url: product?.image_url ?? "",
      description: product?.description ?? "",
      stock: product?.stock ?? 0,
      is_active: product?.is_active ?? true,
      slug: product?.slug ?? "",
    },
  });

  const mutation = useMutation({
    mutationFn: (values: ProductFormValues) => {
      const body = {
        title: values.title,
        category_id: values.category_id,
        price: values.price,
        image_url: values.image_url,
        description: values.description || null,
        stock: values.stock,
        is_active: values.is_active,
        slug: values.slug || undefined,
      };
      return product ? updateProduct(product.id, body) : createProduct(body);
    },
    onSuccess: () => {
      toast.success(product ? "Product updated" : "Product created");
      void queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      router.push("/admin/products");
    },
    onError: (err) => {
      const apiErr = err as Partial<ApiError>;
      if (apiErr.kind === "validation" && apiErr.errors) {
        for (const [field, msgs] of Object.entries(apiErr.errors)) {
          const key = field as keyof ProductFormValues;
          if (field in productSchema.shape) form.setError(key, { message: msgs[0] });
        }
      } else {
        toast.error(errorMessage(err));
      }
    },
  });

  const { register, handleSubmit, setValue, formState } = form;
  const [isActive, setIsActive] = useState(product?.is_active ?? true);

  const options = categoriesQuery.isPending ? [] : buildCategoryOptions(categories);

  return (
    <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate className="space-y-6">
      <Card className="max-w-2xl p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" invalid={!!formState.errors.title} {...register("title")} />
            {formState.errors.title ? (
              <p className="text-sm text-error" role="alert">{formState.errors.title.message}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="category_id">Category</Label>
            {categoriesQuery.isPending ? (
              <Skeleton className="h-10" />
            ) : (
              <Select id="category_id" invalid={!!formState.errors.category_id} {...register("category_id")}>
                <option value="">Select category…</option>
                {options.map((c) => (
                  <option key={c.id} value={c.id}>
                    {"\u00A0".repeat(c.depth * 3)}
                    {c.name}
                  </option>
                ))}
              </Select>
            )}
            {formState.errors.category_id ? (
              <p className="text-sm text-error" role="alert">{formState.errors.category_id.message}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="price">Price</Label>
            <Input id="price" type="number" step="0.01" min="0" invalid={!!formState.errors.price} {...register("price")} />
            {formState.errors.price ? (
              <p className="text-sm text-error" role="alert">{formState.errors.price.message}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="stock">Stock</Label>
            <Input id="stock" type="number" step="1" min="0" invalid={!!formState.errors.stock} {...register("stock")} />
            {formState.errors.stock ? (
              <p className="text-sm text-error" role="alert">{formState.errors.stock.message}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="image_url">Image URL</Label>
            <Input id="image_url" type="url" invalid={!!formState.errors.image_url} {...register("image_url")} />
            {formState.errors.image_url ? (
              <p className="text-sm text-error" role="alert">{formState.errors.image_url.message}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              placeholder="auto from title"
              invalid={!!formState.errors.slug}
              {...register("slug")}
            />
            {formState.errors.slug ? (
              <p className="text-sm text-error" role="alert">{formState.errors.slug.message}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={4} invalid={!!formState.errors.description} {...register("description")} />
            {formState.errors.description ? (
              <p className="text-sm text-error" role="alert">{formState.errors.description.message}</p>
            ) : null}
          </div>

          <label className="inline-flex items-center gap-2.5 sm:col-span-2">
            <Checkbox
              checked={isActive}
              onChange={(e) => {
                const checked = e.target.checked;
                setIsActive(checked);
                setValue("is_active", checked, { shouldValidate: true });
              }}
            />
            <span className="text-sm text-text-primary">Active (visible in the store)</span>
          </label>
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" loading={mutation.isPending}>
          {product ? "Save changes" : "Create product"}
        </Button>
        <Button asChild variant="secondary">
          <Link href="/admin/products">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}