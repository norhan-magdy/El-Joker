"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listRoles,
  createRole,
  deleteRole,
  givePermissions,
  revokePermissions,
  syncUserRoles,
  errorMessage,
} from "@/lib/api";
import type { Role } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Checkbox } from "@/components/ui/Checkbox";
import { Dialog } from "@/components/ui/Dialog";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";

const roleSchema = z.object({
  name: z.string().min(1, "Role name is required").max(255, "Role name must be 255 characters or fewer"),
});
type RoleFormValues = z.infer<typeof roleSchema>;

function RoleRow({ role, allPermissions }: { role: Role; allPermissions: string[] }) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(role.permissions.map((p) => p.name)));

  const hasChanges =
    selected.size !== role.permissions.length ||
    role.permissions.some((p) => !selected.has(p.name));

  const saveMutation = useMutation({
    mutationFn: async () => {
      const current = new Set(role.permissions.map((p) => p.name));
      const toAdd = [...selected].filter((p) => !current.has(p));
      const toRemove = [...current].filter((p) => !selected.has(p));
      const ops: Promise<unknown>[] = [];
      if (toAdd.length > 0) ops.push(givePermissions(role.id, { permissions: toAdd }));
      if (toRemove.length > 0) ops.push(revokePermissions(role.id, { permissions: toRemove }));
      await Promise.all(ops);
    },
    onSuccess: () => {
      toast.success("Permissions updated");
      setExpanded(false);
      void queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const toggleAll = (checked: boolean) => {
    setSelected(new Set(checked ? allPermissions : []));
  };

  return (
    <div className="border-b border-border last:border-0">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          className="flex flex-1 items-center gap-2 text-left"
        >
          <svg
            aria-hidden
            className={`h-4 w-4 text-text-muted transition-transform ${expanded ? "rotate-90" : ""}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z"
              clipRule="evenodd"
            />
          </svg>
          <span className="font-medium text-text-primary">{role.name}</span>
          <span className="rounded-full bg-background px-2 py-0.5 text-xs tabular-nums text-text-secondary">
            {role.permissions.length} permissions
          </span>
        </button>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-sm font-medium text-primary hover:text-primary-hover"
        >
          {expanded ? "Hide" : "Edit"}
        </button>
      </div>

      {expanded ? (
        <div className="border-t border-border bg-background/40 px-5 py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-text-primary">Permissions</p>
            <label className="inline-flex items-center gap-2 text-sm text-text-secondary">
              <Checkbox
                checked={selected.size === allPermissions.length && allPermissions.length > 0}
                onChange={(e) => toggleAll(e.target.checked)}
              />
              Select all
            </label>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {allPermissions.map((permission) => (
              <label
                key={permission}
                className="flex cursor-pointer items-center gap-2.5 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary transition-colors hover:border-text-muted"
              >
                <Checkbox
                  checked={selected.has(permission)}
                  onChange={(e) => {
                    const next = new Set(selected);
                    if (e.target.checked) next.add(permission);
                    else next.delete(permission);
                    setSelected(next);
                  }}
                />
                <span className="font-mono text-xs">{permission}</span>
              </label>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Button
              onClick={() => saveMutation.mutate()}
              loading={saveMutation.isPending}
              disabled={!hasChanges && !saveMutation.isPending}
            >
              Save changes
            </Button>
            <button
              type="button"
              onClick={() => {
                setSelected(new Set(role.permissions.map((p) => p.name)));
                setExpanded(false);
              }}
              className="text-sm font-medium text-text-secondary hover:text-text-primary"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function UserRoleSyncForm({ roles }: { roles: Role[] }) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ userId: string }>(); // userId validated manually below

  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [savedRoles, setSavedRoles] = useState<Set<string>>(new Set());

  const mutation = useMutation({
    mutationFn: (vars: { userId: string; roles: string[] }) => syncUserRoles(vars.userId, { roles: vars.roles }),
    onSuccess: () => {
      toast.success("User roles synced");
      void queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      void queryClient.invalidateQueries({ queryKey: ["users"] });
      setSavedRoles(new Set(checked));
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <Card className="p-5 sm:p-6">
      <h2 className="text-base font-semibold text-text-primary">Sync user roles</h2>
      <p className="mt-1 text-sm text-text-muted">
        Assign roles by user id (uuid). This replaces the user&apos;s current roles.
      </p>
      <form
        onSubmit={handleSubmit(({ userId }) => {
          if (!userId.trim()) {
            toast.error("Enter a user id");
            return;
          }
          mutation.mutate({ userId: userId.trim(), roles: [...checked] });
        })}
        className="mt-4 space-y-4"
        noValidate
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="userId">User id</Label>
          <Input
            id="userId"
            placeholder="00000000-0000-0000-0000-000000000000"
            invalid={!!errors.userId}
            {...register("userId")}
          />
          {errors.userId ? <p className="text-sm text-error" role="alert">{errors.userId.message}</p> : null}
        </div>

        <fieldset>
          <legend className="text-sm font-medium text-text-primary">Roles</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {roles.map((role) => (
              <label
                key={role.id}
                className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  checked.has(role.name)
                    ? "border-primary/40 bg-primary-weak text-primary"
                    : "border-border-strong bg-surface text-text-primary hover:border-text-muted"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked.has(role.name)}
                  onChange={(e) => {
                    const next = new Set(checked);
                    if (e.target.checked) next.add(role.name);
                    else next.delete(role.name);
                    setChecked(next);
                  }}
                  className="h-4 w-4 rounded border-border-strong text-primary accent-primary"
                />
                {role.name}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={mutation.isPending}>
            Sync roles
          </Button>
          {savedRoles.size > 0 ? (
            <button
              type="button"
              onClick={() => setChecked(new Set(savedRoles))}
              className="text-sm font-medium text-text-secondary hover:text-text-primary"
            >
              Restore last saved
            </button>
          ) : null}
        </div>
      </form>
    </Card>
  );
}

export default function AdminRolesPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);

  const query = useQuery({
    queryKey: ["admin", "roles"],
    queryFn: listRoles,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: { name: "" },
  });

  const createMutation = useMutation({
    mutationFn: (values: RoleFormValues) => createRole(values),
    onSuccess: () => {
      toast.success("Role created");
      setCreateOpen(false);
      reset({ name: "" });
      void queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteRole(deleteTarget!.id),
    onSuccess: () => {
      toast.success("Role deleted");
      setDeleteTarget(null);
      void queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const roles = query.data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-text-primary">Roles</h1>
        <Button onClick={() => setCreateOpen(true)}>Add role</Button>
      </div>

      {query.isPending ? (
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      ) : query.isError ? (
        <ErrorState title="Couldn't load roles" message={errorMessage(query.error)} onRetry={() => query.refetch()} />
      ) : roles.length === 0 ? (
        <EmptyState title="No roles yet" caption="Create your first role to start assigning permissions." />
      ) : (
        <Card className="overflow-hidden">
          <div className="divide-y divide-border">
            {roles.map((role) => (
              <RoleRow key={role.id} role={role} allPermissions={query.data?.available_permissions ?? []} />
            ))}
          </div>
        </Card>
      )}

      <UserRoleSyncForm roles={roles} />

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} title="Add role" labelledBy="add-role-title">
        <form onSubmit={handleSubmit((v) => createMutation.mutate(v))} noValidate className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Role name</Label>
            <Input id="name" placeholder="e.g. moderator" invalid={!!errors.name} {...register("name")} autoFocus />
            {errors.name ? <p className="text-sm text-error" role="alert">{errors.name.message}</p> : null}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)} disabled={createMutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              Create role
            </Button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        title="Delete role"
        message={`Delete the "${deleteTarget?.name}" role? This can't be undone.`}
        confirmText="Delete"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
      />
    </div>
  );
}