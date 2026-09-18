import { EditCategoryForm } from "@/components/admin/EditCategoryForm";

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditCategoryForm categoryId={Number(id)} />;
}