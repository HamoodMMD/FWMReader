import type { Conversation, Message } from "@/core/types";

export interface MarkdownExportInput {
  conversation: Conversation;
  messages: Message[];
  includeMetadata?: boolean;
}

export function exportConversationToMarkdown(input: MarkdownExportInput) {
  const { conversation, messages, includeMetadata = true } = input;
  const frontmatter = includeMetadata
    ? [
        "---",
        `title: ${JSON.stringify(conversation.title)}`,
        `assistant_type: ${conversation.assistantType}`,
        `conversation_at: ${conversation.conversationAt ?? ""}`,
        `imported_at: ${conversation.importedAt}`,
        `message_count: ${conversation.messageCount}`,
        "---",
        ""
      ].join("\n")
    : "";

  const body = messages
    .sort((a, b) => a.ordinal - b.ordinal)
    .map((message) => {
      const timestamp = message.createdAt ? ` _${message.createdAt}_` : "";
      return `## ${message.role}${timestamp}\n\n${message.body}`;
    })
    .join("\n\n---\n\n");

  return `${frontmatter}# ${conversation.title}\n\n${body}\n`;
}

export function exportArchiveBook(conversations: MarkdownExportInput[]) {
  return conversations.map(exportConversationToMarkdown).join("\n\n<!-- conversation-boundary -->\n\n");
}

