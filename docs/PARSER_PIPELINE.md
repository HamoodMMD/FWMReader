# Parser Pipeline

The ingestion pipeline is intentionally conservative: raw files are copied or referenced, hashed, parsed into normalized records, and indexed incrementally.

## Steps

1. Discover file through single import, folder scan, recursive scan, drag/drop, or watch mode.
2. Hash file content with SHA-256.
3. Check `sources.content_hash` to avoid duplicate imports.
4. Detect source type with parser probes.
5. Parse with a streaming-friendly parser adapter.
6. Normalize messages, timestamps, tool calls, code blocks, links, and files.
7. Persist source metadata and normalized entities in one transaction.
8. Rebuild FTS rows for changed conversations.

## Parser Contract

Each parser must:

- preserve source identity
- tolerate missing fields
- ignore low-value streaming/cache/token metadata
- emit normalized messages in display order
- return warnings instead of failing on partial corruption when possible

