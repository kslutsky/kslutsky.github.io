"use server";

import { eq, and, isNull, isNotNull, sql, desc } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { articles, authors, tags } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";
import { articleCreateSchema } from "@/lib/validators/article";
import { logAudit, resolveAuthorNames, enrichWithAuthors } from "@/lib/audit";
import type { ActionResult } from "@/lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function validateRefs(
  authorIds: string[],
  tagIds: string[]
): Promise<string | null> {
  if (authorIds.length > 0) {
    const existingAuthors = await db
      .select({ id: authors.id })
      .from(authors)
      .where(sql`${authors.id} IN (${sql.join(authorIds.map((id) => sql`${id}::uuid`), sql`, `)})`);
    if (existingAuthors.length !== authorIds.length) {
      return "One or more author IDs do not exist";
    }
  }

  if (tagIds.length > 0) {
    const existingTags = await db
      .select({ id: tags.id })
      .from(tags)
      .where(sql`${tags.id} IN (${sql.join(tagIds.map((id) => sql`${id}::uuid`), sql`, `)})`);
    if (existingTags.length !== tagIds.length) {
      return "One or more tag IDs do not exist";
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function createArticle(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  await requireAuth();

  const parsed = articleCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const data = parsed.data;

  // Validate referenced authors and tags exist
  const refError = await validateRefs(data.authorIds, data.tagIds);
  if (refError) {
    return { success: false, error: refError };
  }

  // If erratum, verify parent exists and is not itself an erratum
  if (data.type === "erratum" && data.parentId) {
    const [parent] = await db
      .select({ id: articles.id, type: articles.type })
      .from(articles)
      .where(eq(articles.id, data.parentId));
    if (!parent) {
      return { success: false, error: "Parent article not found" };
    }
    if (parent.type === "erratum") {
      return { success: false, error: "Parent article cannot be an erratum" };
    }
  }

  try {
    const [row] = await db.insert(articles).values(data).returning({ id: articles.id });

    const [newRow] = await db.select().from(articles).where(eq(articles.id, row.id));
    const authorMap = await resolveAuthorNames(data.authorIds);
    await logAudit({
      action: "create",
      entityType: "article",
      entityId: row.id,
      after: enrichWithAuthors(JSON.parse(JSON.stringify(newRow)), authorMap),
    }).catch((err) => console.error("[audit]", err));

    if (data.status === "published") {
      revalidateTag("articles", "max");
    }

    return { success: true, data: { id: row.id } };
  } catch (e) {
    console.error("[createArticle]", e);
    return { success: false, error: "Failed to create article. Please try again." };
  }
}

export async function updateArticle(
  id: string,
  input: unknown
): Promise<ActionResult> {
  await requireAuth();

  const idParsed = z.string().uuid().safeParse(id);
  if (!idParsed.success) return { success: false, error: "Invalid ID" };

  const parsed = articleCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const data = parsed.data;

  // Validate referenced authors and tags exist
  const refError = await validateRefs(data.authorIds, data.tagIds);
  if (refError) {
    return { success: false, error: refError };
  }

  // If erratum, verify parent exists and is not itself an erratum
  if (data.type === "erratum" && data.parentId) {
    const [parent] = await db
      .select({ id: articles.id, type: articles.type })
      .from(articles)
      .where(eq(articles.id, data.parentId));
    if (!parent) {
      return { success: false, error: "Parent article not found" };
    }
    if (parent.type === "erratum") {
      return { success: false, error: "Parent article cannot be an erratum" };
    }
  }

  try {
    const [beforeRow] = await db.select().from(articles).where(eq(articles.id, id));

    const result = await db
      .update(articles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(articles.id, id))
      .returning({ id: articles.id });

    if (result.length === 0) {
      return { success: false, error: "Article not found" };
    }

    const [afterRow] = await db.select().from(articles).where(eq(articles.id, id));
    const authorMap = await resolveAuthorNames([
      ...(beforeRow?.authorIds ?? []),
      ...(data.authorIds ?? []),
    ]);
    await logAudit({
      action: "update",
      entityType: "article",
      entityId: id,
      before: beforeRow
        ? enrichWithAuthors(JSON.parse(JSON.stringify(beforeRow)), authorMap)
        : null,
      after: afterRow
        ? enrichWithAuthors(JSON.parse(JSON.stringify(afterRow)), authorMap)
        : null,
    }).catch((err) => console.error("[audit]", err));

    revalidateTag("articles", "max");
    return { success: true, data: undefined };
  } catch (e) {
    console.error("[updateArticle]", e);
    return { success: false, error: "Failed to update article. Please try again." };
  }
}

export async function softDeleteArticle(id: string): Promise<ActionResult> {
  await requireAuth();

  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) return { success: false, error: "Invalid ID" };

  try {
    const [beforeRow] = await db.select().from(articles).where(eq(articles.id, id));

    const now = new Date();

    // Soft-delete the article itself
    const result = await db
      .update(articles)
      .set({ deletedAt: now, updatedAt: now })
      .where(and(eq(articles.id, id), isNull(articles.deletedAt)))
      .returning({ id: articles.id });

    if (result.length === 0) {
      return { success: false, error: "Article not found or already deleted" };
    }

    // Cascade: soft-delete errata where parentId matches and not already deleted
    await db
      .update(articles)
      .set({ deletedAt: now, updatedAt: now })
      .where(
        and(
          eq(articles.parentId, id),
          isNull(articles.deletedAt)
        )
      );

    const [afterRow] = await db.select().from(articles).where(eq(articles.id, id));
    await logAudit({
      action: "delete",
      entityType: "article",
      entityId: id,
      before: beforeRow,
      after: afterRow,
    }).catch((err) => console.error("[audit]", err));

    revalidateTag("articles", "max");
    return { success: true, data: undefined };
  } catch (e) {
    console.error("[softDeleteArticle]", e);
    return { success: false, error: "Failed to delete article. Please try again." };
  }
}

export async function restoreArticle(id: string): Promise<ActionResult> {
  await requireAuth();

  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) return { success: false, error: "Invalid ID" };

  try {
    // Get the article to restore
    const [article] = await db
      .select({
        id: articles.id,
        type: articles.type,
        parentId: articles.parentId,
        deletedAt: articles.deletedAt,
      })
      .from(articles)
      .where(eq(articles.id, id));

    if (!article || !article.deletedAt) {
      return { success: false, error: "Article not found or not deleted" };
    }

    // If erratum, check that the parent is not in trash
    if (article.type === "erratum" && article.parentId) {
      const [parent] = await db
        .select({ id: articles.id, deletedAt: articles.deletedAt })
        .from(articles)
        .where(eq(articles.id, article.parentId));
      if (parent && parent.deletedAt) {
        return {
          success: false,
          error: "Cannot restore erratum: parent article is in trash",
        };
      }
    }

    const deletedAt = article.deletedAt;

    // Restore the article
    await db
      .update(articles)
      .set({ deletedAt: null, updatedAt: new Date() })
      .where(eq(articles.id, id));

    // Cascade-restore errata that share the EXACT same deletedAt timestamp
    await db
      .update(articles)
      .set({ deletedAt: null, updatedAt: new Date() })
      .where(
        and(
          eq(articles.parentId, id),
          eq(articles.deletedAt, deletedAt)
        )
      );

    const [afterRow] = await db.select().from(articles).where(eq(articles.id, id));
    await logAudit({
      action: "restore",
      entityType: "article",
      entityId: id,
      before: article,
      after: afterRow,
    }).catch((err) => console.error("[audit]", err));

    revalidateTag("articles", "max");
    return { success: true, data: undefined };
  } catch (e) {
    console.error("[restoreArticle]", e);
    return { success: false, error: "Failed to restore article. Please try again." };
  }
}

export async function toggleArticleStatus(
  id: string
): Promise<ActionResult> {
  await requireAuth();

  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) return { success: false, error: "Invalid ID" };

  try {
    const [article] = await db
      .select({ id: articles.id, status: articles.status })
      .from(articles)
      .where(eq(articles.id, id));

    if (!article) {
      return { success: false, error: "Article not found" };
    }

    const newStatus = article.status === "draft" ? "published" : "draft";

    await db
      .update(articles)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(articles.id, id));

    const [afterRow] = await db.select().from(articles).where(eq(articles.id, id));
    await logAudit({
      action: "toggle_status",
      entityType: "article",
      entityId: id,
      before: article,
      after: afterRow,
    }).catch((err) => console.error("[audit]", err));

    revalidateTag("articles", "max");
    return { success: true, data: undefined };
  } catch (e) {
    console.error("[toggleArticleStatus]", e);
    return { success: false, error: "Failed to toggle article status. Please try again." };
  }
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getArticles(includeDeleted?: boolean) {
  await requireAuth();
  if (includeDeleted) {
    return db
      .select()
      .from(articles)
      .where(isNotNull(articles.deletedAt))
      .orderBy(
        sql`${articles.publishedYear} DESC NULLS LAST`,
        sql`${articles.publishedMonth} DESC NULLS LAST`,
        sql`${articles.publishedDay} DESC NULLS LAST`,
        desc(articles.createdAt)
      );
  }

  return db
    .select()
    .from(articles)
    .where(isNull(articles.deletedAt))
    .orderBy(
      sql`${articles.publishedYear} DESC NULLS LAST`,
      sql`${articles.publishedMonth} DESC NULLS LAST`,
      sql`${articles.publishedDay} DESC NULLS LAST`,
      desc(articles.createdAt)
    );
}

export async function getArticle(id: string) {
  await requireAuth();
  const [row] = await db.select().from(articles).where(eq(articles.id, id));
  return row ?? null;
}

export async function getErrata(parentId: string) {
  await requireAuth();
  return db
    .select()
    .from(articles)
    .where(
      and(
        eq(articles.parentId, parentId),
        isNull(articles.deletedAt)
      )
    );
}
