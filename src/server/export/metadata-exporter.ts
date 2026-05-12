import type { ArchiveDatabase } from "@/server/db/connection";

export class MetadataExporter {
  constructor(private readonly db: ArchiveDatabase) {}

  exportManifest() {
    return {
      exportedAt: new Date().toISOString(),
      schema: 1,
      sources: this.db.prepare("SELECT id, original_name, content_hash, parser_type, parser_version, imported_at FROM sources").all(),
      conversations: this.db
        .prepare(
          `SELECT id, source_id, title, assistant_type, created_at, modified_at, imported_at,
                  conversation_at, date_source, date_confidence, message_count, contains_code, contains_tools
           FROM conversations`
        )
        .all(),
      tags: this.db.prepare("SELECT id, name, color FROM tags").all()
    };
  }
}

