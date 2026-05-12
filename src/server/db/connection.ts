import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { getStoragePaths } from "@/core/storage-paths";
import { migrations } from "./schema";

export type ArchiveDatabase = Database.Database;

export function openArchiveDatabase(databasePath = getStoragePaths().database): ArchiveDatabase {
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  const db = new Database(databasePath);
  db.pragma("foreign_keys = ON");
  db.pragma("journal_mode = WAL");
  return db;
}

export function runMigrations(db: ArchiveDatabase) {
  db.exec("CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at TEXT NOT NULL DEFAULT (datetime('now')))");
  const applied = new Set(
    db.prepare("SELECT version FROM schema_migrations").all().map((row) => Number((row as { version: number }).version))
  );

  for (const migration of migrations) {
    if (applied.has(migration.version)) continue;
    const transaction = db.transaction(() => {
      db.exec(migration.sql);
      db.prepare("INSERT INTO schema_migrations (version, name) VALUES (?, ?)").run(migration.version, migration.name);
    });
    transaction();
  }
}

