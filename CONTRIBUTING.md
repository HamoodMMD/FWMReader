# Contributing

Claude Chat Archive Viewer is designed as a serious local-first knowledge tool. Keep changes modular, reversible, and privacy-safe.

## Development

```bash
npm install
npm run typecheck
npm run lint
npm run dev
```

## Commit Style

Use semantic commits:

- `feat:` user-visible capability
- `fix:` bug fix
- `refactor:` internal restructuring
- `perf:` performance improvement
- `docs:` documentation
- `chore:` repository or tooling maintenance

## Branching

- `main`: stable, release-ready history
- `codex/*`: implementation branches created by Codex
- `feature/*`: user-authored feature branches
- `experiment/*`: parser/indexing/AI experiments that may be rebased or discarded

## Privacy

Never commit user archives, imported JSON, databases, embeddings, generated exports, or backups. If a test needs fixture data, use synthetic files under `tests/fixtures`.

