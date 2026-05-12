import type { ArchiveDatabase } from "@/server/db/connection";

export interface SearchFilters {
  query: string;
  assistantType?: string;
  containsCode?: boolean;
  containsTools?: boolean;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}

export class SearchService {
  constructor(private readonly db: ArchiveDatabase) {}

  search(filters: SearchFilters) {
    const limit = filters.limit ?? 50;
    const clauses: string[] = [];
    const params: unknown[] = [];

    if (filters.query.trim().length > 0) {
      clauses.push("message_fts MATCH ?");
      params.push(filters.query);
    }

    if (filters.assistantType) {
      clauses.push("c.assistant_type = ?");
      params.push(filters.assistantType);
    }
    if (typeof filters.containsCode === "boolean") {
      clauses.push("c.contains_code = ?");
      params.push(filters.containsCode ? 1 : 0);
    }
    if (typeof filters.containsTools === "boolean") {
      clauses.push("c.contains_tools = ?");
      params.push(filters.containsTools ? 1 : 0);
    }
    if (filters.dateFrom) {
      clauses.push("coalesce(c.conversation_at, c.imported_at) >= ?");
      params.push(filters.dateFrom);
    }
    if (filters.dateTo) {
      clauses.push("coalesce(c.conversation_at, c.imported_at) <= ?");
      params.push(filters.dateTo);
    }

    params.push(limit);
    const rankExpression = filters.query.trim().length > 0 ? "bm25(message_fts)" : "0";

    return this.db
      .prepare(
        `SELECT c.id, c.title, c.assistant_type as assistantType, c.conversation_at as conversationAt,
                snippet(message_fts, 3, '<mark>', '</mark>', '...', 16) as snippet,
                ${rankExpression} as rank
         FROM message_fts
         JOIN conversations c ON c.id = message_fts.conversation_id
         ${clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : ""}
         ORDER BY rank
         LIMIT ?`
      )
      .all(...params);
  }
}
