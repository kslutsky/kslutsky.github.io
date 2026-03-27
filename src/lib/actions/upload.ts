"use server";

import { put, del } from "@vercel/blob";
import { requireAuth } from "@/lib/auth";
import type { ActionResult } from "@/lib/types";

export async function uploadPdf(
  formData: FormData
): Promise<ActionResult<{ url: string }>> {
  await requireAuth();
  const file = formData.get("file") as File | null;
  if (!file) return { success: false, error: "No file provided" };
  if (file.type !== "application/pdf")
    return { success: false, error: "Only PDF files are allowed" };

  const blob = await put(`papers/${file.name}`, file, {
    access: "public",
    addRandomSuffix: true,
  });
  return { success: true, data: { url: blob.url } };
}

export async function deletePdf(url: string): Promise<ActionResult> {
  await requireAuth();
  await del(url);
  return { success: true, data: undefined };
}
