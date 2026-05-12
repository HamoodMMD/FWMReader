PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY,
  absolute_path TEXT NOT NULL,
  original_name TEXT NOT NULL,
  content_hash TEXT NOT NULL UNIQUE,
  size_bytes INTEGER NOT NULL,
  parser_type TEXT NOT NULL,
  parser_version TEXT NOT NULL,
  filesystem_created_at TEXT,
  filesystem_modified_at TEXT,
  imported_at TEXT NOT NULL,
  raw_storage_path TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  assistant_type TEXT NOT NULL,
  created_at TEXT,
  modified_at TEXT,
  imported_at TEXT NOT NULL,
  conversation_at TEXT,
  date_source TEXT NOT NULL,
  date_confidence REAL NOT NULL DEFAULT 0,
  message_count INTEGER NOT NULL DEFAULT 0,
  contains_code INTEGER NOT NULL DEFAULT 0,
  contains_tools INTEGER NOT NULL DEFAULT 0,
  summary TEXT,
  pinned INTEGER NOT NULL DEFAULT 0,
  favorite INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  parent_message_id TEXT REFERENCES messages(id) ON DELETE SET NULL,
  role TEXT NOT NULL,
  author_name TEXT,
  body TEXT NOT NULL,
  raw_payload_json TEXT,
  ordinal INTEGER NOT NULL,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS code_blocks (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  code TEXT NOT NULL,
  ordinal INTEGER NOT NULL,
  exported INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tool_calls (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  message_id TEXT REFERENCES messages(id) ON DELETE SET NULL,
  tool_name TEXT NOT NULL,
  input_preview TEXT,
  output_preview TEXT,
  started_at TEXT,
  ended_at TEXT
);

CREATE TABLE IF NOT EXISTS links (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  message_id TEXT REFERENCES messages(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  host TEXT
);

CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  message_id TEXT REFERENCES messages(id) ON DELETE SET NULL,
  path TEXT NOT NULL,
  extension TEXT
);

CREATE TABLE IF NOT EXISTS attachments (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  message_id TEXT REFERENCES messages(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  mime_type TEXT,
  local_path TEXT,
  content_hash TEXT
);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT
);

CREATE TABLE IF NOT EXISTS conversation_tags (
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (conversation_id, tag_id)
);

CREATE TABLE IF NOT EXISTS embeddings (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  message_id TEXT REFERENCES messages(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  vector BLOB NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE VIRTUAL TABLE IF NOT EXISTS message_fts USING fts5(
  conversation_id UNINDEXED,
  message_id UNINDEXED,
  title,
  body,
  code,
  files,
  links,
  tokenize = 'porter unicode61'
);

CREATE INDEX IF NOT EXISTS idx_conversations_conversation_at ON conversations(conversation_at);
CREATE INDEX IF NOT EXISTS idx_conversations_imported_at ON conversations(imported_at);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_ordinal ON messages(conversation_id, ordinal);
CREATE INDEX IF NOT EXISTS idx_code_blocks_language ON code_blocks(language);
CREATE INDEX IF NOT EXISTS idx_sources_hash ON sources(content_hash);

