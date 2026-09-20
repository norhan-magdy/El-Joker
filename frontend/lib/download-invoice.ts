import { downloadInvoicePdf, errorMessage } from "@/lib/api";
import { toast } from "sonner";

export async function openInvoicePdf(orderId: string): Promise<void> {
  let blob: Blob;
  try {
    blob = await downloadInvoicePdf(orderId);
  } catch (err) {
    toast.error(errorMessage(err));
    return;
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `invoice-${orderId.slice(0, 8)}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}