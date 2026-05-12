import type { Conversation, DatePreference, TimelineMode } from "./types";

export interface DateResolutionInput {
  filesystemCreatedAt?: string;
  filesystemModifiedAt?: string;
  payloadCreatedAt?: string;
  payloadUpdatedAt?: string;
  firstMessageAt?: string;
  importedAt: string;
  preference: DatePreference;
}

export interface DateResolution {
  createdAt?: string;
  modifiedAt?: string;
  conversationAt?: string;
  dateSource: Conversation["dateSource"];
  dateConfidence: number;
}

export function resolveConversationDates(input: DateResolutionInput): DateResolution {
  const payloadConversationAt = input.firstMessageAt ?? input.payloadCreatedAt ?? input.payloadUpdatedAt;
  const filesystemConversationAt = input.filesystemModifiedAt ?? input.filesystemCreatedAt;
  const prefersFilesystem = input.preference === "prefer-filesystem-modified";

  const conversationAt = prefersFilesystem
    ? filesystemConversationAt ?? payloadConversationAt ?? input.importedAt
    : payloadConversationAt ?? filesystemConversationAt ?? input.importedAt;

  const hasPayload = Boolean(payloadConversationAt);
  const hasFilesystem = Boolean(filesystemConversationAt);

  return {
    createdAt: input.payloadCreatedAt ?? input.filesystemCreatedAt,
    modifiedAt: input.payloadUpdatedAt ?? input.filesystemModifiedAt,
    conversationAt,
    dateSource: hasPayload && hasFilesystem ? "mixed" : hasPayload ? "payload" : hasFilesystem ? "filesystem" : "imported",
    dateConfidence: conversationAt === input.importedAt ? 0.35 : hasPayload && hasFilesystem ? 0.9 : 0.72
  };
}

export function getTimelineDate(conversation: Conversation, mode: TimelineMode) {
  if (mode === "created") return conversation.createdAt ?? conversation.importedAt;
  if (mode === "modified") return conversation.modifiedAt ?? conversation.importedAt;
  if (mode === "conversation") return conversation.conversationAt ?? conversation.importedAt;
  return conversation.importedAt;
}

