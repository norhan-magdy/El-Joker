"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { payOrder, errorMessage } from "@/lib/api";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

const PROVIDER_SUGGESTIONS = ["stripe", "paypal", "cash", "card"];

const paymentSchema = z.object({
  provider: z.string().min(1, "Provider is required").max(255, "Provider must be 255 characters or fewer"),
  transaction_id: z.string().max(255, "Transaction id must be 255 characters or fewer").optional().or(z.literal("")),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

export function PaymentForm({ orderId, open, onClose }: { orderId: string; open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [provider, setProvider] = useState("stripe");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { provider: "stripe", transaction_id: "" },
  });

  const handleClose = () => {
    setProvider("stripe");
    reset({ provider: "stripe", transaction_id: "" });
    onClose();
  };

  const mutation = useMutation({
    mutationFn: (values: PaymentFormValues) => payOrder(orderId, values),
    onSuccess: () => {
      toast.success("Payment recorded");
      handleClose();
      void queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <Dialog open={open} onClose={handleClose} title="Record payment" labelledBy="record-payment-title">
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="provider">Provider</Label>
          <Input
            id="provider"
            list="provider-suggestions"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            invalid={!!errors.provider}
          />
          <datalist id="provider-suggestions">
            {PROVIDER_SUGGESTIONS.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
          {errors.provider ? (
            <p className="text-sm text-error" role="alert">{errors.provider.message}</p>
          ) : (
            <p className="text-xs text-text-muted">Examples: stripe, paypal, cash</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="transaction_id">Transaction ID</Label>
          <Input
            id="transaction_id"
            placeholder="Optional"
            invalid={!!errors.transaction_id}
            {...register("transaction_id")}
          />
          {errors.transaction_id ? (
            <p className="text-sm text-error" role="alert">{errors.transaction_id.message}</p>
          ) : null}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            Record payment
          </Button>
        </div>
      </form>
    </Dialog>
  );
}