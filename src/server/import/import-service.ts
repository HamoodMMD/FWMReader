import { constants as fsConstants } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { getStoragePaths } from "@/core/storage-paths";
import type { ArchiveDatabase } from "@/server/db/connection";
import { ConversationRepository } from "@/server/repositories/conversation-repository";
import { defaultParserRegistry } from "@/server/parsers/registry";
import type { ParserContext } from "@/server/parsers/types";
import { hashFile } from "./hash-file";
import { readJsonPayload } from "./json-reader";

export interface ImportResult {
  status: "imported" | "duplicate" | "unsupported" | "failed";
  filePath: string;
  conversationId?: string;
  sourceId?: string;
  reason?: string;
  warnings: string[];
}

export class ImportService {
  private readonly repository: ConversationRepository;

  constructor(private readonly db: ArchiveDatabase) {
    this.repository = new ConversationRepository(db);
  }

  async importJsonFile(filePath: string): Promise<ImportResult> {
    try {
      const stat = await fs.stat(filePath);
      const contentHash = await hashFile(filePath);

      const existing = this.repository.findSourceByHash(contentHash);
      if (existing) {
        return { status: "duplicate", filePath, sourceId: existing.id, reason: "File hash already imported.", warnings: [] };
      }

      const payload = await readJsonPayload(filePath);
      const detected = defaultParserRegistry.detect(payload);
      if (!detected) {
        return { status: "unsupported", filePath, reason: "No parser matched this JSON shape.", warnings: [] };
      }

      const context: ParserContext = {
        absolutePath: path.resolve(filePath),
        originalName: path.basename(filePath),
        contentHash,
        sizeBytes: stat.size,
        filesystemCreatedAt: stat.birthtime.toISOString(),
        filesystemModifiedAt: stat.mtime.toISOString()
      };
      const bundle = detected.parser.parse(payload, context);
      await this.copyRawSource(filePath, contentHash);
      const saved = this.repository.saveBundle(bundle);

      return { status: "imported", filePath, ...saved, warnings: bundle.warnings };
    } catch (error) {
      return {
        status: "failed",
        filePath,
        reason: error instanceof Error ? error.message : "Unknown import failure.",
        warnings: []
      };
    }
  }

  private async copyRawSource(filePath: string, contentHash: string) {
    const paths = getStoragePaths();
    await fs.mkdir(paths.raw, { recursive: true });
    const destination = path.join(paths.raw, `${contentHash}.json`);
    try {
      await fs.copyFile(filePath, destination, fsConstants.COPYFILE_EXCL);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== "EEXIST") throw error;
    }
  }

  async scanFolder(folderPath: string, recursive = true) {
    const results: ImportResult[] = [];
    const entries = await fs.readdir(folderPath, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = path.join(folderPath, entry.name);
      if (entry.isDirectory() && recursive) {
        results.push(...(await this.scanFolder(entryPath, recursive)));
      }
      if (entry.isFile() && entry.name.toLowerCase().endsWith(".json")) {
        results.push(await this.importJsonFile(entryPath));
      }
    }

    return results;
  }
}
