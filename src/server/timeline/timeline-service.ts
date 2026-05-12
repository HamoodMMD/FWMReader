import type { Conversation, TimelineMode } from "@/core/types";
import { getTimelineDate } from "@/core/date-policy";

export interface TimelineGroup {
  year: string;
  month: string;
  day: string;
  conversations: Conversation[];
}

export function groupConversationsByDay(conversations: Conversation[], mode: TimelineMode): TimelineGroup[] {
  const groups = new Map<string, TimelineGroup>();

  for (const conversation of conversations) {
    const date = new Date(getTimelineDate(conversation, mode));
    const year = String(date.getFullYear());
    const month = date.toLocaleString("en", { month: "long" });
    const day = date.toISOString().slice(0, 10);
    const key = `${year}-${month}-${day}`;

    const group = groups.get(key) ?? { year, month, day, conversations: [] };
    group.conversations.push(conversation);
    groups.set(key, group);
  }

  return Array.from(groups.values()).sort((a, b) => b.day.localeCompare(a.day));
}

