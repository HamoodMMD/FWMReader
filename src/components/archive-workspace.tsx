"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Archive,
  CalendarDays,
  ChevronDown,
  Code2,
  Command,
  DatabaseBackup,
  FileJson,
  Files,
  FolderSearch,
  GitBranch,
  History,
  Import,
  Link2,
  Moon,
  Pin,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Tags,
  TerminalSquare
} from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const conversations = [
  {
    id: "1",
    title: "Streaming parser for Claude Code exports",
    date: "2026-05-12",
    source: "Claude Code",
    count: 42,
    code: 8,
    tools: 5,
    favorite: true,
    excerpt: "Design an ingestion pipeline that handles very large JSON files without loading every branch into memory."
  },
  {
    id: "2",
    title: "ChatGPT research archive cleanup",
    date: "2026-05-11",
    source: "ChatGPT",
    count: 19,
    code: 2,
    tools: 0,
    favorite: false,
    excerpt: "Convert exported conversations into a chronological markdown book with frontmatter and separators."
  },
  {
    id: "3",
    title: "SQLite FTS5 ranking notes",
    date: "2026-05-10",
    source: "Generic",
    count: 31,
    code: 3,
    tools: 1,
    favorite: false,
    excerpt: "Compare exact text search, filters, snippets, and future semantic search provider interfaces."
  }
];

const messages = [
  {
    role: "user",
    time: "10:14",
    body: "Build the import pipeline so raw JSON is never modified and duplicate imports are detected by hash."
  },
  {
    role: "assistant",
    time: "10:17",
    body:
      "The import service should hash the source file first, detect the parser, normalize the conversation, then persist everything in a single transaction. Parser warnings are stored alongside the import result instead of breaking the whole archive."
  },
  {
    role: "assistant",
    time: "10:21",
    body: "```ts\nexport interface ArchiveParser {\n  readonly type: AssistantSource;\n  readonly version: string;\n  probe(payload: unknown): ParserProbeResult;\n  parse(payload: unknown, context: ParserContext): NormalizedConversationBundle;\n}\n```"
  }
];

const timeline = [
  { year: "2026", month: "May", days: ["2026-05-12", "2026-05-11", "2026-05-10"] },
  { year: "2026", month: "April", days: ["2026-04-28", "2026-04-14"] }
];

