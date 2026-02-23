import { readdirSync, readFileSync } from "fs";
import { Pool } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set. Add it to .env.local or export it.");
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function run() {
  const schemaSQL = readFileSync("db/schema.sql", "utf-8");
  const seedSQL = readFileSync("db/seed.sql", "utf-8");

  console.log("Applying schema...");
  await pool.query(schemaSQL);
  console.log("Schema applied.");

  console.log("Applying seed data...");
  await pool.query(seedSQL);
  console.log("Seed data applied.");

  // Apply migrations in order (idempotent for existing DBs)
  const migrationDir = "db/migrations";
  try {
    const files = readdirSync(migrationDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const sql = readFileSync(`${migrationDir}/${file}`, "utf-8");
      console.log(`Applying migration: ${file}...`);
      try {
        await pool.query(sql);
        console.log(`  Applied: ${file}`);
      } catch (err) {
        // Migrations may fail on fresh DB if schema already includes the change
        console.log(`  Skipped (already applied or conflict): ${file} — ${err.message}`);
      }
    }
  } catch {
    console.log("No migrations directory found, skipping.");
  }

  await pool.end();
  console.log("Done.");
}

run().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
