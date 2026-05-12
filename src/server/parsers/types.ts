import type { AssistantSource, NormalizedConversationBundle } from "@/core/types";

export interface ParserContext {
  absolutePath: string;
  originalName: string;
  contentHash: string;
  sizeBytes: number;
  filesystemCreatedAt?: string;
  filesystemModifiedAt?: string;
}

export interface ParserProbeResult {
  matched: boolean;
  confidence: number;
  parserType: AssistantSource;
  reason: string;
}

export interface ArchiveParser {
  readonly type: AssistantSource;
  readonly version: string;
  probe(payload: unknown): ParserProbeResult;
  parse(payload: unknown, context: ParserContext): NormalizedConversationBundle;
  parseStream?(filePath: string, context: ParserContext): AsyncIterable<NormalizedConversationBundle>;
}

export class ParserError extends Error {
  constructor(message: string, readonly parserType: AssistantSource, readonly cause?: unknown) {
    super(message);
    this.name = "ParserError";
  }
}
