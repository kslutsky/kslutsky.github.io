"use server";

import { eq, isNull, isNotNull, sql } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { mentees } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth";
import { menteeCreateSchema } from "@/lib/validators/mentee";
import type { ActionResult } from "@/lib/types";

// ---------------------------------------------------------------------------
// Shared ordering
// ---------------------------------------------------------------------------

const menteeOrderBy = [
  sql`CASE category WHEN 'phd' THEN 1 WHEN 'postdoc' THEN 2 WHEN 'masters' THEN 3 WHEN 'undergraduate' THEN 4 END ASC`,
  sql`end_year IS NOT NULL`,
  sql`end_year DESC`,
  sql`start_year DESC`,
] as const;

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function createMentee(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  await requireAuth();

  const parsed = menteeCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const data = parsed.data;

  try {
    const [row] = await db.insert(mentees).values(data).returning({ id: mentees.id });

    if (data.status === "published") {
      revalidateTag("academic");
    }

    return { success: true, data: { id: row.id } };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to create mentee" };
  }
}

export async function updateMentee(
  id: string,
  input: unknown
): Promise<ActionResult> {
  await requireAuth();

  const parsed = menteeCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const data = parsed.data;

  try {
    const result = await db
      .update(mentees)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(mentees.id, id))
      .returning({ id: mentees.id });

    if (result.length === 0) {
      return { success: false, error: "Mentee not found" };
    }

    revalidateTag("academic");
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to update mentee" };
  }
}

export async function softDeleteMentee(id: string): Promise<ActionResult> {
  await requireAuth();

  const now = new Date();

  const result = await db
    .update(mentees)
    .set({ deletedAt: now, updatedAt: now })
    .where(eq(mentees.id, id))
    .returning({ id: mentees.id });

  if (result.length === 0) {
    return { success: false, error: "Mentee not found or already deleted" };
  }

  revalidateTag("academic");
  return { success: true, data: undefined };
}

export async function restoreMentee(id: string): Promise<ActionResult> {
  await requireAuth();

  const result = await db
    .update(mentees)
    .set({ deletedAt: null, updatedAt: new Date() })
    .where(eq(mentees.id, id))
    .returning({ id: mentees.id });

  if (result.length === 0) {
    return { success: false, error: "Mentee not found" };
  }

  revalidateTag("academic");
  return { success: true, data: undefined };
}

export async function toggleMenteeStatus(id: string): Promise<ActionResult> {
  await requireAuth();

  const [mentee] = await db
    .select({ id: mentees.id, status: mentees.status })
    .from(mentees)
    .where(eq(mentees.id, id));

  if (!mentee) {
    return { success: false, error: "Mentee not found" };
  }

  const newStatus = mentee.status === "draft" ? "published" : "draft";

  await db
    .update(mentees)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(mentees.id, id));

  revalidateTag("academic");
  return { success: true, data: undefined };
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getMentees(includeDeleted?: boolean) {
  if (includeDeleted) {
    return db
      .select()
      .from(mentees)
      .where(isNotNull(mentees.deletedAt))
      .orderBy(...menteeOrderBy);
  }

  return db
    .select()
    .from(mentees)
    .where(isNull(mentees.deletedAt))
    .orderBy(...menteeOrderBy);
}

export async function getPublishedMentees() {
  return db
    .select()
    .from(mentees)
    .where(
      sql`${mentees.status} = 'published' AND ${mentees.deletedAt} IS NULL`
    )
    .orderBy(...menteeOrderBy);
}

export async function getMentee(id: string) {
  const [row] = await db.select().from(mentees).where(eq(mentees.id, id));
  return row ?? null;
}
