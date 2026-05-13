import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

type MessageKind = "text" | "thinking" | "tool_use" | "tool_result" | "signature" | "metadata";

interface ConversationMessage {
  role: string;
  time: string;
  body: string;
  kind: MessageKind;
}

interface PreviewConversation {
  id: string;
  sourceKey: string;
  title: string;
  date: string;
  source: string;
  count: number;
  code: number;
  tools: number;
  favorite: boolean;
  pinned: boolean;
  excerpt: string;
  imported: boolean;
  rawPreview: string;
  rawText: string;
  messages: ConversationMessage[];
}

export async function POST(request: Request) {
  const body = (await request.json()) as { folderPath?: string };
  if (!body.folderPath) {
    return Response.json({ error: "folderPath is required" }, { status: 400 });
  }

  try {
    const stat = await fs.stat(body.folderPath);
    if (!stat.isDirectory()) {
      return Response.json({ error: "Path is not a folder" }, { status: 400 });
    }

    const files = await findArchiveFiles(body.folderPath);
    const conversations: PreviewConversation[] = [];

    for (const filePath of files) {
      try {
        const fileStat = await fs.stat(filePath);
        const text = await fs.readFile(filePath, "utf8");
        const payload = parseImportPayload(text, filePath);
        conversations.push(summarizeImportedJson(payload, path.basename(filePath), text, `${filePath}:${fileStat.size}:${simpleHash(text)}`));
      } catch {
        // Skip unreadable or malformed files; the UI reports the imported count.
      }
    }

    return Response.json({ conversations, filesScanned: files.length });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to scan folder" },
      { status: 500 }
    );
  }
}

async function findArchiveFiles(folderPath: string): Promise<string[]> {
  const entries = await fs.readdir(folderPath, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const entryPath = path.join(folderPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await findArchiveFiles(entryPath)));
    } else if (/\.(json|jsonl|ndjson)$/i.test(entry.name)) {
      files.push(entryPath);
    }
  }

  return files;
}

function parseImportPayload(text: string, fileName: string) {
  if (fileName.toLowerCase().endsWith(".jsonl") || fileName.toLowerCase().endsWith(".ndjson")) {
    return text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line) as unknown);
  }

  return JSON.parse(text) as unknown;
}

function summarizeImportedJson(payload: unknown, fileName: string, rawText: string, sourceKey: string): PreviewConversation {
  const record = asRecord(payload) ?? {};
  const messages = extractConversationMessages(payload);
  const id = crypto.randomUUID();
  const title = typeof record.title === "string" ? record.title : fileName.replace(/\.(jsonl|ndjson|json)$/i, "");
  const code = extractCodeSnippetsFromMessages(messages).length;

  return {
    id,
    sourceKey,
    title,
    date: findFirstTimestamp(payload) ?? new Date().toISOString().slice(0, 10),
    source: detectSourceLabel(payload),
    count: messages.length,
    code,
    tools: rawText.toLowerCase().includes("tool") ? 1 : 0,
    favorite: false,
    pinned: false,
    imported: true,
    messages,
    rawPreview: rawText.slice(0, 3000),
    rawText,
    excerpt: `Imported from ${fileName}.`
  };
}

function extractConversationMessages(payload: unknown): ConversationMessage[] {
  return getMessageArray(payload)
    .filter(isDisplayMessageRecord)
    .flatMap((item, index) => {
      const record = asRecord(item);
      const nestedMessage = asRecord(record?.message);
      const author = asRecord(record?.author) ?? asRecord(nestedMessage?.author);
      const role = String(record?.role ?? nestedMessage?.role ?? author?.role ?? record?.speaker ?? record?.author_role ?? record?.type ?? `message ${index + 1}`);
      const blocks = getContentBlocks(item);
      const time = findFirstTimeLabel(item) ?? String(index + 1).padStart(2, "0");

      return blocks.map((block) => ({
        role,
        time,
        body: normalizeMessageText(block),
        kind: getMessageKind(block, role)
      }));
    })
    .filter((message) => message.body.trim().length > 0);
}

function isDisplayMessageRecord(item: unknown) {
  const record = asRecord(item);
  if (!record) return true;
  const type = String(record.type ?? "").toLowerCase();
  if (["queue-operation", "attachment", "last-prompt"].includes(type)) return false;
  if (type && !["user", "assistant", "system", "tool", "message", "thinking", "tool_use", "tool_result"].includes(type)) return false;
  return Boolean(record.message ?? record.content ?? record.text ?? record.body ?? record.thinking ?? record.signature ?? record.input ?? record.result);
}

