import fs from "fs";
import path from "path";
import { db } from "../db";

const runMigrations = async () => {
  const client = await db.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    const migrationsPath = path.join(__dirname, "migrations");

    const files = fs
      .readdirSync(migrationsPath)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const existing = await client.query(
        "SELECT id FROM schema_migrations WHERE name = $1",
        [file]
      );

      if (existing.rowCount && existing.rowCount > 0) {
        console.log(`Skipping ${file}`);
        continue;
      }

      const sql = fs.readFileSync(
        path.join(migrationsPath, file),
        "utf8"
      );

      console.log(`Running ${file}`);

      await client.query("BEGIN");

      try {
        await client.query(sql);

        await client.query(
          "INSERT INTO schema_migrations (name) VALUES ($1)",
          [file]
        );

        await client.query("COMMIT");

        console.log(`Completed ${file}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }

    console.log("All migrations completed");
  } finally {
    client.release();
    await db.end();
  }
};

runMigrations().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});