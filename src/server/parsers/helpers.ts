import path from "node:path";
import type { CodeBlock, ExtractedLink, MentionedFile, Message } from "@/core/types";

const codeFencePattern = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
const urlPattern = /\bhttps?:\/\/[^\s<>)"']+/gi;
const filePattern = /(?:^|\s)([A-Za-z]:\\[^\s'"`]+|\/[^\s'"`]+|[\w.-]+\/[\w./-]+\.[A-Za-z0-9]{1,8})/g;

export function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
}

export function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

export function normalizeText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) {
    return value.map(normalizeText).filter(Boolean).join("\n\n");
  }
  const record = asRecord(value);
  if (!record) return "";
  if (typeof record.text === "string") return record.text.trim();
  if (typeof record.content === "string") return record.content.trim();
  if (Array.isArray(record.content)) return normalizeText(record.content);
  return "";
}

export function extractCodeBlocks(message: Pick<Message, "body">, messageOrdinal: number): Omit<CodeBlock, "id" | "conversationId" | "messageId" | "exported">[] {
  const blocks: Omit<CodeBlock, "id" | "conversationId" | "messageId" | "exported">[] = [];
  for (const match of message.body.matchAll(codeFencePattern)) {
    blocks.push({
      language: match[1] || "text",
      code: match[2].trim(),
      ordinal: blocks.length + messageOrdinal * 1000
    });
  }
  return blocks;
}

export function extractLinks(message: Pick<Message, "body">): Omit<ExtractedLink, "id" | "conversationId" | "messageId">[] {
  return Array.from(message.body.matchAll(urlPattern)).map((match) => {
    const url = match[0];
    let host: string | undefined;
    try {
      host = new URL(url).host;
    } catch {
      host = undefined;
    }
    return { url, host };
  });
}

export function extractMentionedFiles(message: Pick<Message, "body">): Omit<MentionedFile, "id" | "conversationId" | "messageId">[] {
  return Array.from(message.body.matchAll(filePattern)).map((match) => {
    const filePath = match[1].trim();
    return {
      path: filePath,
      extension: path.extname(filePath).replace(".", "") || undefined
    };
  });
}

export function titleFromMessages(messages: Array<Pick<Message, "body" | "role">>, fallback: string) {
  const firstUserMessage = messages.find((message) => message.role === "user" && message.body.length > 0);
  if (!firstUserMessage) return fallback;
  return firstUserMessage.body.replace(/\s+/g, " ").slice(0, 90);
}

