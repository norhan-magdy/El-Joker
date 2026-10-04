import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ScrollView, StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { FormBanner } from "@/components/ui/FormBanner";
import { Input } from "@/components/ui/Input";
import { ScreenState } from "@/components/ui/ScreenState";
import { Select } from "@/components/ui/Select";
import { Text } from "@/components/ui/Text";
import {
  createProduct,
  getProduct,
  listAllCategoriesFlattened,
  updateProduct,
} from "@/lib/api/catalog";
import { errorMessage } from "@/lib/api/errors";
import { applyServerErrors } from "@/lib/forms";
import { queryKeys } from "@/lib/query-keys";
import { productFormSchema, type ProductFormValues } from "@/lib/schemas";
import { spacing } from "@/lib/theme/tokens";
import type { ProductInput } from "@/lib/types";

/**
 * Create or edit a product.
 *
 * One screen serves both modes: with no `id` it creates, with an `id` it loads
 * and updates. Numeric inputs stay as strings in the form so a half-typed value
 * such as `1.` is not clobbered mid-keystroke; they are converted here, after
 * Zod has validated them.
 *
 * There is no image upload in the API, so `image_url` is a required absolute
 * URL.
 */
export default function ProductFormScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const id = rawId?.trim() || undefined;

  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<unknown>(null);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      title: "",
      category_id: "",
      price: "",
      image_url: "",
      description: "",
      stock: "",
      is_active: true,
    },
    mode: "onBlur",
  });

  const categories = useQuery({
    queryKey: queryKeys.catalog.categories,
    queryFn: () => listAllCategoriesFlattened(),
  });

  // Read as admin. `show` only tolerates an inactive product when the caller
  // holds `products.manage`, and a public read sends no token — so a public
  // scope 404s on every hidden product, which is exactly what this screen
  // exists to edit.
  const existing = useQuery({
    queryKey: queryKeys.catalog.product(id ?? "", "admin"),
    queryFn: () => getProduct(id as string, "admin"),
    enabled: Boolean(id),
  });

  useEffect(() => {
    const product = existing.data?.data;
    if (!product) return;

    form.reset({
      title: product.title,
      // Not every payload embeds the category, so fall back to re-selecting it.
      category_id: product.category ? String(product.category.id) : "",
      price: String(product.price),
      image_url: product.image_url,
      description: product.description ?? "",
      stock: product.stock === undefined ? "" : String(product.stock),
      is_active: product.is_active,
    });
  }, [existing.data, form]);

  const save = useMutation({
    mutationFn: (values: ProductFormValues) => {
      const body: ProductInput = {
        title: values.title.trim(),
        category_id: Number(values.category_id),
        price: Number(values.price),
        image_url: values.image_url.trim(),
        description: values.description.trim() || null,
        is_active: values.is_active,
      };

      // Omitted rather than sent as 0: `stock` is `sometimes` server-side, and
      // an update treats a missing value as "leave the inventory untouched".
      const stock = values.stock.trim();
      if (stock !== "") body.stock = Number(stock);

      return id ? updateProduct(id, body) : createProduct(body);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.catalog.all });
      router.back();
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      await save.mutateAsync(values);
    } catch (error) {
      if (!applyServerErrors(form.setError, error)) setFormError(error);
    }
  });

  const categoryOptions = (categories.data ?? []).map((category) => ({
    value: String(category.id),
    label: category.parent_id ? `${category.name} (nested)` : category.name,
  }));

  return (
    <Screen padded={false}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={styles.content}
      >
        {/*
          Both queries gate the form. The categories list must gate it too: it is
          what fills the category picker, so loading on silently renders an empty
          "Choose…" field, and a failure renders the same empty field — which
          then fails submit validation with "Choose a category." and no visible
          cause.
        */}
        <ScreenState
          isLoading={
            (Boolean(id) && existing.isLoading) || categories.isLoading
          }
          error={existing.error ?? categories.error}
          onRetry={() => {
            void existing.refetch();
            void categories.refetch();
          }}
        >
          {formError ? <FormBanner message={errorMessage(formError)} /> : null}

          <Controller
            control={form.control}
            name="title"
            render={({ field, fieldState }) => (
              <Input
                label="Title"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
                placeholder="Product title"
              />
            )}
          />

          <Controller
            control={form.control}
            name="category_id"
            render={({ field, fieldState }) => (
              <Select
                label="Category"
                // Chips, not the default horizontal scroller: this picker sits
                // inside a vertical ScrollView, where a horizontal one competes
                // for the gesture and hides most of the 20-per-page tree.
                variant="chips"
                options={categoryOptions}
                value={field.value}
                onChange={field.onChange}
                error={
                  fieldState.error?.message ??
                  (categories.error ? errorMessage(categories.error) : undefined)
                }
                placeholder={
                  categories.isLoading
                    ? "Loading categories…"
                    : categories.data?.length
                      ? "Choose…"
                      : "No categories yet"
                }
              />
            )}
          />

          <Controller
            control={form.control}
            name="price"
            render={({ field, fieldState }) => (
              <Input
                label="Price"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
                keyboardType="decimal-pad"
                placeholder="0.00"
              />
            )}
          />

          <Controller
            control={form.control}
            name="stock"
            render={({ field, fieldState }) => (
              <Input
                label="Stock"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
                keyboardType="number-pad"
                placeholder="0"
              />
            )}
          />

          <Controller
            control={form.control}
            name="image_url"
            render={({ field, fieldState }) => (
              <Input
                label="Image URL"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
                placeholder="https://example.com/image.jpg"
                autoCapitalize="none"
                keyboardType="url"
              />
            )}
          />

          <Controller
            control={form.control}
            name="description"
            render={({ field, fieldState }) => (
              <Input
                label="Description"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
                placeholder="Optional"
                multiline
                numberOfLines={5}
                style={styles.multiline}
                textAlignVertical="top"
              />
            )}
          />

          <Controller
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <Card style={styles.toggle}>
                <Checkbox
                  label="Visible in the storefront"
                  checked={field.value}
                  onToggle={() => field.onChange(!field.value)}
                />
                <Text variant="caption" tone="muted">
                  Hidden products stay in the database but are removed from all
                  public listings.
                </Text>
              </Card>
            )}
          />

          <View style={styles.actions}>
            <Button
              label={id ? "Save changes" : "Create product"}
              onPress={onSubmit}
              loading={save.isPending}
              disabled={save.isPending}
              fullWidth
            />
            <Button
              label="Cancel"
              variant="ghost"
              onPress={() => router.back()}
              disabled={save.isPending}
              fullWidth
            />
          </View>
        </ScreenState>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxl * 2,
  },
  multiline: {
    minHeight: 96,
  },
  toggle: {
    gap: spacing.xs,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
