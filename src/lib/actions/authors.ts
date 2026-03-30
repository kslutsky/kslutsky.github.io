"use server";

import { eq, sql } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { authors, articles } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth";
import { authorCreateSchema } from "@/lib/validators/author";
import { logAudit } from "@/lib/audit";
import type { ActionResult } from "@/lib/types";

export async function createAuthor(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  await requireAuth();

  const parsed = authorCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const [row] = await db.insert(authors).values(parsed.data).returning({ id: authors.id });

  const [newRow] = await db.select().from(authors).where(eq(authors.id, row.id));
  await logAudit({
    action: "create",
    entityType: "author",
    entityId: row.id,
    after: newRow,
  }).catch((err) => console.error("[audit]", err));

  return { success: true, data: { id: row.id } };
}

export async function updateAuthor(
  id: string,
  input: unknown
): Promise<ActionResult> {
  await requireAuth();

  const parsed = authorCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const [beforeRow] = await db.select().from(authors).where(eq(authors.id, id));

  const result = await db
    .update(authors)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(authors.id, id))
    .returning({ id: authors.id });

  if (result.length === 0) {
    return { success: false, error: "Author not found" };
  }

  const [afterRow] = await db.select().from(authors).where(eq(authors.id, id));
  await logAudit({
    action: "update",
    entityType: "author",
    entityId: id,
    before: beforeRow,
    after: afterRow,
  }).catch((err) => console.error("[audit]", err));

  revalidateTag("articles");
  return { success: true, data: undefined };
}

export async function deleteAuthor(id: string): Promise<ActionResult> {
  await requireAuth();

  // Check referential integrity: any articles referencing this author?
  const refs = await db
    .select({ id: articles.id })
    .from(articles)
    .where(sql`${articles.authorIds} @> ARRAY[${id}]::uuid[]`)
    .limit(1);

  if (refs.length > 0) {
    return {
      success: false,
      error: "This author is in use and cannot be deleted.",
    };
  }

  const [beforeRow] = await db.select().from(authors).where(eq(authors.id, id));

  const result = await db
    .delete(authors)
    .where(eq(authors.id, id))
    .returning({ id: authors.id });

  if (result.length === 0) {
    return { success: false, error: "Author not found" };
  }

  await logAudit({
    action: "delete",
    entityType: "author",
    entityId: id,
    before: beforeRow,
  }).catch((err) => console.error("[audit]", err));

  return { success: true, data: undefined };
}

export async function getAuthors() {
  await requireAuth();
  return db.select().from(authors).orderBy(authors.name);
}

export async function getAuthor(id: string) {
  await requireAuth();
  const [row] = await db.select().from(authors).where(eq(authors.id, id));
  return row ?? null;
}
