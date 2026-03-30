"use server";

import { eq, and, isNull, isNotNull, sql } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { mentees } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth";
import { menteeCreateSchema } from "@/lib/validators/mentee";
import { logAudit } from "@/lib/audit";
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

    const [newRow] = await db.select().from(mentees).where(eq(mentees.id, row.id));
    await logAudit({
      action: "create",
      entityType: "mentee",
      entityId: row.id,
      after: newRow,
    }).catch((err) => console.error("[audit]", err));

    if (data.status === "published") {
      revalidateTag("academic");
    }

    return { success: true, data: { id: row.id } };
  } catch (e) {
    console.error("[createMentee]", e);
    return { success: false, error: "Failed to create mentee. Please try again." };
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
    const [beforeRow] = await db.select().from(mentees).where(eq(mentees.id, id));

    const result = await db
      .update(mentees)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(mentees.id, id))
      .returning({ id: mentees.id });

    if (result.length === 0) {
      return { success: false, error: "Mentee not found" };
    }

    const [afterRow] = await db.select().from(mentees).where(eq(mentees.id, id));
    await logAudit({
      action: "update",
      entityType: "mentee",
      entityId: id,
      before: beforeRow,
      after: afterRow,
    }).catch((err) => console.error("[audit]", err));

    revalidateTag("academic");
    return { success: true, data: undefined };
  } catch (e) {
    console.error("[updateMentee]", e);
    return { success: false, error: "Failed to update mentee. Please try again." };
  }
}

export async function softDeleteMentee(id: string): Promise<ActionResult> {
  await requireAuth();

  try {
    const [beforeRow] = await db.select().from(mentees).where(eq(mentees.id, id));

    const now = new Date();

    const result = await db
      .update(mentees)
      .set({ deletedAt: now, updatedAt: now })
      .where(and(eq(mentees.id, id), isNull(mentees.deletedAt)))
      .returning({ id: mentees.id });

    if (result.length === 0) {
      return { success: false, error: "Mentee not found or already deleted" };
    }

    const [afterRow] = await db.select().from(mentees).where(eq(mentees.id, id));
    await logAudit({
      action: "delete",
      entityType: "mentee",
      entityId: id,
      before: beforeRow,
      after: afterRow,
    }).catch((err) => console.error("[audit]", err));

    revalidateTag("academic");
    return { success: true, data: undefined };
  } catch (e) {
    console.error("[softDeleteMentee]", e);
    return { success: false, error: "Failed to delete mentee. Please try again." };
  }
}

export async function restoreMentee(id: string): Promise<ActionResult> {
  await requireAuth();

  try {
    const [beforeRow] = await db.select().from(mentees).where(eq(mentees.id, id));

    const result = await db
      .update(mentees)
      .set({ deletedAt: null, updatedAt: new Date() })
      .where(eq(mentees.id, id))
      .returning({ id: mentees.id });

    if (result.length === 0) {
      return { success: false, error: "Mentee not found" };
    }

    const [afterRow] = await db.select().from(mentees).where(eq(mentees.id, id));
    await logAudit({
      action: "restore",
      entityType: "mentee",
      entityId: id,
      before: beforeRow,
      after: afterRow,
    }).catch((err) => console.error("[audit]", err));

    revalidateTag("academic");
    return { success: true, data: undefined };
  } catch (e) {
    console.error("[restoreMentee]", e);
    return { success: false, error: "Failed to restore mentee. Please try again." };
  }
}

export async function toggleMenteeStatus(id: string): Promise<ActionResult> {
  await requireAuth();

  try {
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

    const [afterRow] = await db.select().from(mentees).where(eq(mentees.id, id));
    await logAudit({
      action: "toggle_status",
      entityType: "mentee",
      entityId: id,
      before: mentee,
      after: afterRow,
    }).catch((err) => console.error("[audit]", err));

    revalidateTag("academic");
    return { success: true, data: undefined };
  } catch (e) {
    console.error("[toggleMenteeStatus]", e);
    return { success: false, error: "Failed to toggle mentee status. Please try again." };
  }
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getMentees(includeDeleted?: boolean) {
  await requireAuth();
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
  await requireAuth();
  const [row] = await db.select().from(mentees).where(eq(mentees.id, id));
  return row ?? null;
}
