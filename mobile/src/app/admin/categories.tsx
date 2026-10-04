import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Dialog } from "@/components/ui/Dialog";
import { FormBanner } from "@/components/ui/FormBanner";
import { Input } from "@/components/ui/Input";
import { ScreenState } from "@/components/ui/ScreenState";
import { Select } from "@/components/ui/Select";
import { Text } from "@/components/ui/Text";
import {
  createCategory,
  deleteCategory,
  listAllCategoriesFlattened,
  updateCategory,
} from "@/lib/api/catalog";
import { errorMessage } from "@/lib/api/errors";
import { applyServerErrors } from "@/lib/forms";
import { queryKeys } from "@/lib/query-keys";
import { categoryFormSchema, type CategoryFormValues } from "@/lib/schemas";
import { radius, spacing } from "@/lib/theme/tokens";
import type { Category, CategoryInput } from "@/lib/types";

type Editing = { id: number; name: string; parent_id: number | null } | null;

/**
 * Category tree management.
 *
 * The category endpoint caps at 20 per page with no `per_page` override, so the
 * full tree is walked page by page and then assembled into a hierarchy locally.
 *
 * The backend blocks a category from being its own parent, but it does **not**
 * stop a cycle forming deeper in the tree (a → b → a). The parent picker
 * therefore excludes the category being edited and all of its descendants,
 * because submitting a cycle would produce a tree this screen cannot render.
 */
