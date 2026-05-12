"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Archive,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Code2,
  Command,
  DatabaseBackup,
  Download,
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
    pinned: false,
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
    pinned: true,
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedConversation = conversations.find((conversation) => conversation.id === selectedConversationId) ?? conversations[0];

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
        const payload = JSON.parse(text) as unknown;
        const summary = summarizeImportedJson(payload, file.name);
        imported.push(summary);
      } catch {
        notify(`Could not parse ${file.name}`);
      }
    }

    if (imported.length > 0) {
      setConversations((current) => [...imported, ...current]);
      setSelectedConversationId(imported[0].id);
      setActiveView("Recent");
      setModal(null);
      notify(`Imported ${imported.length} JSON file${imported.length === 1 ? "" : "s"} into the local preview`);
    }
  }

  function runCommand(command: string) {
    setCommandOpen(false);
    setCommandQuery("");
    if (command === "Import JSON file") {
      setModal("import");
      fileInputRef.current?.click();
    }
    if (command === "Export monthly markdown book") setModal("export");
    if (command === "Open Code Explorer") setView("Code Explorer");
    if (command === "Create database backup") setModal("backup");
  }

  const commands = ["Import JSON file", "Export monthly markdown book", "Open Code Explorer", "Create database backup"].filter(
    (command) => command.toLowerCase().includes(commandQuery.toLowerCase())
  );

  return (
    <main className="h-screen overflow-hidden p-3 text-foreground">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        multiple
        className="hidden"
        onChange={(event) => importBrowserFiles(event.target.files)}
      />
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
              <Button variant="secondary" size="sm" onClick={() => setModal("import")}>
                <Import className="h-4 w-4" />
                Import
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setModal("watch")}>
                <FolderSearch className="h-4 w-4" />
                Watch
              </Button>
            </div>
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
              {timeline.map((year) => (
                <div key={`${year.year}-${year.month}`} className="mb-3">
                  <div className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                    <ChevronDown className="h-3 w-3" />
                    {year.year} / {year.month}
                  </div>
                  <div className="space-y-1 pl-4">
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
                {selectedConversation.pinned ? <Badge className="border-primary/30 text-primary">Pinned</Badge> : null}
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedConversation.date} · {selectedConversation.count} messages · {selectedConversation.code} code blocks
              </p>
            </div>
            <div className="flex items-center gap-1">
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
              {activeView === "Backups" ? <EmptyPanel title="Backup center" body="Use the button below to stage a database or metadata backup export." action={() => setModal("backup")} actionLabel="Create backup" /> : null}
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
                    <Badge>{activeView}</Badge>
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
            <Button variant="ghost" size="icon" title="Settings" onClick={() => setModal("settings")}>
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
              <EntityPill icon={Files} label="src/server/import/import-service.ts" onClick={() => notify("File reference selected")} />
              <EntityPill icon={Link2} label="sqlite.org/fts5.html" onClick={() => notify("Link copied to clipboard preview")} />
              <EntityPill icon={TerminalSquare} label="npm run db:migrate" onClick={() => notify("Command copied to clipboard preview")} />
            </InspectorSection>

            <InspectorSection title="Code Explorer" icon={Code2}>
              <button
                className="w-full rounded-md border bg-background p-3 text-left font-mono text-xs leading-5 text-muted-foreground hover:border-primary/60"
                onClick={() => setView("Code Explorer")}
              >
                TypeScript · Parser contract
                <div className="mt-2 text-foreground">ArchiveParser.parse()</div>
              </button>
              <Button variant="secondary" className="mt-3 w-full" onClick={() => setView("Code Explorer")}>
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
                  Pick one or more JSON files. In this browser preview they are parsed into local in-memory cards; the Tauri shell will use the full filesystem import service.
                </p>
                <Button onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4" />
                  Choose JSON files
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
                <SettingRow label="Date policy" value={datePreference} onClick={() => {
                  const next = datePreference === "Prefer conversation timestamps" ? "Prefer filesystem modified date" : "Prefer conversation timestamps";
                  setDatePreference(next);
                  notify(next);
                }} />
                <SettingRow label="Theme" value={darkMode ? "Dark" : "Light"} onClick={toggleTheme} />
                <SettingRow label="Telemetry" value="Disabled" onClick={() => notify("Telemetry is permanently disabled by default")} />
              </div>
            ) : null}
            {modal === "backup" ? (
              <div className="space-y-4">
                <p className="text-sm leading-6 text-muted-foreground">
                  Backup services are scaffolded for SQLite, settings, and metadata exports. This preview confirms the action and keeps private data local.
                </p>
                <Button onClick={() => {
                  setModal(null);
                  notify("Backup export queued for the desktop storage layer");
                }}>
                  <DatabaseBackup className="h-4 w-4" />
                  Queue backup
                </Button>
              </div>
            ) : null}
            {modal === "export" ? (
              <div className="space-y-4">
                <p className="text-sm leading-6 text-muted-foreground">
                  Markdown export will combine selected conversations into chronological archive books with metadata headers.
                </p>
                <Button onClick={() => {
                  setModal(null);
                  notify("Markdown archive export queued");
                }}>
                  <Download className="h-4 w-4" />
                  Queue markdown export
                </Button>
              </div>
            ) : null}
          </AppModal>
        ) : null}
      </AnimatePresence>
    </main>
  );
}

function summarizeImportedJson(payload: unknown, fileName: string): DemoConversation {
  const record = payload && typeof payload === "object" && !Array.isArray(payload) ? (payload as Record<string, unknown>) : {};
  const messagesValue = Array.isArray(record.messages)
    ? record.messages
    : Array.isArray(record.conversation)
      ? record.conversation
      : Array.isArray(payload)
        ? payload
        : [];
  const content = JSON.stringify(payload);
  const code = (content.match(/```/g)?.length ?? 0) / 2;

  return {
    id: crypto.randomUUID(),
    title: typeof record.title === "string" ? record.title : fileName.replace(/\.json$/i, ""),
    date: new Date().toISOString().slice(0, 10),
    source: detectSourceLabel(payload),
    count: messagesValue.length || 1,
    code: Math.floor(code),
    tools: content.includes("tool") ? 1 : 0,
    favorite: false,
    pinned: false,
    imported: true,
    excerpt: `Imported preview from ${fileName}. Raw content stays in your browser session until the desktop storage layer persists it.`
  };
}

function detectSourceLabel(payload: unknown) {
  const text = JSON.stringify(payload).slice(0, 3000).toLowerCase();
  if (text.includes("claude") || text.includes("sessionid")) return "Claude Code";
  if (text.includes("mapping") && text.includes("chatgpt")) return "ChatGPT";
  if (text.includes("mapping")) return "OpenAI";
  return "Generic";
}

function modalTitle(modal: Exclude<ModalName, null>) {
  const titles = {
    import: "Import JSON",
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
    <button onClick={onClick} className="flex min-w-0 items-center gap-2 rounded-md border bg-panel-strong px-3 py-2 text-left text-sm hover:border-primary/60">
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
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/45 pt-24"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
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
          <Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} autoFocus placeholder="Import, export, jump, search, backup" />
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-lg rounded-lg border bg-panel-strong p-4 shadow-soft-panel"
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
    <button onClick={onClick} className="flex w-full items-center justify-between rounded-md border bg-panel px-3 py-2 text-left text-sm hover:border-primary/60">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </button>
  );
}
