import { openArchiveDatabase, runMigrations } from "@/server/db/connection";
import { SearchService } from "@/server/search/search-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const db = openArchiveDatabase();
  runMigrations(db);

  try {
    const service = new SearchService(db);
    return Response.json(
      service.search({
        query,
        assistantType: url.searchParams.get("assistant") ?? undefined,
        containsCode: parseBoolean(url.searchParams.get("containsCode")),
        containsTools: parseBoolean(url.searchParams.get("containsTools")),
        dateFrom: url.searchParams.get("from") ?? undefined,
        dateTo: url.searchParams.get("to") ?? undefined
      })
    );
  } finally {
    db.close();
  }
}

function parseBoolean(value: string | null) {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

