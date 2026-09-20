export type OrderStatus = "pending" | "paid" | "shipped" | "delivered" | "cancelled";

export type ProductSort = "newest" | "price-asc" | "price-desc";

export interface PriceRange {
  min: number;
  max: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  is_admin: boolean;
  roles: string[];
}

export interface AuthResponse {
  token: string;
  user: { id: string; name: string; email: string; is_admin: boolean; roles: string[] };
}

export interface MessageResponse {
  message: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  products_count: number;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  image_url: string;
  is_active: boolean;
  stock?: number;
  category?: Category;
  created_at: string;
}

export interface CartItem {
  id: string;
  quantity: number;
  line_total: number;
  product: Product;
}

export interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  product: Product;
}

export interface Payment {
  id: string;
  provider: string;
  transaction_id: string | null;
  amount: number;
  status: string;
  created_at: string;
}

/** Partial payment object returned by POST orders/{id}/pay (no transaction_id/created_at). */
export interface PaidPayment {
  id: string;
  provider: string;
  amount: number;
  status: string;
}

export interface InvoiceOrderSummary {
  id: string;
  status: OrderStatus;
  total_amount: number;
  shipping_address: string;
  created_at: string;
  items?: OrderItem[];
  payments?: Payment[];
}

export interface InvoiceCustomer {
  name: string;
  email: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  pdf_url: string | null;
  issued_at: string;
  order?: InvoiceOrderSummary;
  customer?: InvoiceCustomer;
  items_count?: number;
}

export interface Order {
  id: string;
  status: OrderStatus;
  total_amount: number;
  shipping_address: string;
  items?: OrderItem[];
  invoice?: Invoice | null;
  payments?: Payment[];
  user_id?: string;
  created_at: string;
}

export interface Permission {
  id: number;
  name: string;
}

export interface Role {
  id: number;
  name: string;
  permissions: Permission[];
}

export interface RolesPayload {
  data: Role[];
  available_permissions: string[];
}

export interface PaginationLinks {
  first: string | null;
  last: string | null;
  prev: string | null;
  next: string | null;
}

export interface PaginationMeta {
  current_page: number;
  from: number | null;
  last_page: number;
  path: string;
  per_page: number;
  to: number | null;
  total: number;
}

export interface Paginated<T> {
  data: T[];
  links: PaginationLinks;
  meta: PaginationMeta;
}

export interface ProductsPage extends Paginated<Product> {
  price_range?: PriceRange;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface RegisterBody {
  name: string;
  email: string;
  password: string;
}

export interface ProductInput {
  title: string;
  category_id: number;
  price: number;
  image_url: string;
  description?: string | null;
  stock?: number;
  is_active?: boolean;
  slug?: string;
}

export interface CategoryInput {
  name: string;
  parent_id?: number | null;
  slug?: string;
}