export function ArchiveWorkspace() {
  const [selectedConversation, setSelectedConversation] = useState(conversations[0]);
  const [commandOpen, setCommandOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filteredConversations = useMemo(() => {
    if (!query) return conversations;
    return conversations.filter((conversation) =>
      `${conversation.title} ${conversation.source} ${conversation.excerpt}`.toLowerCase().includes(query.toLowerCase())
    );
  }, [query]);

  return (
    <main className="h-screen overflow-hidden p-3 text-foreground">
      <div className="grid h-full grid-cols-[280px_minmax(560px,1fr)_320px] overflow-hidden rounded-lg border bg-panel/92 shadow-soft-panel backdrop-blur">
        <aside className="flex min-w-0 flex-col border-r bg-panel">
          <div className="flex h-14 items-center gap-3 border-b px-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Archive className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold">Claude Chat Archive Viewer</h1>
              <p className="text-xs text-muted-foreground">Local archive console</p>
            </div>
          </div>

          <div className="border-b p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="pl-9"
                placeholder="Search messages, code, files"
              />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button variant="secondary" size="sm">
                <Import className="h-4 w-4" />
                Import
              </Button>
              <Button variant="secondary" size="sm">
                <FolderSearch className="h-4 w-4" />
                Watch
              </Button>
            </div>
          </div>

          <nav className="scrollbar-thin flex-1 overflow-y-auto p-3">
            <SidebarSection title="Library">
              <SidebarItem icon={History} label="Recent" active />
              <SidebarItem icon={CalendarDays} label="Timeline" />
              <SidebarItem icon={Tags} label="Tags" />
              <SidebarItem icon={Code2} label="Code Explorer" />
              <SidebarItem icon={DatabaseBackup} label="Backups" />
            </SidebarSection>

            <SidebarSection title="Timeline">
              {timeline.map((year) => (
                <div key={`${year.year}-${year.month}`} className="mb-3">
                  <div className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                    <ChevronDown className="h-3 w-3" />
                    {year.year} / {year.month}
                  </div>
                  <div className="space-y-1 pl-4">
                    {year.days.map((day) => (
                      <button
                        className="block w-full rounded-sm px-2 py-1 text-left text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                        key={day}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </SidebarSection>
          </nav>

          <div className="border-t p-3">
            <Button variant="outline" className="w-full justify-start" onClick={() => setCommandOpen(true)}>
              <Command className="h-4 w-4" />
              Command palette
            </Button>
          </div>
        </aside>

        <section className="flex min-w-0 flex-col">
          <header className="flex h-14 items-center justify-between border-b bg-panel-strong px-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-base font-semibold">{selectedConversation.title}</h2>
                <Badge>{selectedConversation.source}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedConversation.date} · {selectedConversation.count} messages · {selectedConversation.code} code blocks
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" title="Pin conversation">
                <Pin className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" title="Favorite conversation">
                <Star className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" title="Toggle theme">
                <Moon className="h-4 w-4" />
              </Button>
            </div>
          </header>

          <div className="grid min-h-0 flex-1 grid-cols-[300px_minmax(0,1fr)]">
            <div className="scrollbar-thin overflow-y-auto border-r bg-background/30 p-3">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-muted-foreground">Conversations</span>
                <Badge>{filteredConversations.length}</Badge>
              </div>
              <div className="space-y-2">
                {filteredConversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation)}
                    className={cn(
                      "w-full rounded-md border bg-panel-strong p-3 text-left transition hover:border-primary/60",
                      selectedConversation.id === conversation.id && "border-primary shadow-sm"
                    )}
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h3 className="line-clamp-2 text-sm font-semibold">{conversation.title}</h3>
                      {conversation.favorite ? <Star className="h-4 w-4 fill-warning text-warning" /> : null}
                    </div>
                    <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">{conversation.excerpt}</p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{conversation.date}</span>
                      <span>·</span>
                      <span>{conversation.count} msgs</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <article className="scrollbar-thin overflow-y-auto bg-panel-strong">
              <div className="mx-auto max-w-3xl px-8 py-8">
                <div className="mb-8 border-b pb-6">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Badge className="border-primary/30 text-primary">
                      <ShieldCheck className="mr-1 h-3 w-3" />
                      Local only
                    </Badge>
                    <Badge>Conversation date</Badge>
                    <Badge>FTS indexed</Badge>
                  </div>
                  <h2 className="text-3xl font-semibold leading-tight">{selectedConversation.title}</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{selectedConversation.excerpt}</p>
                </div>

                <div className="space-y-6">
                  {messages.map((message, index) => (
                    <motion.section
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      key={`${message.role}-${message.time}`}
                      className="grid grid-cols-[88px_minmax(0,1fr)] gap-4"
                    >
                      <div className="sticky top-4 h-fit text-xs text-muted-foreground">{message.time}</div>
                      <div>
                        <div className="mb-2 flex items-center gap-2">
                          <Badge className={message.role === "assistant" ? "border-primary/30 text-primary" : ""}>
                            {message.role}
                          </Badge>
                        </div>
                        <div className="reader-prose rounded-md border bg-panel p-4 text-sm leading-7">
                          {message.body.startsWith("```") ? (
                            <pre>
                              <code>{message.body.replace(/```[a-z]*\n?|```/g, "")}</code>
                            </pre>
                          ) : (
                            <p>{message.body}</p>
                          )}
                        </div>
                      </div>
                    </motion.section>
                  ))}
                </div>
              </div>
            </article>
          </div>
        </section>

        <aside className="flex min-w-0 flex-col border-l bg-panel">
          <div className="flex h-14 items-center justify-between border-b px-4">
            <h2 className="text-sm font-semibold">Inspector</h2>
            <Button variant="ghost" size="icon" title="Settings">
              <Settings className="h-4 w-4" />
            </Button>
          </div>

          <div className="scrollbar-thin flex-1 overflow-y-auto p-4">
            <InspectorSection title="Metadata" icon={FileJson}>
              <KeyValue label="Source" value={selectedConversation.source} />
              <KeyValue label="Date" value={selectedConversation.date} />
              <KeyValue label="Messages" value={String(selectedConversation.count)} />
              <KeyValue label="Tool calls" value={String(selectedConversation.tools)} />
            </InspectorSection>

            <InspectorSection title="Extracted Entities" icon={Sparkles}>
              <EntityPill icon={Files} label="src/server/import/import-service.ts" />
              <EntityPill icon={Link2} label="sqlite.org/fts5.html" />
              <EntityPill icon={TerminalSquare} label="npm run db:migrate" />
            </InspectorSection>

            <InspectorSection title="Code Explorer" icon={Code2}>
              <div className="rounded-md border bg-background p-3 font-mono text-xs leading-5 text-muted-foreground">
                TypeScript · Parser contract
                <div className="mt-2 text-foreground">ArchiveParser.parse()</div>
              </div>
              <Button variant="secondary" className="mt-3 w-full">
                <Code2 className="h-4 w-4" />
                View all snippets
              </Button>
            </InspectorSection>

            <InspectorSection title="Repository Safety" icon={GitBranch}>
              <p className="text-sm leading-6 text-muted-foreground">
                Raw archives, databases, exports, backups, and embeddings are ignored by Git by default.
              </p>
            </InspectorSection>
          </div>
        </aside>
      </div>

      <AnimatePresence>
        {commandOpen ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/45 pt-24"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCommandOpen(false)}
          >
            <motion.div
              className="w-[640px] rounded-lg border bg-panel-strong p-3 shadow-soft-panel"
              initial={{ scale: 0.97, y: -12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.97, y: -12 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="relative mb-3">
                <Command className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" autoFocus placeholder="Import, export, jump, search, backup" />
              </div>
              <div className="grid gap-1">
                {["Import JSON file", "Export monthly markdown book", "Open Code Explorer", "Create database backup"].map(
                  (command) => (
                    <button
                      key={command}
                      className="rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                      onClick={() => setCommandOpen(false)}
                    >
                      {command}
                    </button>
                  )
                )}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="mb-2 px-2 text-xs font-semibold uppercase text-muted-foreground">{title}</h2>
      <div className="space-y-1">{children}</div>
    </section>
  );
}

function SidebarItem({
  icon: Icon,
  label,
  active
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground",
        active && "bg-muted text-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function InspectorSection({
  title,
  icon: Icon,
  children
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border bg-panel-strong px-3 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate font-medium">{value}</span>
    </div>
  );
}

function EntityPill({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-md border bg-panel-strong px-3 py-2 text-sm">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="truncate">{label}</span>
    </div>
  );
}
