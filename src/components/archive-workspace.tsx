"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Archive,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clipboard,
  Code2,
  Command,
  DatabaseBackup,
  Download,
  Eye,
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
  Sun,
  Tags,
  TerminalSquare,
  Trash2,
  Upload,
  X
} from "lucide-react";
import type React from "react";
import { useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ViewName = "Recent" | "Timeline" | "Tags" | "Code Explorer" | "Backups";
type ModalName = "import" | "watch" | "settings" | "backup" | "export" | null;

interface ConversationMessage {
  role: string;
  time: string;
  body: string;
}

interface DemoConversation {
  id: string;
  title: string;
  date: string;
  source: string;
  count: number;
  code: number;
  tools: number;
  favorite: boolean;
  pinned: boolean;
  excerpt: string;
  imported?: boolean;
  rawPreview?: string;
  messages?: ConversationMessage[];
}

interface CodeSnippet {
  id: string;
  conversationId: string;
  title: string;
  language: string;
  code: string;
  source: string;
}

interface ExtractedEntity {
  id: string;
  type: "file" | "link" | "command";
  label: string;
}

const seedConversations: DemoConversation[] = [
  {
    id: "1",
    title: "Streaming parser for Claude Code exports",
    date: "2026-05-12",
    source: "Claude Code",
    count: 42,
    code: 8,
    tools: 5,
    favorite: true,
    pinned: false,
    excerpt: "Design an ingestion pipeline that handles very large JSON files without loading every branch into memory.",
    rawPreview: "Parser registry, streaming adapters, FTS indexing, markdown export"
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
    pinned: false,
    excerpt: "Convert exported conversations into a chronological markdown book with frontmatter and separators.",
    rawPreview: "Monthly archive book export with YAML frontmatter"
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
    pinned: true,
    excerpt: "Compare exact text search, filters, snippets, and future semantic search provider interfaces.",
    rawPreview: "FTS5 snippets, ranking, filter clauses"
  }
];

const seedSnippets: CodeSnippet[] = [
  {
    id: "parser-contract",
    conversationId: "1",
    title: "ArchiveParser contract",
    language: "ts",
    source: "Streaming parser for Claude Code exports",
    code:
      "export interface ArchiveParser {\n" +
      "  readonly type: AssistantSource;\n" +
      "  readonly version: string;\n" +
      "  probe(payload: unknown): ParserProbeResult;\n" +
      "  parse(payload: unknown, context: ParserContext): NormalizedConversationBundle;\n" +
      "}"
  },
  {
    id: "markdown-export",
    conversationId: "2",
    title: "Markdown archive export",
    language: "md",
    source: "ChatGPT research archive cleanup",
    code:
      "---\n" +
      "title: \"Conversation title\"\n" +
      "conversation_at: 2026-05-12\n" +
      "---\n\n" +
      "# Conversation title\n\n" +
      "## user\n\n" +
      "Message body"
  },
  {
    id: "fts-query",
    conversationId: "3",
    title: "SQLite FTS query",
    language: "sql",
    source: "SQLite FTS5 ranking notes",
    code:
      "SELECT c.id, c.title,\n" +
      "       snippet(message_fts, 3, '<mark>', '</mark>', '...', 16)\n" +
      "FROM message_fts\n" +
      "JOIN conversations c ON c.id = message_fts.conversation_id\n" +
      "WHERE message_fts MATCH ?\n" +
      "ORDER BY bm25(message_fts);"
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
    body:
      "```ts\n" +
      "export interface ArchiveParser {\n" +
      "  readonly type: AssistantSource;\n" +
      "  readonly version: string;\n" +
      "  probe(payload: unknown): ParserProbeResult;\n" +
      "  parse(payload: unknown, context: ParserContext): NormalizedConversationBundle;\n" +
      "}\n" +
      "```"
  }
];

export function ArchiveWorkspace() {
  const [conversations, setConversations] = useState(seedConversations);
  const [selectedConversationId, setSelectedConversationId] = useState(seedConversations[0].id);
  const [activeView, setActiveView] = useState<ViewName>("Recent");
  const [modal, setModal] = useState<ModalName>(null);
  const [commandOpen, setCommandOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [commandQuery, setCommandQuery] = useState("");
  const [toast, setToast] = useState("Ready");
  const [darkMode, setDarkMode] = useState(true);
  const [datePreference, setDatePreference] = useState("Prefer conversation timestamps");
  const [watchPath, setWatchPath] = useState("");
  const [activeDay, setActiveDay] = useState<string | null>(null);
  const [expandedTimeline, setExpandedTimeline] = useState<Record<string, boolean>>({
    "2026-May": true,
    "2026-April": true
  });
  const [selectedSnippetId, setSelectedSnippetId] = useState(seedSnippets[0].id);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedConversation = conversations.find((conversation) => conversation.id === selectedConversationId) ?? conversations[0];

  const codeSnippets = useMemo(() => {
    const importedSnippets = conversations
      .filter((conversation) => conversation.imported && conversation.code > 0)
      .flatMap((conversation) =>
        extractCodeSnippetsFromText(conversation.rawPreview ?? "", conversation.id, conversation.title)
      );

    return [...seedSnippets, ...importedSnippets];
  }, [conversations]);

  const selectedSnippet = codeSnippets.find((snippet) => snippet.id === selectedSnippetId) ?? codeSnippets[0];
  const selectedEntities = useMemo(() => extractEntities(selectedConversation), [selectedConversation]);
  const timelineGroups = useMemo(() => buildTimelineGroups(conversations), [conversations]);

  const filteredConversations = useMemo(() => {
    let results = conversations;
    if (activeView === "Code Explorer") results = results.filter((conversation) => conversation.code > 0);
    if (activeView === "Timeline" && activeDay) results = results.filter((conversation) => conversation.date === activeDay);
    if (query) {
      results = results.filter((conversation) =>
        `${conversation.title} ${conversation.source} ${conversation.excerpt}`.toLowerCase().includes(query.toLowerCase())
      );
    }
    return [...results].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.date.localeCompare(a.date));
  }, [activeDay, activeView, conversations, query]);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast("Ready"), 2800);
  }

  function setView(view: ViewName) {
    setActiveView(view);
    setActiveDay(null);
    if (view === "Code Explorer" && selectedSnippet) {
      setSelectedConversationId(selectedSnippet.conversationId);
    }
    notify(`Opened ${view}`);
  }

  function toggleTheme() {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    notify(next ? "Dark theme enabled" : "Light theme enabled");
  }

  function updateConversation(id: string, patch: Partial<DemoConversation>) {
    setConversations((current) =>
      current.map((conversation) => (conversation.id === id ? { ...conversation, ...patch } : conversation))
    );
  }

  async function importBrowserFiles(files: FileList | null) {
    if (!files?.length) return;
    const imported: DemoConversation[] = [];

    for (const file of Array.from(files)) {
      try {
        const text = await file.text();
        const payload = parseImportPayload(text, file.name);
        imported.push(summarizeImportedJson(payload, file.name, text));
      } catch {
        notify(`Could not parse ${file.name}`);
      }
    }

    if (imported.length > 0) {
      setConversations((current) => [...imported, ...current]);
      setSelectedConversationId(imported[0].id);
      setActiveView("Recent");
      setModal(null);
      notify(`Imported ${imported.length} JSON/JSONL file${imported.length === 1 ? "" : "s"}`);
    }
  }

  function runCommand(command: string) {
    setCommandOpen(false);
    setCommandQuery("");
    if (command === "Import JSON or JSONL file") {
      setModal("import");
      fileInputRef.current?.click();
    }
    if (command === "Export monthly markdown book") exportMonthlyMarkdown();
    if (command === "Open Code Explorer") setView("Code Explorer");
    if (command === "Create database backup") setModal("backup");
  }

  function exportMonthlyMarkdown() {
    downloadTextFile("2026-May-All-Chats.md", buildMonthlyMarkdown(conversations), "text/markdown;charset=utf-8");
    setModal(null);
    notify("Downloaded 2026-May-All-Chats.md");
  }

  function removeSelectedConversation() {
    if (conversations.length <= 1) {
      notify("Keep at least one conversation in the archive preview");
      return;
    }

    const nextConversations = conversations.filter((conversation) => conversation.id !== selectedConversation.id);
    setConversations(nextConversations);
    setSelectedConversationId(nextConversations[0].id);
    notify(`Removed ${selectedConversation.title} from the app preview`);
  }

  async function copySelectedSnippet() {
    await navigator.clipboard?.writeText(selectedSnippet.code);
    notify("Snippet copied");
  }

  const commands = [
    "Import JSON or JSONL file",
    "Export monthly markdown book",
    "Open Code Explorer",
    "Create database backup"
  ].filter((command) => command.toLowerCase().includes(commandQuery.toLowerCase()));

  return (
    <main className="h-[100dvh] overflow-hidden p-2 text-foreground lg:p-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json,.jsonl,.ndjson"
        multiple
        className="hidden"
        onChange={(event) => importBrowserFiles(event.target.files)}
      />
      <div className="grid h-full min-h-0 grid-cols-[280px_minmax(560px,1fr)_320px] overflow-hidden rounded-lg border bg-panel/92 shadow-soft-panel backdrop-blur">
        <aside className="flex min-h-0 min-w-0 flex-col border-r bg-panel">
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
            <div className="mb-3 rounded-md border border-primary/25 bg-primary/10 px-3 py-2 text-xs leading-5 text-primary">
              Local-first. No telemetry. Private archives stay outside Git.
            </div>
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
              <Button variant="secondary" size="sm" onClick={() => setModal("import")}>
                <Import className="h-4 w-4" />
                Import
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setModal("watch")}>
                <FolderSearch className="h-4 w-4" />
                Watch
              </Button>
            </div>
            <Button variant="outline" size="sm" className="mt-2 w-full justify-start" onClick={() => setCommandOpen(true)}>
              <Command className="h-4 w-4" />
              Command palette
            </Button>
          </div>

          <nav className="scrollbar-thin flex-1 overflow-y-auto p-3">
            <SidebarSection title="Library">
              <SidebarItem icon={History} label="Recent" active={activeView === "Recent"} onClick={() => setView("Recent")} />
              <SidebarItem icon={CalendarDays} label="Timeline" active={activeView === "Timeline"} onClick={() => setView("Timeline")} />
              <SidebarItem icon={Tags} label="Tags" active={activeView === "Tags"} onClick={() => setView("Tags")} />
              <SidebarItem icon={Code2} label="Code Explorer" active={activeView === "Code Explorer"} onClick={() => setView("Code Explorer")} />
              <SidebarItem icon={DatabaseBackup} label="Backups" active={activeView === "Backups"} onClick={() => setView("Backups")} />
            </SidebarSection>

            <SidebarSection title="Timeline">
              {timelineGroups.map((year) => {
                const key = `${year.year}-${year.month}`;
                return (
                  <div key={key} className="mb-3">
                    <button
                      className="mb-1 flex w-full items-center gap-1 rounded-sm px-1 py-1 text-left text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                      onClick={() => setExpandedTimeline((current) => ({ ...current, [key]: !current[key] }))}
                    >
                      <ChevronDown className={cn("h-3 w-3 transition-transform", (expandedTimeline[key] ?? true) === false && "-rotate-90")} />
                      {year.year} / {year.month}
                    </button>
                    <AnimatePresence initial={false}>
                      {(expandedTimeline[key] ?? true) ? (
                        <motion.div
                          className="space-y-1 overflow-hidden pl-4"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                        >
                          {year.days.map((day) => (
                            <button
                              className={cn(
                                "block w-full rounded-sm px-2 py-1 text-left text-xs text-muted-foreground hover:bg-muted hover:text-foreground",
                                activeDay === day && "bg-muted text-foreground"
                              )}
                              key={day}
                              onClick={() => {
                                setActiveView("Timeline");
                                setActiveDay(day);
                                notify(`Filtered timeline to ${day}`);
                              }}
                            >
                              {day}
                            </button>
                          ))}
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                );
              })}
            </SidebarSection>
          </nav>

          <div className="border-t px-3 py-2 text-xs text-muted-foreground">Storage paths are ignored by Git.</div>
        </aside>

        <section className="flex min-h-0 min-w-0 flex-col">
          <header className="flex h-14 items-center justify-between border-b bg-panel-strong px-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-base font-semibold">{selectedConversation.title}</h2>
                <Badge>{selectedConversation.source}</Badge>
                {selectedConversation.pinned ? <Badge className="border-primary/30 text-primary">Pinned</Badge> : null}
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedConversation.date} - {selectedConversation.count} messages - {selectedConversation.code} code blocks
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" title="Remove from app" onClick={removeSelectedConversation}>
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                title="Pin conversation"
                onClick={() => {
                  updateConversation(selectedConversation.id, { pinned: !selectedConversation.pinned });
                  notify(selectedConversation.pinned ? "Conversation unpinned" : "Conversation pinned");
                }}
              >
                <Pin className={cn("h-4 w-4", selectedConversation.pinned && "fill-primary text-primary")} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                title="Favorite conversation"
                onClick={() => {
                  updateConversation(selectedConversation.id, { favorite: !selectedConversation.favorite });
                  notify(selectedConversation.favorite ? "Removed from favorites" : "Added to favorites");
                }}
              >
                <Star className={cn("h-4 w-4", selectedConversation.favorite && "fill-warning text-warning")} />
              </Button>
              <Button variant="ghost" size="icon" title="Toggle theme" onClick={toggleTheme}>
                {darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>
            </div>
          </header>

          <div className="grid min-h-0 flex-1 grid-cols-[300px_minmax(0,1fr)]">
            <div className="scrollbar-thin overflow-y-auto border-r bg-background/30 p-3">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-muted-foreground">{activeView}</span>
                <Badge>{filteredConversations.length}</Badge>
              </div>
              {activeView === "Tags" ? <EmptyPanel title="Tags are ready" body="Tag creation will attach labels to normalized conversations." /> : null}
              {activeView === "Backups" ? (
                <EmptyPanel
                  title="Backup center"
                  body="Use the button below to stage a database or metadata backup export."
                  action={() => setModal("backup")}
                  actionLabel="Create backup"
                />
              ) : null}
              <div className="space-y-2">
                {filteredConversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => setSelectedConversationId(conversation.id)}
                    className={cn(
                      "w-full rounded-md border bg-panel-strong p-3 text-left transition hover:border-primary/60",
                      selectedConversation.id === conversation.id && "border-primary shadow-sm"
                    )}
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h3 className="line-clamp-2 text-sm font-semibold">{conversation.title}</h3>
                      <div className="flex gap-1">
                        {conversation.pinned ? <Pin className="h-4 w-4 fill-primary text-primary" /> : null}
                        {conversation.favorite ? <Star className="h-4 w-4 fill-warning text-warning" /> : null}
                      </div>
                    </div>
                    <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">{conversation.excerpt}</p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{conversation.date}</span>
                      <span>-</span>
                      <span>{conversation.count} msgs</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <article className="scrollbar-thin overflow-y-auto bg-panel-strong">
              {activeView === "Code Explorer" ? (
                <CodeExplorerView
                  snippets={codeSnippets}
                  selectedSnippet={selectedSnippet}
                  onSelect={(snippet) => {
                    setSelectedSnippetId(snippet.id);
                    setSelectedConversationId(snippet.conversationId);
                    notify(`Opened snippet: ${snippet.title}`);
                  }}
                  onCopy={copySelectedSnippet}
                  onDownload={() => {
                    const fileName = `${selectedSnippet.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.${selectedSnippet.language}`;
                    downloadTextFile(fileName, selectedSnippet.code, "text/plain;charset=utf-8");
                    notify("Snippet downloaded");
                  }}
                />
              ) : (
                <ReaderView selectedConversation={selectedConversation} activeView={activeView} />
              )}
            </article>
          </div>
        </section>

        <aside className="flex min-h-0 min-w-0 flex-col border-l bg-panel">
          <div className="flex h-14 items-center justify-between border-b px-4">
            <h2 className="text-sm font-semibold">Inspector</h2>
            <Button variant="ghost" size="icon" title="Settings" onClick={() => setModal("settings")}>
              <Settings className="h-4 w-4" />
            </Button>
          </div>

          <div className="scrollbar-thin flex-1 overflow-y-auto p-4">
            <InspectorSection title="Quick Actions" icon={Eye}>
              <Button variant="secondary" className="w-full justify-start" onClick={() => setModal("export")}>
                <Download className="h-4 w-4" />
                Export markdown
              </Button>
              <Button variant="secondary" className="w-full justify-start" onClick={() => setView("Code Explorer")}>
                <Code2 className="h-4 w-4" />
                Inspect code
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={removeSelectedConversation}>
                <Trash2 className="h-4 w-4" />
                Remove from app
              </Button>
            </InspectorSection>

            <InspectorSection title="Repository Safety" icon={GitBranch}>
              <div className="rounded-md border border-primary/25 bg-primary/10 p-3 text-sm leading-6 text-primary">
                Raw archives, databases, exports, backups, and embeddings are ignored by Git by default.
              </div>
            </InspectorSection>

            <InspectorSection title="Metadata" icon={FileJson}>
              <KeyValue label="Source" value={selectedConversation.source} />
              <KeyValue label="Date" value={selectedConversation.date} />
              <KeyValue label="Messages" value={String(selectedConversation.count)} />
              <KeyValue label="Tool calls" value={String(selectedConversation.tools)} />
              <KeyValue label="Active view" value={activeView} />
            </InspectorSection>

            <InspectorSection title="Extracted Entities" icon={Sparkles}>
              {selectedEntities.map((entity) => (
                <EntityPill
                  key={entity.id}
                  icon={entity.type === "link" ? Link2 : entity.type === "command" ? TerminalSquare : Files}
                  label={entity.label}
                  onClick={() => notify(`${entity.type} selected: ${entity.label}`)}
                />
              ))}
            </InspectorSection>

            <InspectorSection title="Code Explorer" icon={Code2}>
              <button
                className="w-full rounded-md border bg-background p-3 text-left font-mono text-xs leading-5 text-muted-foreground hover:border-primary/60"
                onClick={() => setView("Code Explorer")}
              >
                {selectedSnippet.language} - {selectedSnippet.title}
                <div className="mt-2 text-foreground">{selectedSnippet.code.split("\n")[0]}</div>
              </button>
              <Button variant="secondary" className="mt-3 w-full" onClick={() => setView("Code Explorer")}>
                <Code2 className="h-4 w-4" />
                View all snippets
              </Button>
            </InspectorSection>

          </div>
        </aside>
      </div>

      <StatusToast message={toast} />

      <AnimatePresence>
        {commandOpen ? (
          <CommandPalette
            commands={commands}
            query={commandQuery}
            setQuery={setCommandQuery}
            onRun={runCommand}
            onClose={() => setCommandOpen(false)}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {modal ? (
          <AppModal title={modalTitle(modal)} onClose={() => setModal(null)}>
            {modal === "import" ? (
              <div className="space-y-4">
                <p className="text-sm leading-6 text-muted-foreground">
                  Pick one or more JSON, JSONL, or NDJSON files. Browser preview imports stay in memory; the Tauri shell will persist through the local storage service.
                </p>
                <Button onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4" />
                  Choose JSON or JSONL files
                </Button>
              </div>
            ) : null}
            {modal === "watch" ? (
              <div className="space-y-4">
                <p className="text-sm leading-6 text-muted-foreground">
                  Watch folders need native filesystem access. Enter a path now to save the intended watch target for the desktop shell.
                </p>
                <Input value={watchPath} onChange={(event) => setWatchPath(event.target.value)} placeholder="E:\\Archives\\Claude" />
                <Button
                  onClick={() => {
                    setModal(null);
                    notify(watchPath ? `Watch folder staged: ${watchPath}` : "Watch folder needs a local path");
                  }}
                >
                  <FolderSearch className="h-4 w-4" />
                  Stage watch folder
                </Button>
              </div>
            ) : null}
            {modal === "settings" ? (
              <div className="space-y-4">
                <SettingRow
                  label="Date policy"
                  value={datePreference}
                  onClick={() => {
                    const next =
                      datePreference === "Prefer conversation timestamps"
                        ? "Prefer filesystem modified date"
                        : "Prefer conversation timestamps";
                    setDatePreference(next);
                    notify(next);
                  }}
                />
                <SettingRow label="Theme" value={darkMode ? "Dark" : "Light"} onClick={toggleTheme} />
                <SettingRow label="Telemetry" value="Disabled" onClick={() => notify("Telemetry is permanently disabled by default")} />
              </div>
            ) : null}
            {modal === "backup" ? (
              <div className="space-y-4">
                <p className="text-sm leading-6 text-muted-foreground">
                  Backup services are scaffolded for SQLite, settings, and metadata exports. This preview confirms the action and keeps private data local.
                </p>
                <Button
                  onClick={() => {
                    setModal(null);
                    notify("Backup export queued for the desktop storage layer");
                  }}
                >
                  <DatabaseBackup className="h-4 w-4" />
                  Queue backup
                </Button>
              </div>
            ) : null}
            {modal === "export" ? (
              <div className="space-y-4">
                <p className="text-sm leading-6 text-muted-foreground">
                  Download a chronological markdown archive book with metadata headers for the current in-memory archive.
                </p>
                <Button onClick={exportMonthlyMarkdown}>
                  <Download className="h-4 w-4" />
                  Download markdown book
                </Button>
              </div>
            ) : null}
          </AppModal>
        ) : null}
      </AnimatePresence>
    </main>
  );
}

function ReaderView({ selectedConversation, activeView }: { selectedConversation: DemoConversation; activeView: ViewName }) {
  const conversationMessages = selectedConversation.messages?.length ? selectedConversation.messages : messages;

  return (
    <div className="mx-auto max-w-3xl px-8 py-8">
      <div className="mb-8 border-b pb-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge className="border-primary/30 text-primary">
            <ShieldCheck className="mr-1 h-3 w-3" />
            Local only
          </Badge>
          <Badge>{activeView}</Badge>
          <Badge>FTS indexed</Badge>
        </div>
        <h2 className="text-3xl font-semibold leading-tight">{selectedConversation.title}</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{selectedConversation.excerpt}</p>
      </div>

      <div className="space-y-6">
        {conversationMessages.map((message, index) => (
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
                <Badge className={message.role === "assistant" ? "border-primary/30 text-primary" : ""}>{message.role}</Badge>
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
  );
}

function CodeExplorerView({
  snippets,
  selectedSnippet,
  onSelect,
  onCopy,
  onDownload
}: {
  snippets: CodeSnippet[];
  selectedSnippet: CodeSnippet;
  onSelect: (snippet: CodeSnippet) => void;
  onCopy: () => void;
  onDownload: () => void;
}) {
  return (
    <div className="grid min-h-full grid-cols-[280px_minmax(0,1fr)]">
      <div className="border-r bg-background/30 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Code Explorer</h2>
          <Badge>{snippets.length}</Badge>
        </div>
        <div className="space-y-2">
          {snippets.map((snippet) => (
            <button
              key={snippet.id}
              onClick={() => onSelect(snippet)}
              className={cn(
                "w-full rounded-md border bg-panel-strong p-3 text-left hover:border-primary/60",
                selectedSnippet.id === snippet.id && "border-primary"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium">{snippet.title}</span>
                <Badge>{snippet.language}</Badge>
              </div>
              <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{snippet.source}</p>
            </button>
          ))}
        </div>
      </div>
      <div className="p-6">
        <div className="mb-4 flex items-start justify-between gap-4 border-b pb-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Badge className="border-primary/30 text-primary">{selectedSnippet.language}</Badge>
              <Badge>Extracted snippet</Badge>
            </div>
            <h2 className="text-2xl font-semibold">{selectedSnippet.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{selectedSnippet.source}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onCopy}>
              <Clipboard className="h-4 w-4" />
              Copy
            </Button>
            <Button onClick={onDownload}>
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>
        </div>
        <pre className="max-h-[calc(100vh-230px)] overflow-auto rounded-md border bg-background p-4 font-mono text-sm leading-6">
          <code>{selectedSnippet.code}</code>
        </pre>
      </div>
    </div>
  );
}

function buildTimelineGroups(conversations: DemoConversation[]) {
  const formatter = new Intl.DateTimeFormat("en", { month: "long", timeZone: "UTC" });
  const groups = new Map<string, { year: string; month: string; days: string[] }>();

  for (const conversation of conversations) {
    const date = new Date(`${conversation.date}T00:00:00.000Z`);
    const year = String(date.getUTCFullYear());
    const month = formatter.format(date);
    const key = `${year}-${month}`;
    const group = groups.get(key) ?? { year, month, days: [] };
    if (!group.days.includes(conversation.date)) group.days.push(conversation.date);
    groups.set(key, group);
  }

  return Array.from(groups.values())
    .map((group) => ({ ...group, days: group.days.sort((a, b) => b.localeCompare(a)) }))
    .sort((a, b) => (b.days[0] ?? "").localeCompare(a.days[0] ?? ""));
}

function parseImportPayload(text: string, fileName: string) {
  if (fileName.toLowerCase().endsWith(".jsonl") || fileName.toLowerCase().endsWith(".ndjson")) {
    return text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line) as unknown);
  }

  return JSON.parse(text) as unknown;
}

function summarizeImportedJson(payload: unknown, fileName: string, rawText: string): DemoConversation {
  const record = payload && typeof payload === "object" && !Array.isArray(payload) ? (payload as Record<string, unknown>) : {};
  const reconstructedMessages = extractConversationMessages(payload);
  const snippets = extractCodeSnippetsFromText(rawText, "preview", fileName);
  const firstTimestamp = findFirstTimestamp(payload);

  return {
    id: crypto.randomUUID(),
    title: typeof record.title === "string" ? record.title : fileName.replace(/\.(jsonl|ndjson|json)$/i, ""),
    date: firstTimestamp ?? new Date().toISOString().slice(0, 10),
    source: detectSourceLabel(payload),
    count: reconstructedMessages.length || 1,
    code: snippets.length,
    tools: rawText.toLowerCase().includes("tool") ? 1 : 0,
    favorite: false,
    pinned: false,
    imported: true,
    messages: reconstructedMessages,
    rawPreview: rawText.slice(0, 3000),
    excerpt: `Imported preview from ${fileName}. Raw content stays in your browser session until the desktop storage layer persists it.`
  };
}

function extractConversationMessages(payload: unknown): ConversationMessage[] {
  const sourceMessages = getMessageArray(payload);

  return sourceMessages
    .map((item, index) => {
      const record = asRecord(item);
      const role = String(record?.role ?? record?.speaker ?? record?.author_role ?? record?.type ?? `message ${index + 1}`);
      const body = normalizeMessageText(record?.content ?? record?.text ?? record?.body ?? record?.message ?? item);
      const timestamp = findFirstTimestamp(item);

      return {
        role,
        time: timestamp ? timestamp.slice(11, 16) : String(index + 1).padStart(2, "0"),
        body
      };
    })
    .filter((message) => message.body.trim().length > 0)
    .slice(0, 200);
}

function getMessageArray(payload: unknown): unknown[] {
  const record = asRecord(payload);
  if (Array.isArray(record?.messages)) return record.messages;
  if (Array.isArray(record?.conversation)) return record.conversation;
  if (Array.isArray(record?.items)) return record.items;
  if (Array.isArray(payload)) return payload;

  const mapping = asRecord(record?.mapping);
  if (mapping) {
    return Object.values(mapping)
      .map((value) => asRecord(value)?.message ?? value)
      .filter(Boolean);
  }

  return [payload];
}

function normalizeMessageText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.map(normalizeMessageText).filter(Boolean).join("\n\n");

  const record = asRecord(value);
  if (!record) return JSON.stringify(value, null, 2);
  if (typeof record.text === "string") return record.text.trim();
  if (typeof record.content === "string") return record.content.trim();
  if (Array.isArray(record.parts)) return record.parts.map(normalizeMessageText).join("\n\n");
  if (Array.isArray(record.content)) return record.content.map(normalizeMessageText).join("\n\n");

  return JSON.stringify(record, null, 2);
}

function extractCodeSnippetsFromText(text: string, conversationId: string, source: string): CodeSnippet[] {
  const snippets: CodeSnippet[] = [];
  const pattern = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  for (const match of text.matchAll(pattern)) {
    snippets.push({
      id: `${conversationId}-code-${snippets.length}`,
      conversationId,
      title: `${source} snippet ${snippets.length + 1}`,
      language: match[1] || "text",
      code: match[2].trim(),
      source
    });
  }
  return snippets;
}

function extractEntities(conversation: DemoConversation): ExtractedEntity[] {
  const text = `${conversation.excerpt}\n${conversation.rawPreview ?? ""}`;
  const entities: ExtractedEntity[] = [];

  for (const match of text.matchAll(/\bhttps?:\/\/[^\s<>)"']+/gi)) {
    entities.push({ id: `link-${entities.length}`, type: "link", label: match[0] });
  }

  for (const match of text.matchAll(/(?:[A-Za-z]:\\[^\s'"`]+|\/[^\s'"`]+|[\w.-]+\/[\w./-]+\.[A-Za-z0-9]{1,8})/g)) {
    entities.push({ id: `file-${entities.length}`, type: "file", label: match[0] });
  }

  for (const match of text.matchAll(/\b(?:npm|pnpm|yarn|git|python|node|cargo)\s+[^\n`]+/gi)) {
    entities.push({ id: `command-${entities.length}`, type: "command", label: match[0].trim().slice(0, 90) });
  }

  if (entities.length === 0) {
    return [
      { id: "summary-source", type: "file", label: conversation.imported ? "Imported archive preview" : "Synthetic architecture sample" }
    ];
  }

  return entities.slice(0, 8);
}

function findFirstTimestamp(value: unknown): string | undefined {
  const text = JSON.stringify(value);
  const iso = text.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?/);
  if (iso) return iso[0].slice(0, 10);
  const dateOnly = text.match(/\d{4}-\d{2}-\d{2}/);
  return dateOnly?.[0];
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
}

function detectSourceLabel(payload: unknown) {
  const text = JSON.stringify(payload).slice(0, 3000).toLowerCase();
  if (text.includes("claude") || text.includes("sessionid")) return "Claude Code";
  if (text.includes("mapping") && text.includes("chatgpt")) return "ChatGPT";
  if (text.includes("mapping")) return "OpenAI";
  return "Generic";
}

function buildMonthlyMarkdown(conversations: DemoConversation[]) {
  const sorted = [...conversations].sort((a, b) => a.date.localeCompare(b.date));
  return [
    "---",
    'title: "2026 May All Chats"',
    `generated_at: ${new Date().toISOString()}`,
    `conversation_count: ${sorted.length}`,
    "---",
    "",
    "# 2026 May All Chats",
    "",
    ...sorted.map((conversation) =>
      [
        "---",
        "",
        `## ${conversation.title}`,
        "",
        `- Date: ${conversation.date}`,
        `- Source: ${conversation.source}`,
        `- Messages: ${conversation.count}`,
        `- Code blocks: ${conversation.code}`,
        "",
        conversation.excerpt,
        "",
        conversation.rawPreview ? "```text\n" + conversation.rawPreview.slice(0, 1200) + "\n```" : ""
      ].join("\n")
    )
  ].join("\n");
}

function downloadTextFile(fileName: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function modalTitle(modal: Exclude<ModalName, null>) {
  const titles = {
    import: "Import JSON / JSONL",
    watch: "Watch Folder",
    settings: "Settings",
    backup: "Backup Export",
    export: "Markdown Export"
  };
  return titles[modal];
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
  active,
  onClick
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
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

function EntityPill({
  icon: Icon,
  label,
  onClick
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex min-w-0 items-center gap-2 rounded-md border bg-panel-strong px-3 py-2 text-left text-sm hover:border-primary/60"
    >
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="truncate">{label}</span>
    </button>
  );
}

function EmptyPanel({ title, body, action, actionLabel }: { title: string; body: string; action?: () => void; actionLabel?: string }) {
  return (
    <div className="mb-3 rounded-md border bg-panel-strong p-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{body}</p>
      {action ? (
        <Button className="mt-3 w-full" variant="secondary" size="sm" onClick={action}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

function StatusToast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-md border bg-panel-strong px-3 py-2 text-sm shadow-soft-panel">
      <CheckCircle2 className="h-4 w-4 text-primary" />
      {message}
    </div>
  );
}

function CommandPalette({
  commands,
  query,
  setQuery,
  onRun,
  onClose
}: {
  commands: string[];
  query: string;
  setQuery: (query: string) => void;
  onRun: (command: string) => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/45 px-4 pt-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="max-h-[calc(100vh-48px)] w-full max-w-[560px] overflow-y-auto rounded-lg border bg-panel-strong p-3 shadow-soft-panel"
        initial={{ scale: 0.97, y: -12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.97, y: -12 }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative mb-3">
          <Command className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoFocus
            placeholder="Import, export, jump, search, backup"
          />
        </div>
        <div className="grid gap-1">
          {commands.map((command) => (
            <button key={command} className="rounded-md px-3 py-2 text-left text-sm hover:bg-muted" onClick={() => onRun(command)}>
              {command}
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

function AppModal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/45 p-4 pt-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="max-h-[calc(100vh-80px)] w-full max-w-lg overflow-y-auto rounded-lg border bg-panel-strong p-4 shadow-soft-panel"
        initial={{ scale: 0.97, y: 8 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.97, y: 8 }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

function SettingRow({ label, value, onClick }: { label: string; value: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-md border bg-panel px-3 py-2 text-left text-sm hover:border-primary/60"
    >
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </button>
  );
}