export default function AdminCategoriesScreen() {
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState<Editing>(null);
  const [creating, setCreating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);
  const [formError, setFormError] = useState<unknown>(null);

  const categories = useQuery({
    queryKey: queryKeys.catalog.categories,
    queryFn: () => listAllCategoriesFlattened(),
  });

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: { name: "", parent_id: "" },
    mode: "onBlur",
  });

  const all = categories.data ?? [];

  const descendantsOf = (rootId: number): Set<number> => {
    const blocked = new Set<number>([rootId]);
    const walk = (parent: number) => {
      for (const child of all) {
        if (child.parent_id === parent && !blocked.has(child.id)) {
          blocked.add(child.id);
          walk(child.id);
        }
      }
    };
    walk(rootId);
    return blocked;
  };

  const blocked = editing ? descendantsOf(editing.id) : new Set<number>();

  const parentOptions = [
    { value: "", label: "Top level (no parent)" },
    ...all
      .filter((category) => !blocked.has(category.id))
      .map((category) => ({ value: String(category.id), label: category.name })),
  ];

  const close = () => {
    setCreating(false);
    setEditing(null);
    setFormError(null);
    form.reset({ name: "", parent_id: "" });
  };

  const save = useMutation({
    mutationFn: (values: CategoryFormValues) => {
      const body: CategoryInput = {
        name: values.name.trim(),
        parent_id: values.parent_id ? Number(values.parent_id) : null,
      };
      return editing
        ? updateCategory(editing.id, body)
        : createCategory(body);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.catalog.all });
      close();
    },
  });

  const remove = useMutation({
    mutationFn: (category: Category) => deleteCategory(category.id),
    onSuccess: async () => {
      setPendingDelete(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.catalog.all });
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

  const openEdit = (category: Category) => {
    setCreating(false);
    setFormError(null);
    setEditing({
      id: category.id,
      name: category.name,
      parent_id: category.parent_id,
    });
    form.reset({
      name: category.name,
      parent_id: category.parent_id ? String(category.parent_id) : "",
    });
  };

  const byParent = (parentId: number | null) =>
    all.filter((category) => category.parent_id === parentId);

  const renderNode = (category: Category, depth: number) => {
    const children = byParent(category.id);

    return (
      <View key={category.id}>
        <View style={[styles.node, { marginLeft: depth * spacing.lg }]}>
          <View style={styles.nodeBody}>
            <Text variant="body" tone="primary">
              {category.name}
            </Text>
            <Text variant="caption" tone="muted">
              {category.slug} · {category.products_count} product
              {category.products_count === 1 ? "" : "s"}
            </Text>
          </View>

          <View style={styles.nodeActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Edit ${category.name}`}
              onPress={() => openEdit(category)}
              hitSlop={8}
              style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.6 }]}
            >
              <Ionicons name="create-outline" size={18} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Delete ${category.name}`}
              onPress={() => setPendingDelete(category)}
              hitSlop={8}
              style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.6 }]}
            >
              <Ionicons name="trash-outline" size={18} />
            </Pressable>
          </View>
        </View>

        {children.map((child) => renderNode(child, depth + 1))}
      </View>
    );
  };

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Button
          label="New category"
          onPress={() => {
            setEditing(null);
            setFormError(null);
            setCreating(true);
            form.reset({ name: "", parent_id: "" });
          }}
        />
      </View>

      <ScreenState
        isLoading={categories.isLoading}
        error={categories.error}
        isEmpty={all.length === 0}
        onRetry={() => void categories.refetch()}
        emptyTitle="No categories yet"
        emptyMessage="Create a category to organise the catalogue."
      >
        <ScrollView contentContainerStyle={styles.list}>
          {byParent(null).map((category) => renderNode(category, 0))}

          {/*
            Anything whose parent is missing would otherwise vanish from the
            tree, since only root categories are rendered at the top level.
          */}
          {all.filter((category) => {
            if (category.parent_id === null) return false;
            return !all.some((candidate) => candidate.id === category.parent_id);
          }).length ? (
            <Card style={styles.orphans}>
              <Text variant="bodyStrong" tone="error">
                Unreachable categories
              </Text>
              <Text variant="caption" tone="muted">
                These point at a parent that no longer exists and are hidden
                from the storefront.
              </Text>
              {all
                .filter((category) => {
                  if (category.parent_id === null) return false;
                  return !all.some(
                    (candidate) => candidate.id === category.parent_id
                  );
                })
                .map((category) => (
                  <View key={category.id} style={styles.node}>
                    <Text variant="body" tone="primary">
                      {category.name}
                    </Text>
                    <Button
                      label="Fix"
                      variant="ghost"
                      size="sm"
                      onPress={() => openEdit(category)}
                    />
                  </View>
                ))}
            </Card>
          ) : null}
        </ScrollView>
      </ScreenState>

      <Dialog
        visible={creating || editing !== null}
        onClose={close}
        title={editing ? "Edit category" : "New category"}
        dismissable={!save.isPending}
      >
        <View style={styles.dialogBody}>
          {formError ? <FormBanner message={errorMessage(formError)} /> : null}

          <Controller
            control={form.control}
            name="name"
            render={({ field, fieldState }) => (
              <Input
                label="Name"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
                placeholder="Category name"
              />
            )}
          />

          <Controller
            control={form.control}
            name="parent_id"
            render={({ field, fieldState }) => (
              <Select
                label="Parent"
                // Chips, not the default horizontal scroller: inside the dialog's
                // vertical ScrollView a horizontal list fights the gesture and
                // keeps most of the tree off-screen.
                variant="chips"
                options={parentOptions}
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message}
                placeholder="Top level (no parent)"
              />
            )}
          />

          <View style={styles.dialogActions}>
            <Button
              label="Cancel"
              variant="secondary"
              onPress={close}
              disabled={save.isPending}
              style={styles.dialogAction}
            />
            <Button
              label={editing ? "Save" : "Create"}
              onPress={onSubmit}
              loading={save.isPending}
              disabled={save.isPending}
              style={styles.dialogAction}
            />
          </View>
        </View>
      </Dialog>

      <ConfirmDialog
        visible={pendingDelete !== null}
        title="Delete category"
        message={
          pendingDelete
            ? pendingDelete.products_count > 0
              ? `"${pendingDelete.name}" still holds ${pendingDelete.products_count} product(s). The API will reject this delete.`
              : `Delete "${pendingDelete.name}"? This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        destructive
        isPending={remove.isPending}
        error={remove.error}
        onConfirm={() => {
          if (pendingDelete) remove.mutate(pendingDelete);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl * 2,
    gap: spacing.sm,
  },
  node: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  nodeBody: {
    flex: 1,
    gap: 2,
  },
  nodeActions: {
    flexDirection: "row",
    gap: spacing.md,
  },
  iconButton: {
    padding: spacing.xs,
    borderRadius: radius.sm,
  },
  orphans: {
    gap: spacing.xs,
    marginTop: spacing.lg,
  },
  dialogBody: {
    gap: spacing.md,
  },
  dialogActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  dialogAction: {
    flex: 1,
  },
});