function getContentBlocks(item: unknown): unknown[] {
  const record = asRecord(item);
  const nestedMessage = asRecord(record?.message);
  const content = nestedMessage?.content ?? record?.content;

  if (Array.isArray(content)) return content;
  if (content !== undefined) return [content];
  if (record?.text !== undefined) return [record.text];
  if (record?.body !== undefined) return [record.body];
  if (nestedMessage) return [nestedMessage];
  return [item];
}

function getMessageArray(payload: unknown): unknown[] {
  const record = asRecord(payload);
  if (Array.isArray(record?.messages)) return record.messages;
  if (Array.isArray(record?.conversation)) return record.conversation;
  if (Array.isArray(record?.items)) return record.items;
  if (Array.isArray(payload)) return payload;
  const mapping = asRecord(record?.mapping);
  if (mapping) return Object.values(mapping).map((value) => asRecord(value)?.message ?? value).filter(Boolean);
  return [payload];
}

function normalizeMessageText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.map(normalizeMessageText).filter(Boolean).join("\n\n");
  const record = asRecord(value);
  if (!record) return JSON.stringify(value, null, 2);
  const type = String(record.type ?? "").toLowerCase();

  if (type === "thinking") {
    return typeof record.thinking === "string" && record.thinking.trim() ? record.thinking.trim() : "[thinking block]";
  }
  if (type === "tool_use") {
    return formatToolUse(record);
  }
  if (type === "tool_result") {
    return normalizeMessageText(record.content ?? record.result ?? record.output ?? "[tool result]");
  }
  if (record.signature && !record.text && !record.content) return "[signature block]";
  if (typeof record.text === "string") return record.text.trim();
  if (typeof record.content === "string") return record.content.trim();
  if (Array.isArray(record.parts)) return record.parts.map(normalizeMessageText).join("\n\n");
  if (Array.isArray(record.content)) return record.content.map(normalizeMessageText).join("\n\n");
  if (record.name && record.input) return formatToolUse(record);
  return JSON.stringify(record, null, 2);
}

function formatToolUse(record: Record<string, unknown>) {
  const name = typeof record.name === "string" ? record.name : "tool";
  const input = record.input !== undefined ? JSON.stringify(record.input, null, 2) : "{}";
  return `Tool call: ${name}\nInput:\n${input}`;
}

function getMessageKind(value: unknown, role?: string): MessageKind {
  const record = asRecord(value);
  const type = String(record?.type ?? "").toLowerCase();
  const normalizedRole = String(role ?? "").toLowerCase();

  if (["queue-operation", "attachment", "last-prompt"].includes(type)) return "metadata";
  if (type === "thinking") return "thinking";
  if (type === "tool_use") return "tool_use";
  if (type === "tool_result" || normalizedRole === "tool") return "tool_result";
  if (record?.signature) return "signature";
  if (record?.name && record.input) return "tool_use";
  return "text";
}

function extractCodeSnippetsFromMessages(messages: ConversationMessage[]) {
  const pattern = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  return messages.flatMap((message) => Array.from(message.body.matchAll(pattern)));
}

function findFirstTimestamp(value: unknown): string | undefined {
  const text = JSON.stringify(value);
  const iso = text.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?/);
  if (iso) return iso[0].slice(0, 10);
  const dateOnly = text.match(/\d{4}-\d{2}-\d{2}/);
  return dateOnly?.[0];
}

function findFirstTimeLabel(value: unknown): string | undefined {
  const text = JSON.stringify(value);
  const iso = text.match(/\d{4}-\d{2}-\d{2}T(\d{2}:\d{2}):\d{2}(?:\.\d+)?Z?/);
  return iso?.[1];
}

function detectSourceLabel(payload: unknown) {
  const text = JSON.stringify(payload).slice(0, 3000).toLowerCase();
  if (text.includes("claude") || text.includes("sessionid")) return "Claude Code";
  if (text.includes("mapping") && text.includes("chatgpt")) return "ChatGPT";
  if (text.includes("mapping")) return "OpenAI";
  return "Generic";
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
}

function simpleHash(text: string) {
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) | 0;
  }
  return String(hash);
}
