import path from "node:path";

export interface StoragePaths {
  root: string;
  database: string;
  raw: string;
  exports: string;
  backups: string;
  settings: string;
}

export function getStoragePaths(rootOverride = process.env.ARCHIVE_VIEWER_DATA_DIR): StoragePaths {
  const root = rootOverride || path.join(process.cwd(), ".local-data");

  return {
    root,
    database: path.join(root, "archive-viewer.sqlite"),
    raw: path.join(root, "raw"),
    exports: path.join(root, "exports"),
    backups: path.join(root, "backups"),
    settings: path.join(root, "settings.json")
  };
}

