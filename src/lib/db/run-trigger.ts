import "dotenv/config";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  await sql`
    CREATE OR REPLACE FUNCTION set_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `;

  await sql`DROP TRIGGER IF EXISTS articles_set_updated_at ON articles`;
  await sql`
    CREATE TRIGGER articles_set_updated_at
      BEFORE UPDATE ON articles
      FOR EACH ROW EXECUTE FUNCTION set_updated_at()
  `;

  await sql`DROP TRIGGER IF EXISTS authors_set_updated_at ON authors`;
  await sql`
    CREATE TRIGGER authors_set_updated_at
      BEFORE UPDATE ON authors
      FOR EACH ROW EXECUTE FUNCTION set_updated_at()
  `;

  console.log("Triggers created successfully");
}

main().catch(console.error);
