"use server";

import { eq, and, isNull, isNotNull, sql } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { courses } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth";
import { courseCreateSchema } from "@/lib/validators/course";
import { logAudit } from "@/lib/audit";
import type { ActionResult } from "@/lib/types";

// ---------------------------------------------------------------------------
// Ordering helper
// ---------------------------------------------------------------------------

const courseOrdering = [
  courses.institution,
  sql`${courses.year} DESC`,
  sql`CASE ${courses.semester} WHEN 'Fall' THEN 1 WHEN 'Summer' THEN 2 WHEN 'Spring' THEN 3 END ASC`,
] as const;

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function createCourse(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  await requireAuth();

  const parsed = courseCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const data = parsed.data;

  try {
    const [row] = await db.insert(courses).values(data).returning({ id: courses.id });

    const [newRow] = await db.select().from(courses).where(eq(courses.id, row.id));
    await logAudit({
      action: "create",
      entityType: "course",
      entityId: row.id,
      after: newRow,
    }).catch((err) => console.error("[audit]", err));

    if (data.status === "published") {
      revalidateTag("academic");
    }

    return { success: true, data: { id: row.id } };
  } catch (e) {
    console.error("[createCourse]", e);
    return { success: false, error: "Failed to create course. Please try again." };
  }
}

export async function updateCourse(
  id: string,
  input: unknown
): Promise<ActionResult> {
  await requireAuth();

  const parsed = courseCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const data = parsed.data;

  try {
    const [beforeRow] = await db.select().from(courses).where(eq(courses.id, id));

    const result = await db
      .update(courses)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(courses.id, id))
      .returning({ id: courses.id });

    if (result.length === 0) {
      return { success: false, error: "Course not found" };
    }

    const [afterRow] = await db.select().from(courses).where(eq(courses.id, id));
    await logAudit({
      action: "update",
      entityType: "course",
      entityId: id,
      before: beforeRow,
      after: afterRow,
    }).catch((err) => console.error("[audit]", err));

    revalidateTag("academic");
    return { success: true, data: undefined };
  } catch (e) {
    console.error("[updateCourse]", e);
    return { success: false, error: "Failed to update course. Please try again." };
  }
}

export async function softDeleteCourse(id: string): Promise<ActionResult> {
  await requireAuth();

  try {
    const [beforeRow] = await db.select().from(courses).where(eq(courses.id, id));

    const now = new Date();

    const result = await db
      .update(courses)
      .set({ deletedAt: now, updatedAt: now })
      .where(and(eq(courses.id, id), isNull(courses.deletedAt)))
      .returning({ id: courses.id });

    if (result.length === 0) {
      return { success: false, error: "Course not found or already deleted" };
    }

    const [afterRow] = await db.select().from(courses).where(eq(courses.id, id));
    await logAudit({
      action: "delete",
      entityType: "course",
      entityId: id,
      before: beforeRow,
      after: afterRow,
    }).catch((err) => console.error("[audit]", err));

    revalidateTag("academic");
    return { success: true, data: undefined };
  } catch (e) {
    console.error("[softDeleteCourse]", e);
    return { success: false, error: "Failed to delete course. Please try again." };
  }
}

export async function restoreCourse(id: string): Promise<ActionResult> {
  await requireAuth();

  try {
    const [beforeRow] = await db.select().from(courses).where(eq(courses.id, id));

    const result = await db
      .update(courses)
      .set({ deletedAt: null, updatedAt: new Date() })
      .where(eq(courses.id, id))
      .returning({ id: courses.id });

    if (result.length === 0) {
      return { success: false, error: "Course not found or not deleted" };
    }

    const [afterRow] = await db.select().from(courses).where(eq(courses.id, id));
    await logAudit({
      action: "restore",
      entityType: "course",
      entityId: id,
      before: beforeRow,
      after: afterRow,
    }).catch((err) => console.error("[audit]", err));

    revalidateTag("academic");
    return { success: true, data: undefined };
  } catch (e) {
    console.error("[restoreCourse]", e);
    return { success: false, error: "Failed to restore course. Please try again." };
  }
}

export async function toggleCourseStatus(id: string): Promise<ActionResult> {
  await requireAuth();

  try {
    const [course] = await db
      .select({ id: courses.id, status: courses.status })
      .from(courses)
      .where(eq(courses.id, id));

    if (!course) {
      return { success: false, error: "Course not found" };
    }

    const newStatus = course.status === "draft" ? "published" : "draft";

    await db
      .update(courses)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(courses.id, id));

    const [afterRow] = await db.select().from(courses).where(eq(courses.id, id));
    await logAudit({
      action: "toggle_status",
      entityType: "course",
      entityId: id,
      before: course,
      after: afterRow,
    }).catch((err) => console.error("[audit]", err));

    revalidateTag("academic");
    return { success: true, data: undefined };
  } catch (e) {
    console.error("[toggleCourseStatus]", e);
    return { success: false, error: "Failed to toggle course status. Please try again." };
  }
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getCourses(includeDeleted?: boolean) {
  await requireAuth();
  if (includeDeleted) {
    return db
      .select()
      .from(courses)
      .where(isNotNull(courses.deletedAt))
      .orderBy(...courseOrdering);
  }

  return db
    .select()
    .from(courses)
    .where(isNull(courses.deletedAt))
    .orderBy(...courseOrdering);
}

export async function getPublishedCourses() {
  return db
    .select()
    .from(courses)
    .where(
      sql`${courses.status} = 'published' AND ${courses.deletedAt} IS NULL`
    )
    .orderBy(...courseOrdering);
}

export async function getCourse(id: string) {
  await requireAuth();
  const [row] = await db.select().from(courses).where(eq(courses.id, id));
  return row ?? null;
}
