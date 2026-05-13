# FWM's Claude Chat Archive Viewer

FWM's local-first desktop archive viewer for Claude Code, ChatGPT, and AI assistant JSON/JSONL exports.

The app turns raw JSON chat logs into a clean, searchable, readable knowledge archive with timeline navigation, reconstructed conversations, code extraction, markdown export, and a privacy-safe storage model.

GitHub repo description:

> FWM's local-first desktop archive viewer for Claude Code, ChatGPT, and AI assistant JSON/JSONL exports with timeline browsing, code extraction, markdown export, and privacy-safe storage.

## Principles

- Local-first by default, with no telemetry and no cloud dependency.
- Raw imported archives are never modified directly.
- Private archives, databases, embeddings, backups, and exports are ignored by Git.
- Parser, storage, indexing, rendering, and AI organization are separate modules.
- SQLite FTS5 is the initial search engine; semantic search is an extension point.

## Getting Started

```bash
npm install
npm run serve
```

Open `http://127.0.0.1:3000`.

Use the fast local validation workflow:

```bash
npm run update
```

`npm run update` runs TypeScript and ESLint checks without invoking a production build.

For desktop development:

```bash
npm run tauri dev
```

## Project Status

Current local app capabilities include:

- Next.js 15 + TypeScript + TailwindCSS app shell
- Tauri desktop wrapper scaffold
- SQLite schema with FTS5 and migration support
- Parser abstraction layer with Claude, OpenAI, and generic parser samples
- JSON, JSONL, NDJSON, and folder import with hashing and duplicate prevention
- Dynamic timeline navigation from imported conversation dates
- Reconstructed reader view with hide/show controls for timestamps, memory context, thinking, tool calls, tool results, signatures, metadata, and tags
- Search across imported message bodies, code snippets, entities, tags, titles, sources, dates, and raw preview fallback
- Code Explorer for fenced code blocks
- Markdown export that respects visibility filters
- Local refresh persistence through browser IndexedDB, with a user-facing enable/disable toggle
- Activity page with archive totals, content mix, source breakdown, largest conversations, and compact monthly heatmaps
- Provider-location help modal for finding common local AI assistant chat archives
- Search, timeline, markdown export, backup, and AI extension service interfaces
- Privacy-safe Git defaults and long-term repo documentation

## Provider Chat Locations

These are common local starting points for finding AI assistant archives. Importing or scanning reads files into the app; it does not modify the original files or change their filesystem modified dates.

| Provider | Data Location | What You Get |
| --- | --- | --- |
| Claude Code | `~/.claude/projects/` | Full conversation history, tool use, thinking, costs |
| Gemini CLI | `~/.gemini/history/` | Conversation history with tool calls |
| Antigravity | `~/.gemini/antigravity/` | Conversation state under `brain/` plus token monitor data under `.token-monitor/rpc-cache/v1/` |
| Codex CLI | `~/.codex/sessions/` | Session rollouts with agent responses |
| Cline | `~/.cline/tasks/` | Task-based conversation history |
| Cursor | `~/.cursor/` | Composer and chat conversations |
| Aider | Project directories | Chat history and edit logs |
| OpenCode | `~/.local/share/opencode/` | Conversation sessions and tool results |
| ForgeCode | `~/.forge/.forge.db` | Conversation history from SQLite database |

## Privacy And Persistence

The app is local-first. Imported archives can be persisted in the current browser profile using the **Keep archive after refresh** setting. This stores the app's local parsed snapshot in IndexedDB, not in Git.

Raw imported JSON, JSONL, NDJSON, databases, generated exports, backups, and embeddings are ignored by `.gitignore` by default.

## Private Data Safety

Do not place real chat exports inside tracked source folders. Use the app import flow or a local ignored directory such as `.local-data/imports`.

Ignored by default:

- `.local-data/`
- `archives/`
- `imports/`
- `exports/`
- `backups/`
- `*.db`, `*.sqlite`, `*.jsonl`, raw common chat export names

See [Backup & Recovery](docs/BACKUP_RECOVERY.md) and [Git Workflow](docs/GIT_WORKFLOW.md).
