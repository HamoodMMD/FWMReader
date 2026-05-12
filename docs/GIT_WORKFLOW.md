# Git Workflow

## First Commit Setup

```bash
git checkout -b codex/initial-archive-viewer
git add .
git commit -m "feat: scaffold local archive viewer"
```

## Branch Strategy

- `main`: stable history
- `codex/*`: Codex-created branches
- `feature/*`: planned feature work
- `experiment/*`: parser, indexing, and AI trials
- `release/*`: release stabilization

## Release Tags

```bash
git tag -a v0.1.0 -m "v0.1.0 initial architecture"
git push origin v0.1.0
```

## Backup Strategy

Before large parser or migration work:

```bash
npm run db:migrate
```

Then use the app backup export before changing schemas. Never commit generated backups.

