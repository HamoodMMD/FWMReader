import { resolveConversationDates } from "@/core/date-policy";
import { asArray, asRecord, asString, extractCodeBlocks, extractLinks, extractMentionedFiles, normalizeText, titleFromMessages } from "./helpers";
import type { ArchiveParser, ParserContext, ParserProbeResult } from "./types";

export class GenericChatParser implements ArchiveParser {
  readonly type = "generic" as const;
  readonly version = "1.0.0";

  probe(payload: unknown): ParserProbeResult {
    const record = asRecord(payload);
    const possibleMessages = asArray(record?.messages ?? record?.conversation ?? record?.items ?? payload);
    const matched = possibleMessages.some((item) => {
      const message = asRecord(item);
      return Boolean(message?.role || message?.speaker || message?.content || message?.text);
    });

    return {
      matched,
      confidence: matched ? 0.45 : 0,
      parserType: this.type,
      reason: matched ? "Generic role/content message list detected" : "No generic message list detected"
    };
  }

  parse(payload: unknown, context: ParserContext) {
    const record = asRecord(payload) ?? {};
    const rawMessages = asArray(record.messages ?? record.conversation ?? record.items ?? payload);
    const importedAt = new Date().toISOString();

    const messages = rawMessages
      .map((item, index) => {
        const message = asRecord(item) ?? {};
        return {
          role: String(message.role ?? message.speaker ?? "unknown") as "user" | "assistant" | "system" | "tool" | "unknown",
          authorName: asString(message.author ?? message.name),
          body: normalizeText(message.content ?? message.text ?? message.body),
          rawPayload: message,
          ordinal: index,
          createdAt: asString(message.timestamp ?? message.created_at ?? message.createdAt)
        };
      })
      .filter((message) => message.body.length > 0);

    const dateResolution = resolveConversationDates({
      filesystemCreatedAt: context.filesystemCreatedAt,
      filesystemModifiedAt: context.filesystemModifiedAt,
      payloadCreatedAt: asString(record.created_at ?? record.createdAt),
      payloadUpdatedAt: asString(record.updated_at ?? record.updatedAt),
      firstMessageAt: messages[0]?.createdAt,
      importedAt,
      preference: "prefer-conversation-timestamps"
    });

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
        title: asString(record.title ?? record.name) ?? titleFromMessages(messages, context.originalName),
        assistantType: this.type,
        ...dateResolution
      },
      messages,
      codeBlocks: messages.flatMap((message) => extractCodeBlocks(message, message.ordinal)),
      toolCalls: [],
      links: messages.flatMap(extractLinks),
      files: messages.flatMap(extractMentionedFiles),
      warnings: ["Imported with generic parser; verify timestamps and roles."]
    };
  }
}

