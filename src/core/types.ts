export type AssistantSource = "claude-code" | "openai-chatgpt" | "generic";

export type MessageRole = "user" | "assistant" | "system" | "tool" | "unknown";

export type TimelineMode = "created" | "modified" | "imported" | "conversation";

export type DatePreference = "prefer-filesystem-modified" | "prefer-conversation-timestamps";

export interface SourceFile {
  id: string;
  absolutePath: string;
  originalName: string;
  contentHash: string;
  sizeBytes: number;
  parserType: AssistantSource;
  parserVersion: string;
  filesystemCreatedAt?: string;
  filesystemModifiedAt?: string;
  importedAt: string;
}

export interface Conversation {
  id: string;
  sourceId: string;
  title: string;
  assistantType: AssistantSource;
  createdAt?: string;
  modifiedAt?: string;
  importedAt: string;
  conversationAt?: string;
  dateSource: "filesystem" | "payload" | "imported" | "mixed";
  dateConfidence: number;
  messageCount: number;
  containsCode: boolean;
  containsTools: boolean;
  summary?: string;
  pinned?: boolean;
  favorite?: boolean;
}

export interface Message {
  id: string;
  conversationId: string;
  parentMessageId?: string;
  role: MessageRole;
  authorName?: string;
  body: string;
  rawPayload?: unknown;
  ordinal: number;
  createdAt?: string;
}

export interface CodeBlock {
  id: string;
  conversationId: string;
  messageId: string;
  language: string;
  code: string;
  ordinal: number;
  exported: boolean;
}

export interface ToolCall {
  id: string;
  conversationId: string;
  messageId?: string;
  toolName: string;
  inputPreview?: string;
  outputPreview?: string;
  startedAt?: string;
  endedAt?: string;
}

export interface ExtractedLink {
  id: string;
  conversationId: string;
  messageId?: string;
  url: string;
  host?: string;
}

export interface MentionedFile {
  id: string;
  conversationId: string;
  messageId?: string;
  path: string;
  extension?: string;
}

export interface NormalizedConversationBundle {
  source: Omit<SourceFile, "id" | "importedAt">;
  conversation: Omit<Conversation, "id" | "sourceId" | "importedAt" | "messageCount" | "containsCode" | "containsTools">;
  messages: Omit<Message, "id" | "conversationId">[];
  codeBlocks: Omit<CodeBlock, "id" | "conversationId" | "messageId" | "exported">[];
  toolCalls: Omit<ToolCall, "id" | "conversationId" | "messageId">[];
  links: Omit<ExtractedLink, "id" | "conversationId" | "messageId">[];
  files: Omit<MentionedFile, "id" | "conversationId" | "messageId">[];
  warnings: string[];
}

