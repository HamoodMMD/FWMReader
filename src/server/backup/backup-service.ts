import fs from "node:fs/promises";
import path from "node:path";
import type { ArchiveDatabase } from "@/server/db/connection";
import { getStoragePaths } from "@/core/storage-paths";

export class BackupService {
  constructor(private readonly db: ArchiveDatabase) {}

  async exportDatabaseBackup() {
    const paths = getStoragePaths();
    await fs.mkdir(paths.backups, { recursive: true });
    const backupPath = path.join(paths.backups, `archive-viewer-${new Date().toISOString().replace(/[:.]/g, "-")}.sqlite`);
    await this.db.backup(backupPath);
    return backupPath;
  }

  async exportSettingsSnapshot(settings: unknown) {
    const paths = getStoragePaths();
    await fs.mkdir(paths.backups, { recursive: true });
    const backupPath = path.join(paths.backups, `settings-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
    await fs.writeFile(backupPath, JSON.stringify(settings, null, 2), "utf8");
    return backupPath;
  }
}

