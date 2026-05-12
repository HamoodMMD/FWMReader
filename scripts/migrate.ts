import { openArchiveDatabase, runMigrations } from "../src/server/db/connection";

const db = openArchiveDatabase();
try {
  runMigrations(db);
  console.log("Database migrations applied.");
} finally {
  db.close();
}

