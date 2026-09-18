import Link from "next/link";
import { CategoryForm } from "@/components/admin/CategoryForm";

export default function NewCategoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/categories" className="text-sm font-medium text-primary hover:text-primary-hover">
          ← Back to categories
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-text-primary">Add category</h1>
      </div>
      <CategoryForm />
    </div>
  );
}