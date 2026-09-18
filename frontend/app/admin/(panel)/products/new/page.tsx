import { ProductForm } from "@/components/admin/ProductForm";
import Link from "next/link";

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/products" className="text-sm font-medium text-primary hover:text-primary-hover">
          ← Back to products
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-text-primary">Add product</h1>
      </div>
      <ProductForm />
    </div>
  );
}