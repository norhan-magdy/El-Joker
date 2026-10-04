import type {
  Invoice,
  Order,
  Paginated,
  Product,
} from "@/lib/types";
import { api } from "./client";

export {
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  getCategory,
  getProduct,
  listAllCategoriesFlattened,
  listCategories,
  listProducts,
  updateCategory,
  updateProduct,
} from "./catalog";

export { payOrder, updateOrderStatus } from "./orders";

export function listAdminOrders(page = 1): Promise<Paginated<Order>> {
  return api.get<Paginated<Order>>("orders", {
    scope: "admin",
    params: { page },
  });
}

export function getAdminOrder(id: string): Promise<{ data: Order }> {
  return api.get<{ data: Order }>(`orders/${id}`, { scope: "admin" });
}

export function listAdminInvoices(
  params: { page?: number; q?: string } = {}
): Promise<Paginated<Invoice>> {
  return api.get<Paginated<Invoice>>("admin/invoices", {
    scope: "admin",
    params: { page: params.page, q: params.q },
  });
}

export function getAdminInvoice(id: string): Promise<{ data: Invoice }> {
  return api.get<{ data: Invoice }>(`admin/invoices/${id}`, { scope: "admin" });
}

/** Queues PDF regeneration and returns 202 — poll `getAdminInvoice` for state. */
export function regenerateInvoice(
  id: string
): Promise<{ message: string; data: Invoice }> {
  return api.post<{ message: string; data: Invoice }>(
    `admin/invoices/${id}/generate`,
    undefined,
    { scope: "admin" }
  );
}

export type { Invoice, Order, Paginated, Product };