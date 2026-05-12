# Claude Chat Archive Viewer

A desktop-first, local-first archive browser for Claude Code, ChatGPT, and generic AI assistant JSON conversation exports.

The app turns raw JSON chat logs into a clean, searchable, readable knowledge archive with timeline navigation, reconstructed conversations, code extraction, markdown export, and a privacy-safe storage model.

## Principles

- Local-first by default, with no telemetry and no cloud dependency.
- Raw imported archives are never modified directly.
- Private archives, databases, embeddings, backups, and exports are ignored by Git.
- Parser, storage, indexing, rendering, and AI organization are separate modules.
- SQLite FTS5 is the initial search engine; semantic search is an extension point.

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

For desktop development:

```bash
npm run tauri dev
```

## Project Status

This is the first architecture milestone. It includes:

- Next.js 15 + TypeScript + TailwindCSS app shell
- Tauri desktop wrapper scaffold
- SQLite schema with FTS5 and migration support
- Parser abstraction layer with Claude, OpenAI, and generic parser samples
- Import pipeline design with hashing and duplicate prevention
- Search, timeline, markdown export, backup, and AI extension service interfaces
- Privacy-safe Git defaults and long-term repo documentation

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

