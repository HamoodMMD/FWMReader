import fs from "node:fs";
import path from "node:path";
import type { ImportService } from "./import-service";

export interface WatchFolderSubscription {
  close(): void;
}

export function watchFolder(folderPath: string, importService: ImportService): WatchFolderSubscription {
  const watcher = fs.watch(folderPath, { recursive: true }, async (_eventType, filename) => {
    if (!filename || !filename.toLowerCase().endsWith(".json")) return;
    await importService.importJsonFile(path.join(folderPath, filename));
  });

  return {
    close() {
      watcher.close();
    }
  };
}

