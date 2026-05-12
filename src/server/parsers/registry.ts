import { ClaudeCodeParser } from "./claude-code-parser";
import { GenericChatParser } from "./generic-parser";
import { OpenAIChatParser } from "./openai-parser";
import type { ArchiveParser } from "./types";

export class ParserRegistry {
  constructor(private readonly parsers: ArchiveParser[]) {}

  detect(payload: unknown) {
    const ranked = this.parsers
      .map((parser) => ({ parser, probe: parser.probe(payload) }))
      .filter((result) => result.probe.matched)
      .sort((a, b) => b.probe.confidence - a.probe.confidence);

    return ranked[0];
  }
}

export const defaultParserRegistry = new ParserRegistry([
  new ClaudeCodeParser(),
  new OpenAIChatParser(),
  new GenericChatParser()
]);

