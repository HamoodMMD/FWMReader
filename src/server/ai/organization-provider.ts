import type { Conversation, Message } from "@/core/types";

export interface LocalOrganizationSuggestion {
  summary?: string;
  tags: string[];
  topics: string[];
  duplicateOfConversationId?: string;
}

export interface OrganizationProvider {
  readonly id: string;
  readonly localOnly: boolean;
  summarize(conversation: Conversation, messages: Message[]): Promise<LocalOrganizationSuggestion>;
}

export class DisabledOrganizationProvider implements OrganizationProvider {
  readonly id = "disabled";
  readonly localOnly = true;

  async summarize(): Promise<LocalOrganizationSuggestion> {
    return { tags: [], topics: [] };
  }
}

