import { openArchiveDatabase, runMigrations } from "@/server/db/connection";
import { ImportService } from "@/server/import/import-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as { filePath?: string; folderPath?: string; recursive?: boolean };
  const db = openArchiveDatabase();
  runMigrations(db);

  try {
    const service = new ImportService(db);
    if (body.filePath) {
      return Response.json(await service.importJsonFile(body.filePath));
    }
    if (body.folderPath) {
      return Response.json(await service.scanFolder(body.folderPath, body.recursive ?? true));
    }
    return Response.json({ error: "Expected filePath or folderPath." }, { status: 400 });
  } finally {
    db.close();
  }
}

