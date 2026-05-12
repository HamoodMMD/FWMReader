import { resolveConversationDates } from "@/core/date-policy";
import type { NormalizedConversationBundle } from "@/core/types";
import { asArray, asRecord, asString, extractCodeBlocks, extractLinks, extractMentionedFiles, normalizeText, titleFromMessages } from "./helpers";
import type { ArchiveParser, ParserContext, ParserProbeResult } from "./types";

export class ClaudeCodeParser implements ArchiveParser {
  readonly type = "claude-code" as const;
  readonly version = "1.0.0";

  probe(payload: unknown): ParserProbeResult {
    const record = asRecord(payload);
    const messages = asArray(record?.messages);
    const hasClaudeHints = Boolean(record?.uuid || record?.sessionId || record?.cwd || record?.transcriptPath);
    const hasRoles = messages.some((item) => ["user", "assistant"].includes(String(asRecord(item)?.role)));

    return {
      matched: hasClaudeHints && hasRoles,
      confidence: hasClaudeHints && hasRoles ? 0.92 : 0.1,
      parserType: this.type,
      reason: hasClaudeHints ? "Claude Code session-shaped JSON" : "Missing Claude Code session hints"
    };
  }

  parse(payload: unknown, context: ParserContext): NormalizedConversationBundle {
    const record = asRecord(payload) ?? {};
    const importedAt = new Date().toISOString();
    const sourceMessages = asArray(record.messages);
    const messages = sourceMessages
      .map((entry, index) => {
        const message = asRecord(entry) ?? {};
        const role = String(message.role ?? "unknown") as "user" | "assistant" | "system" | "tool" | "unknown";
        const body = normalizeText(message.content ?? message.message ?? message.text);
        return {
          parentMessageId: asString(message.parentUuid ?? message.parent_message_id),
          role,
          authorName: asString(message.author),
          body,
          rawPayload: message,
          ordinal: index,
          createdAt: asString(message.timestamp ?? message.createdAt)
        };
      })
      .filter((message) => message.body.length > 0);

    const dateResolution = resolveConversationDates({
      filesystemCreatedAt: context.filesystemCreatedAt,
      filesystemModifiedAt: context.filesystemModifiedAt,
      payloadCreatedAt: asString(record.createdAt ?? record.created_at),
      payloadUpdatedAt: asString(record.updatedAt ?? record.updated_at),
      firstMessageAt: messages[0]?.createdAt,
      importedAt,
      preference: "prefer-conversation-timestamps"
    });

    const codeBlocks = messages.flatMap((message) => extractCodeBlocks(message, message.ordinal));
    const links = messages.flatMap(extractLinks);
    const files = messages.flatMap(extractMentionedFiles);

    return {
      source: {
        absolutePath: context.absolutePath,
        originalName: context.originalName,
        contentHash: context.contentHash,
        sizeBytes: context.sizeBytes,
        parserType: this.type,
        parserVersion: this.version,
        filesystemCreatedAt: context.filesystemCreatedAt,
        filesystemModifiedAt: context.filesystemModifiedAt
      },
      conversation: {
        title: asString(record.name ?? record.title) ?? titleFromMessages(messages, context.originalName),
        assistantType: this.type,
        ...dateResolution
      },
      messages,
      codeBlocks,
      toolCalls: [],
      links,
      files,
      warnings: sourceMessages.length !== messages.length ? ["Skipped empty Claude Code messages during normalization."] : []
    };
  }
}

