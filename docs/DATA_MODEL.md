# Data Model

The canonical data model is normalized around conversations and messages.

## Core Tables

- `sources`: raw imported files, hashes, parser type, filesystem metadata
- `conversations`: reconstructed chats with title, assistant/source type, date fields, summary
- `messages`: user, assistant, system, tool, and unknown messages
- `code_blocks`: extracted code blocks with language and source message
- `tool_calls`: tool invocation and result records
- `links`: extracted URLs
- `files`: mentioned or attached files
- `tags`: reusable labels
- `conversation_tags`: many-to-many tag mapping
- `attachments`: binary or referenced artifacts
- `embeddings`: future vector/semantic search storage
- `settings`: local preferences

## Date Strategy

Every conversation stores:

- `created_at`
- `modified_at`
- `imported_at`
- `conversation_at`
- `date_confidence`
- `date_source`

Timeline views choose one of:

- Created Date
- Modified Date
- Imported Date
- Conversation Date

Conflict rules are centralized in the timeline service.

