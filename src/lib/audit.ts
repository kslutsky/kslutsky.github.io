import { db } from "@/lib/db";
import { auditLog, authors } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { inArray } from "drizzle-orm";

// Safely serialize Drizzle rows (handles Date objects) for JSONB storage
function toJsonb(row: unknown): Record<string, unknown> {
  return JSON.parse(JSON.stringify(row));
}

interface AuditParams {
  action: string;
  entityType?: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
  userLogin?: string;
  ipAddress?: string;
}

export async function logAudit(params: AuditParams): Promise<void> {
  let login = params.userLogin;
  if (!login) {
    const session = await auth();
    login =
      (session?.user as { login?: string } | undefined)?.login ?? "unknown";
  }

  await db.insert(auditLog).values({
    action: params.action,
    entityType: params.entityType ?? null,
    entityId: params.entityId ?? null,
    before: params.before ? toJsonb(params.before) : null,
    after: params.after ? toJsonb(params.after) : null,
    userLogin: login,
    ipAddress: params.ipAddress ?? null,
  });
}

// Resolve authorIds to names for readable audit snapshots
export async function resolveAuthorNames(
  authorIds: string[]
): Promise<Record<string, string>> {
  if (authorIds.length === 0) return {};
  const rows = await db
    .select({ id: authors.id, name: authors.name })
    .from(authors)
    .where(inArray(authors.id, authorIds));
  const map: Record<string, string> = {};
  for (const r of rows) map[r.id] = r.name;
  return map;
}

// Enrich a snapshot with resolved author names
export function enrichWithAuthors(
  snapshot: Record<string, unknown>,
  authorMap: Record<string, string>
): Record<string, unknown> {
  if (!snapshot.authorIds || !Array.isArray(snapshot.authorIds)) return snapshot;
  return {
    ...snapshot,
    _resolved: {
      authors: (snapshot.authorIds as string[]).map((id) => ({
        id,
        name: authorMap[id] ?? "unknown",
      })),
    },
  };
}
