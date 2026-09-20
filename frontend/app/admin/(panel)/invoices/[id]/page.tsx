import { InvoiceAdminDetail } from "@/components/admin/InvoiceAdminDetail";

export default async function AdminInvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <InvoiceAdminDetail invoiceId={id} />;
}