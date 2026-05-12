# Project Structure

```text
src/
  app/                 Next.js app router and local API routes
  components/          Shared UI primitives and app shell components
  core/                Domain types and pure policy utilities
  features/            Feature-oriented UI modules
  server/              Node services, repositories, parsers, migrations
  styles/              Optional shared style modules
src-tauri/             Tauri desktop wrapper
scripts/               Developer scripts
docs/                  Architecture and operating documentation
tests/fixtures/        Synthetic parser fixtures only
```

Private data lives outside source tracking by default in `.local-data/` or OS app data.

