import crypto from "node:crypto";
import type { ArchiveDatabase } from "@/server/db/connection";
import type { NormalizedConversationBundle } from "@/core/types";

export class ConversationRepository {
  constructor(private readonly db: ArchiveDatabase) {}

  findSourceByHash(contentHash: string) {
    return this.db.prepare("SELECT id FROM sources WHERE content_hash = ?").get(contentHash) as { id: string } | undefined;
  }

  saveBundle(bundle: NormalizedConversationBundle) {
    const sourceId = crypto.randomUUID();
    const conversationId = crypto.randomUUID();
    const importedAt = new Date().toISOString();

    const transaction = this.db.transaction(() => {
      this.db
        .prepare(
          `INSERT INTO sources (
            id, absolute_path, original_name, content_hash, size_bytes, parser_type, parser_version,
            filesystem_created_at, filesystem_modified_at, imported_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          sourceId,
          bundle.source.absolutePath,
          bundle.source.originalName,
          bundle.source.contentHash,
          bundle.source.sizeBytes,
          bundle.source.parserType,
          bundle.source.parserVersion,
          bundle.source.filesystemCreatedAt,
          bundle.source.filesystemModifiedAt,
          importedAt
        );

      this.db
        .prepare(
          `INSERT INTO conversations (
            id, source_id, title, assistant_type, created_at, modified_at, imported_at, conversation_at,
            date_source, date_confidence, message_count, contains_code, contains_tools, summary
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          conversationId,
          sourceId,
          bundle.conversation.title,
          bundle.conversation.assistantType,
          bundle.conversation.createdAt,
          bundle.conversation.modifiedAt,
          importedAt,
          bundle.conversation.conversationAt,
          bundle.conversation.dateSource,
          bundle.conversation.dateConfidence,
          bundle.messages.length,
          bundle.codeBlocks.length > 0 ? 1 : 0,
          bundle.toolCalls.length > 0 ? 1 : 0,
          bundle.conversation.summary
        );

      const messageIds: string[] = [];
      const insertMessage = this.db.prepare(
        `INSERT INTO messages (id, conversation_id, parent_message_id, role, author_name, body, raw_payload_json, ordinal, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
      for (const message of bundle.messages) {
        const id = crypto.randomUUID();
        messageIds.push(id);
        insertMessage.run(
          id,
          conversationId,
          message.parentMessageId,
          message.role,
          message.authorName,
          message.body,
          JSON.stringify(message.rawPayload ?? {}),
          message.ordinal,
          message.createdAt
        );
      }

      const insertCode = this.db.prepare(
        "INSERT INTO code_blocks (id, conversation_id, message_id, language, code, ordinal) VALUES (?, ?, ?, ?, ?, ?)"
      );
      for (const block of bundle.codeBlocks) {
        const messageId = messageIds[Math.floor(block.ordinal / 1000)] ?? messageIds[0];
        insertCode.run(crypto.randomUUID(), conversationId, messageId, block.language, block.code, block.ordinal);
      }

      const insertToolCall = this.db.prepare(
        `INSERT INTO tool_calls (id, conversation_id, message_id, tool_name, input_preview, output_preview, started_at, ended_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      );
      for (const toolCall of bundle.toolCalls) {
        insertToolCall.run(
          crypto.randomUUID(),
          conversationId,
          messageIds[0],
          toolCall.toolName,
          toolCall.inputPreview,
          toolCall.outputPreview,
          toolCall.startedAt,
          toolCall.endedAt
        );
      }

      const insertLink = this.db.prepare("INSERT INTO links (id, conversation_id, message_id, url, host) VALUES (?, ?, ?, ?, ?)");
      for (const link of bundle.links) {
        insertLink.run(crypto.randomUUID(), conversationId, messageIds[0], link.url, link.host);
      }

      const insertFile = this.db.prepare("INSERT INTO files (id, conversation_id, message_id, path, extension) VALUES (?, ?, ?, ?, ?)");
      for (const file of bundle.files) {
        insertFile.run(crypto.randomUUID(), conversationId, messageIds[0], file.path, file.extension);
      }

      const insertFts = this.db.prepare(
        "INSERT INTO message_fts (conversation_id, message_id, title, body, code, files, links) VALUES (?, ?, ?, ?, ?, ?, ?)"
      );
      for (const [index, message] of bundle.messages.entries()) {
        insertFts.run(
          conversationId,
          messageIds[index],
          bundle.conversation.title,
          message.body,
          bundle.codeBlocks.map((block) => block.code).join("\n\n"),
          bundle.files.map((file) => file.path).join("\n"),
          bundle.links.map((link) => link.url).join("\n")
        );
      }
    });

    transaction();
    return { sourceId, conversationId };
  }
}
