import fs from "node:fs";
import path from "node:path";

const initialMigration = fs.readFileSync(
  path.join(process.cwd(), "src", "server", "db", "migrations", "001_initial.sql"),
  "utf8"
);

export const migrations = [
  {
    version: 1,
    name: "initial",
    sql: initialMigration
  }
] as const;
