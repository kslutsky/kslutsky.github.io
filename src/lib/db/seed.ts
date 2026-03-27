import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import seedData from "./seed-data.json";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function main() {
  console.log("Seeding database...");

  // 1. Create unique authors from all articles
  const uniqueAuthors = new Map<string, string>(); // name -> id

  // The site owner
  const [owner] = await db
    .insert(schema.authors)
    .values({
      name: "Konstantin Slutsky",
    })
    .returning({ id: schema.authors.id });
  uniqueAuthors.set("Konstantin Slutsky", owner.id);
  console.log(`Created owner author: ${owner.id}`);

  // Extract all unique coauthor names from seed data
  for (const article of seedData) {
    for (const name of article.coauthors ?? []) {
      if (!uniqueAuthors.has(name)) {
        const [author] = await db
          .insert(schema.authors)
          .values({ name })
          .returning({ id: schema.authors.id });
        uniqueAuthors.set(name, author.id);
        console.log(`Created author: ${name} -> ${author.id}`);
      }
    }
  }

  // 2. Insert articles
  for (const article of seedData) {
    const authorIds = [
      owner.id,
      ...(article.coauthors ?? []).map(
        (name: string) => uniqueAuthors.get(name)!,
      ),
    ];

    const [inserted] = await db
      .insert(schema.articles)
      .values({
        type: article.journalName ? "published" : "preprint",
        title: article.title,
        abstract: article.abstract,
        pdfUrl: article.pdfUrl,
        pdfSource: article.pdfUrl?.startsWith("/papers/") ? "upload" : "external",
        journalName: article.journalName ?? null,
        volume: article.volume ?? null,
        issue: article.issue ?? null,
        pages: article.pages ?? null,
        publishedYear: article.year ?? null,
        arxivId: article.arxivId ?? null,
        authorIds,
        tagIds: [],
        status: "published",
      })
      .returning({ id: schema.articles.id });

    console.log(
      `Created article: ${article.title.substring(0, 60)}... -> ${inserted.id}`,
    );
  }

  console.log(`\nSeeding complete! Created ${seedData.length} articles.`);
}

main().catch(console.error);
