import { api, buildUrl, getCachedToken } from "./client";
import type {
  CheckoutBody,
  Invoice,
  InvoiceLinkResponse,
  MessageResponse,
  Order,
  OrderStatus,
  Paginated,
  PayOrderResponse,
} from "@/lib/types";

export function listOrders(page = 1): Promise<Paginated<Order>> {
  return api.get<Paginated<Order>>("orders", {
    scope: "customer",
    params: { page },
  });
}

export function getOrder(id: string): Promise<{ data: Order }> {
  return api.get<{ data: Order }>(`orders/${id}`, { scope: "customer" });
}

/**
 * Throttled at 10/min and 50/day server-side. Empties the cart, decrements
 * inventory atomically, and returns the order with `status: "pending"`.
 * Throws a `stock` ApiError (409) if inventory ran out; the cart is left intact.
 */
export function checkout(body: CheckoutBody): Promise<{ data: Order }> {
  return api.post<{ data: Order }>("orders/checkout", body, {
    scope: "customer",
  });
}

/** Admin-only. Moves an order through its lifecycle. */
export function updateOrderStatus(
  id: string,
  status: OrderStatus
): Promise<{ data: Order }> {
  return api.put<{ data: Order }>(`orders/${id}`, { status }, {
    scope: "admin",
  });
}

/** Admin-only. Records a payment row. Returns `payment`, not `data`. */
export function payOrder(
  id: string,
  body: { provider: string; transaction_id?: string }
): Promise<PayOrderResponse> {
  return api.post<PayOrderResponse>(`orders/${id}/pay`, body, {
    scope: "admin",
  });
}

export function listInvoicesForOrder(id: string): Promise<Invoice | null> {
  return getOrder(id).then((res) => res.data.invoice ?? null);
}

/**
 * Short-lived signed URL for handing the PDF to the OS share sheet without
 * exposing the bearer token. Fails on the default `local` disk because
 * `temporaryUrl()` is only supported on S3-compatible drivers — callers must
 * fall back to `downloadInvoicePdfBytes`.
 */
export function getInvoiceLink(
  orderId: string
): Promise<InvoiceLinkResponse> {
  return api.get<InvoiceLinkResponse>(`orders/${orderId}/invoice/link`, {
    scope: "customer",
  });
}

/**
 * Streams the PDF as raw bytes with the bearer header attached. This is the
 * reliable path on the default `local` invoice disk.
 */
export async function downloadInvoicePdfBytes(
  orderId: string
): Promise<Uint8Array> {
  const token = getCachedToken("customer");
  const res = await fetch(
    buildUrl(`orders/${orderId}/invoice/pdf`),
    {
      headers: {
        Accept: "application/pdf",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );

  if (!res.ok) {
    let message = `Could not download the invoice (${res.status}).`;
    try {
      const payload = await res.json();
      if (payload?.message) message = payload.message;
    } catch {
      // keep the status-code fallback
    }
    throw { kind: "business", status: res.status, message } as const;
  }

  const buffer = await res.arrayBuffer();
  return new Uint8Array(buffer);
}

export type { MessageResponse };