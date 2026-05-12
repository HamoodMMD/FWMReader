import { resolveConversationDates } from "@/core/date-policy";
import { asArray, asRecord, asString, extractCodeBlocks, extractLinks, extractMentionedFiles, normalizeText, titleFromMessages } from "./helpers";
import type { ArchiveParser, ParserContext, ParserProbeResult } from "./types";

export class OpenAIChatParser implements ArchiveParser {
  readonly type = "openai-chatgpt" as const;
  readonly version = "1.0.0";

  probe(payload: unknown): ParserProbeResult {
    const record = asRecord(payload);
    const mapping = asRecord(record?.mapping);
    const conversations = asArray(payload);
    const matched = Boolean(mapping) || conversations.some((item) => Boolean(asRecord(item)?.mapping));

    return {
      matched,
      confidence: matched ? 0.88 : 0.05,
      parserType: this.type,
      reason: matched ? "OpenAI export mapping detected" : "No OpenAI mapping detected"
    };
  }

  parse(payload: unknown, context: ParserContext) {
    const root = Array.isArray(payload) ? asRecord(payload[0]) ?? {} : asRecord(payload) ?? {};
    const mapping = asRecord(root.mapping) ?? {};
    const importedAt = new Date().toISOString();

    const messages = Object.values(mapping)
      .map((node, index) => {
        const nodeRecord = asRecord(node) ?? {};
        const message = asRecord(nodeRecord.message) ?? {};
        const author = asRecord(message.author) ?? {};
        const content = asRecord(message.content) ?? {};
        return {
          parentMessageId: asString(nodeRecord.parent),
          role: String(author.role ?? "unknown") as "user" | "assistant" | "system" | "tool" | "unknown",
          authorName: asString(author.name),
          body: normalizeText(content.parts ?? content.text ?? message.content),
          rawPayload: message,
          ordinal: Number(message.create_time ?? index),
          createdAt: typeof message.create_time === "number" ? new Date(message.create_time * 1000).toISOString() : undefined
        };
      })
      .filter((message) => message.body.length > 0)
      .sort((a, b) => a.ordinal - b.ordinal)
      .map((message, index) => ({ ...message, ordinal: index }));

    const dateResolution = resolveConversationDates({
      filesystemCreatedAt: context.filesystemCreatedAt,
      filesystemModifiedAt: context.filesystemModifiedAt,
      payloadCreatedAt: typeof root.create_time === "number" ? new Date(root.create_time * 1000).toISOString() : undefined,
      payloadUpdatedAt: typeof root.update_time === "number" ? new Date(root.update_time * 1000).toISOString() : undefined,
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
        title: asString(root.title) ?? titleFromMessages(messages, context.originalName),
        assistantType: this.type,
        ...dateResolution
      },
      messages,
      codeBlocks: messages.flatMap((message) => extractCodeBlocks(message, message.ordinal)),
      toolCalls: [],
      links: messages.flatMap(extractLinks),
      files: messages.flatMap(extractMentionedFiles),
      warnings: []
    };
  }
}

