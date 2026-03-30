"use server";

import { put, del } from "@vercel/blob";
import { requireAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import type { ActionResult } from "@/lib/types";

const MAX_PDF_BYTES = 25 * 1024 * 1024;

export async function uploadPdf(
  formData: FormData
): Promise<ActionResult<{ url: string }>> {
  await requireAuth();
  const file = formData.get("file") as File | null;
  if (!file) return { success: false, error: "No file provided" };

  // Size check
  if (file.size > MAX_PDF_BYTES) {
    return { success: false, error: "File exceeds 25 MB limit" };
  }

  // Magic byte check: first 4 bytes must be %PDF (0x25 0x50 0x44 0x46)
  const header = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  if (
    header[0] !== 0x25 ||
    header[1] !== 0x50 ||
    header[2] !== 0x44 ||
    header[3] !== 0x46
  ) {
    return { success: false, error: "File does not appear to be a valid PDF" };
  }

  const blob = await put(`papers/${file.name}`, file, {
    access: "public",
    addRandomSuffix: true,
  });

  await logAudit({
    action: "upload_pdf",
    entityType: "pdf",
    entityId: blob.url,
    after: { url: blob.url, filename: file.name },
  }).catch((err) => console.error("[audit]", err));

  return { success: true, data: { url: blob.url } };
}

export async function deletePdf(url: string): Promise<ActionResult> {
  await requireAuth();

  // Validate URL before deleting
  if (url.startsWith("/papers/")) {
    // Relative path to a local paper — allowed
  } else {
    try {
      const parsed = new URL(url);
      if (!parsed.hostname.endsWith(".public.blob.vercel-storage.com")) {
        return { success: false, error: "Invalid blob URL" };
      }
    } catch {
      return { success: false, error: "Invalid blob URL" };
    }
  }

  await logAudit({
    action: "delete_pdf",
    entityType: "pdf",
    entityId: url,
    before: { url },
  }).catch((err) => console.error("[audit]", err));

  await del(url);
  return { success: true, data: undefined };
}
