# Backup & Recovery

The app is recoverable even if the database or UI changes.

## Export Types

- Database backup: SQLite copy with WAL checkpoint.
- Metadata export: JSON manifest for sources, conversations, tags, dates, and parser versions.
- Markdown archive export: single conversation, grouped folders, or chronological archive books.
- Settings export: local preferences without private raw chat content unless requested.

## Recovery Strategy

1. Restore the latest SQLite backup if available.
2. If the database is corrupted, rebuild from raw sources recorded in metadata.
3. If parsers change, keep parser version in `sources.parser_version` and reindex selectively.
4. Keep markdown exports as human-readable disaster recovery artifacts.

## Default Private Locations

Development uses `.local-data/` when `ARCHIVE_VIEWER_DATA_DIR` is not set. Production should use the OS application data directory through Tauri.

