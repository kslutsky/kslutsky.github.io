"use server";

import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth";
import type { ActionResult } from "@/lib/types";

const ALLOWED_SETTING_KEYS = ["hero_bio"] as const;

export async function getSetting(key: string): Promise<string | null> {
  await requireAuth();

  if (!ALLOWED_SETTING_KEYS.includes(key as (typeof ALLOWED_SETTING_KEYS)[number])) {
    return null;
  }

  const [row] = await db
    .select()
    .from(settings)
    .where(eq(settings.key, key));
  return row?.value ?? null;
}

export async function setSetting(
  key: string,
  value: string
): Promise<ActionResult> {
  await requireAuth();

  if (!ALLOWED_SETTING_KEYS.includes(key as (typeof ALLOWED_SETTING_KEYS)[number])) {
    return { success: false, error: "Invalid setting key" };
  }

  try {
    await db
      .insert(settings)
      .values({ key, value, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value, updatedAt: new Date() },
      });

    revalidateTag("settings");
    return { success: true, data: undefined };
  } catch (e) {
    console.error("[setSetting]", e);
    return {
      success: false,
      error: "Failed to save setting. Please try again.",
    };
  }
}
