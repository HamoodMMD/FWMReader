import { migrations } from "../src/server/db/schema";

for (const migration of migrations) {
  console.log(`-- ${migration.version}: ${migration.name}`);
  console.log(migration.sql);
}

