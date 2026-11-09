
"use client";

import {
  AlertCircle,
  ArrowUp,
  Bot,
  LoaderCircle,
  MessageSquare,
  MessageSquarePlus,
  Pencil,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
  X,
  PanelLeft,
  Check,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  FormEvent,
  KeyboardEvent,
} from "react";

import {
  ApiError,
  getAiConversations,
  createAiConversation,
  getAiConversationMessages,
  sendAiConversationMessage,
  renameAiConversation,
  deleteAiConversation,
} from "@/lib/api";

import type {
  AiConversation,
  AiChatMessage,
} from "@/lib/api";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

const ACCENT = "#BA5A5A";

const suggestions = [
  {
    title: "Contract analysis",
    description: "Compare contract versions and changes.",
    prompt:
      "Compare course_tool contract versions 1.2.0 and 1.3.0. Explain all added, removed and modified fields.",
    icon: MessageSquare,
  },
  {
    title: "Dependency impact",
    description: "Identify potentially affected agents.",
    prompt:
      "Analyze the dependency impact of course_tool changing from version 1.2.0 to 1.3.0. Which registered agents and tools may be affected?",
    icon: Bot,
  },
  {
    title: "Governance review",
    description: "Understand policy decisions and findings.",
    prompt:
      "Evaluate governance for course_tool changing from version 1.2.0 to 1.3.0. Explain the decision and triggered policies.",
    icon: ShieldCheck,
  },
];

function toChatMessage(message: AiChatMessage): ChatMessage {
  return {
    id: message.id,
    role: message.role === "USER" ? "user" : "assistant",
    content: message.content,
    timestamp: message.createdAt,
  };
}

function formatTime(timestamp: string) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatConversationDate(timestamp: string) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();

  if (sameDay) {
    return "Today";
  }

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

export default function ReachAiChat() {
  const [conversations, setConversations] = useState<AiConversation[]>([]);
  const [activeConversationId, setActiveConversationId] =
    useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [showHistory, setShowHistory] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const refreshConversations = useCallback(async () => {
    const data = await getAiConversations();
    setConversations(data);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      try {
        const data = await getAiConversations();

        if (!cancelled) {
          setConversations(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (!cancelled) {
          setLoadingHistory(false);
        }
      }
    }

    void loadHistory();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, loading]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  async function openConversation(conversationId: string) {
    if (loading) return;

    setError(null);
    setLoadingHistory(true);

    try {
      const data = await getAiConversationMessages(conversationId);

      setMessages(data.map(toChatMessage));
      setActiveConversationId(conversationId);
      setShowHistory(false);
      setInput("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingHistory(false);
    }
  }

  function startNewChat() {
    if (loading) return;

    setActiveConversationId(null);
    setMessages([]);
    setInput("");
    setError(null);
    setEditingId(null);
    setShowHistory(false);

    textareaRef.current?.focus();
  }

  async function handleSend(
    event?: FormEvent<HTMLFormElement>,
    suggestedMessage?: string,
  ) {
    event?.preventDefault();

    const message = (suggestedMessage ?? input).trim();

    if (!message || loading) return;

    setError(null);
    setInput("");
    setLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    const temporaryUserMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
    };

    setMessages((previous) => [
      ...previous,
      temporaryUserMessage,
    ]);

    let conversationId = activeConversationId;

    try {
      if (!conversationId) {
        const conversation = await createAiConversation();

        conversationId = conversation.id;
        setActiveConversationId(conversation.id);
      }

      const response = await sendAiConversationMessage(
        conversationId,
        message,
        controller.signal,
      );

      if (controller.signal.aborted) return;

      const returnedMessages = response.messages.map(toChatMessage);

      setMessages((previous) => [
        ...previous.filter(
          (item) => item.id !== temporaryUserMessage.id,
        ),
        ...returnedMessages,
      ]);

      await refreshConversations();
    } catch (err) {
      if (controller.signal.aborted) return;

      setMessages((previous) =>
        previous.filter(
          (item) => item.id !== temporaryUserMessage.id,
        ),
      );

      setInput(message);
      setError(getErrorMessage(err));

      await refreshConversations().catch(() => undefined);
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
        setLoading(false);
      }
    }
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      void handleSend();
    }
  }

  function cancelRequest() {
    abortRef.current?.abort();
  }

  async function saveRename(conversationId: string) {
    const title = editingTitle.trim();

    if (!title) return;

    try {
      const updated = await renameAiConversation(
        conversationId,
        title,
      );

      setConversations((previous) =>
        previous.map((conversation) =>
          conversation.id === conversationId
            ? updated
            : conversation,
        ),
      );

      setEditingId(null);
      setEditingTitle("");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function removeConversation(conversationId: string) {
    const confirmed = window.confirm(
      "Delete this conversation and all its messages?",
    );

    if (!confirmed) return;

    try {
      await deleteAiConversation(conversationId);

      setConversations((previous) =>
        previous.filter(
          (conversation) => conversation.id !== conversationId,
        ),
      );

      if (activeConversationId === conversationId) {
        setActiveConversationId(null);
        setMessages([]);
        setInput("");
      }

      setError(null);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  const activeConversation = conversations.find(
    (conversation) => conversation.id === activeConversationId,
  );

  return (
    <main className="mx-auto w-full max-w-[1500px]">
      <section className="flex min-h-[calc(100dvh-120px)] overflow-hidden rounded-md border border-[var(--border)] bg-[var(--surface)]">

        {/* Conversation history */}
        <aside
          className={`w-full shrink-0 flex-col border-r border-[var(--border)] bg-[var(--background)] md:flex md:w-[260px] ${
            showHistory ? "flex" : "hidden"
          }`}
        >
          <div className="flex h-[66px] shrink-0 items-center justify-between border-b border-[var(--border)] px-4">
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">
                Conversations
              </p>
              <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                Your saved chats
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowHistory(false)}
              className="flex size-8 items-center justify-center rounded-md text-[var(--muted)] hover:bg-[var(--surface-secondary)] md:hidden"
              aria-label="Close history"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="p-3">
            <button
              type="button"
              onClick={startNewChat}
              disabled={loading}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-[#BA5A5A]/40 bg-[#BA5A5A]/10 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[#BA5A5A]/15 disabled:opacity-40"
            >
              <Plus className="size-4" />
              New conversation
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
            {loadingHistory ? (
              <div className="flex items-center justify-center gap-2 py-8 text-xs text-[var(--muted)]">
                <LoaderCircle className="size-4 animate-spin" />
                Loading conversations...
              </div>
            ) : conversations.length === 0 ? (
              <div className="px-3 py-8 text-center">
                <MessageSquare className="mx-auto size-6 text-[var(--muted)]" />
                <p className="mt-3 text-xs text-[var(--muted)]">
                  No saved conversations yet.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {conversations.map((conversation) => {
                  const active =
                    conversation.id === activeConversationId;

                  const editing =
                    editingId === conversation.id;

                  return (
                    <div
                      key={conversation.id}
                      className={`group rounded-md border p-2 transition-colors ${
                        active
                          ? "border-[#BA5A5A]/30 bg-[#BA5A5A]/5"
                          : "border-transparent hover:border-[var(--border)] hover:bg-[var(--surface-secondary)]"
                      }`}
                    >
                      {editing ? (
                        <form
                          onSubmit={(event) => {
                            event.preventDefault();
                            void saveRename(conversation.id);
                          }}
                          className="space-y-2"
                        >
                          <input
                            autoFocus
                            value={editingTitle}
                            onChange={(event) =>
                              setEditingTitle(event.target.value)
                            }
                            maxLength={100}
                            className="h-8 w-full rounded-sm border border-[var(--border)] bg-[var(--surface)] px-2 text-xs text-[var(--foreground)] outline-none focus:border-[#BA5A5A]"
                          />

                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="flex size-7 items-center justify-center rounded-sm text-[var(--muted)] hover:bg-[var(--surface-secondary)]"
                              aria-label="Cancel rename"
                            >
                              <X className="size-3.5" />
                            </button>

                            <button
                              type="submit"
                              disabled={!editingTitle.trim()}
                              className="flex size-7 items-center justify-center rounded-sm text-white disabled:opacity-40"
                              style={{ backgroundColor: ACCENT }}
                              aria-label="Save title"
                            >
                              <Check className="size-3.5" />
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="flex items-start gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              void openConversation(conversation.id)
                            }
                            className="min-w-0 flex-1 text-left"
                          >
                            <p className="truncate text-xs font-medium text-[var(--foreground)]">
                              {conversation.title}
                            </p>

                            <p className="mt-1 text-[10px] text-[var(--muted)]">
                              {formatConversationDate(
                                conversation.updatedAt,
                              )}
                            </p>
                          </button>

                          <div className="flex shrink-0 items-center gap-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(conversation.id);
                                setEditingTitle(conversation.title);
                              }}
                              className="flex size-7 items-center justify-center rounded-sm text-[var(--muted)] hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]"
                              aria-label="Rename conversation"
                              title="Rename"
                            >
                              <Pencil className="size-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                void removeConversation(conversation.id)
                              }
                              className="flex size-7 items-center justify-center rounded-sm text-[var(--muted)] hover:bg-red-500/10 hover:text-red-500"
                              aria-label="Delete conversation"
                              title="Delete"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-[var(--border)] px-4 py-3">
            <p className="text-[10px] text-[var(--muted)]">
              Conversations are saved to your workspace.
            </p>
          </div>
        </aside>

        {/* Chat panel */}
        <div
          className={`min-w-0 flex-1 flex-col ${
            showHistory ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Header */}
          <header className="flex h-[66px] shrink-0 items-center justify-between gap-3 border-b border-[var(--border)] px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setShowHistory((value) => !value)}
                className="flex size-9 shrink-0 items-center justify-center rounded-md border border-[var(--border)] text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-secondary)]"
                aria-label="Toggle conversation history"
                title="Conversation history"
              >
                <PanelLeft className="size-4" />
              </button>

              <div
                className="flex size-9 shrink-0 items-center justify-center rounded-md border"
                style={{
                  borderColor: "rgba(186,90,90,0.35)",
                  backgroundColor: "rgba(186,90,90,0.09)",
                  color: ACCENT,
                }}
              >
                <Sparkles className="size-[18px]" />
              </div>

              <div className="min-w-0">
                <h1 className="text-sm font-semibold text-[var(--foreground)]">
                  Reach AI
                </h1>

                <p className="truncate text-[11px] text-[var(--muted)]">
                  {activeConversation?.title ?? "AI Governance Assistant"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={startNewChat}
              disabled={loading}
              className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md border border-[var(--border)] px-3 text-xs font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface-secondary)] disabled:opacity-40"
            >
              <MessageSquarePlus className="size-3.5" />
              <span className="hidden sm:inline">New chat</span>
            </button>
          </header>

          {/* Messages */}
          <div className="relative min-h-0 flex-1 overflow-y-auto">

            {messages.length === 0 ? (
              <div className="relative flex min-h-full flex-col items-center justify-center overflow-hidden px-4 py-12 sm:px-8">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute left-1/2 top-[38%] size-[350px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]"
                  style={{
                    backgroundColor: "rgba(186,90,90,0.07)",
                  }}
                />

                <div className="relative z-10 w-full max-w-3xl">
                  <div className="mb-8 text-center">
                    <div
                      className="mx-auto mb-5 flex size-12 items-center justify-center rounded-md border"
                      style={{
                        borderColor: "rgba(186,90,90,0.35)",
                        backgroundColor: "rgba(186,90,90,0.09)",
                        color: ACCENT,
                      }}
                    >
                      <Sparkles className="size-6" />
                    </div>

                    <p
                      className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em]"
                      style={{ color: ACCENT }}
                    >
                      Intelligent Agent Governance
                    </p>

                    <h2 className="text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-4xl">
                      Reach AI
                    </h2>

                    <p className="mt-3 text-sm text-[var(--muted-foreground)]">
                      Govern your AI ecosystem confidently.
                    </p>
                  </div>

                  <form
                    onSubmit={(event) => void handleSend(event)}
                    className="overflow-hidden rounded-md border border-[var(--border)] bg-[var(--background)] transition-colors focus-within:border-[#BA5A5A]/70"
                    style={{
                      boxShadow: "0 8px 40px rgba(186,90,90,0.05)",
                    }}
                  >
                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask Reach AI about contracts, dependencies or governance..."
                      rows={3}
                      maxLength={4000}
                      disabled={loading}
                      aria-label="Message Reach AI"
                      className="max-h-48 min-h-28 w-full resize-y bg-transparent px-5 py-5 text-sm leading-7 text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] disabled:opacity-50 sm:min-h-32 sm:px-6"
                    />

                    <div className="flex items-center justify-between gap-3 border-t border-[var(--border)] px-4 py-3">
                      <span className="text-[10px] text-[var(--muted)]">
                        Enter to send · Shift + Enter for new line
                      </span>

                      <button
                        type="submit"
                        disabled={!input.trim() || loading}
                        aria-label="Send message"
                        className="flex size-10 shrink-0 items-center justify-center rounded-md text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                        style={{ backgroundColor: ACCENT }}
                      >
                        <ArrowUp className="size-5" />
                      </button>
                    </div>
                  </form>

                  <div className="mt-8">
                    <p className="mb-3 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                      Suggested questions
                    </p>

                    <div className="grid gap-3 sm:grid-cols-3">
                      {suggestions.map((suggestion) => {
                        const Icon = suggestion.icon;

                        return (
                          <button
                            key={suggestion.title}
                            type="button"
                            disabled={loading}
                            onClick={() =>
                              void handleSend(
                                undefined,
                                suggestion.prompt,
                              )
                            }
                            className="rounded-md border border-[var(--border)] bg-[var(--background)] p-4 text-left transition-colors hover:border-[#BA5A5A]/50 hover:bg-[var(--surface-secondary)] disabled:opacity-50"
                          >
                            <div
                              className="mb-3 flex size-8 items-center justify-center rounded-sm border"
                              style={{
                                borderColor: "rgba(186,90,90,0.25)",
                                backgroundColor: "rgba(186,90,90,0.07)",
                                color: ACCENT,
                              }}
                            >
                              <Icon className="size-4" />
                            </div>

                            <p className="text-sm font-semibold text-[var(--foreground)]">
                              {suggestion.title}
                            </p>

                            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                              {suggestion.description}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mx-auto flex w-full max-w-4xl flex-col gap-7 px-4 py-6 sm:gap-9 sm:px-8 sm:py-9">
                {messages.map((message) => (
                  <article
                    key={message.id}
                    className={`flex gap-3 sm:gap-4 ${
                      message.role === "user"
                        ? "flex-row-reverse"
                        : "flex-row"
                    }`}
                  >
                    <div
                      className={`flex size-9 shrink-0 items-center justify-center rounded-md border ${
                        message.role === "assistant"
                          ? ""
                          : "border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--muted-foreground)]"
                      }`}
                      style={
                        message.role === "assistant"
                          ? {
                              borderColor: "rgba(186,90,90,0.35)",
                              backgroundColor: "rgba(186,90,90,0.09)",
                              color: ACCENT,
                            }
                          : undefined
                      }
                    >
                      {message.role === "assistant" ? (
                        <Sparkles className="size-4" />
                      ) : (
                        <UserRound className="size-4" />
                      )}
                    </div>

                    <div
                      className={`min-w-0 max-w-[88%] sm:max-w-[80%] ${
                        message.role === "user" ? "text-right" : ""
                      }`}
                    >
                      <div className="mb-2 flex items-center gap-2 text-xs text-[var(--muted)]">
                        <span className="font-semibold text-[var(--foreground)]">
                          {message.role === "assistant" ? "Reach AI" : "You"}
                        </span>

                        <span>·</span>

                        <span>{formatTime(message.timestamp)}</span>
                      </div>

                      <div
                        className={`rounded-md border px-4 py-3 text-left text-sm leading-7 sm:px-5 sm:py-4 ${
                          message.role === "user"
                            ? "border-[#BA5A5A]/30 bg-[#BA5A5A]/10 text-[var(--foreground)]"
                            : "border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}

                {loading && (
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div
                      className="flex size-9 shrink-0 items-center justify-center rounded-md border"
                      style={{
                        borderColor: "rgba(186,90,90,0.35)",
                        backgroundColor: "rgba(186,90,90,0.09)",
                        color: ACCENT,
                      }}
                    >
                      <Sparkles className="size-4 animate-pulse" />
                    </div>

                    <div>
                      <p className="mb-2 text-xs font-semibold text-[var(--foreground)]">
                        Reach AI
                      </p>

                      <div className="flex items-center gap-3 rounded-md border border-[#BA5A5A]/30 bg-[var(--background)] px-4 py-3">
                        <LoaderCircle
                          className="size-4 animate-spin"
                          style={{ color: ACCENT }}
                        />

                        <span className="text-xs text-[var(--muted-foreground)]">
                          Analyzing your request...
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div
                    role="alert"
                    className="ml-12 rounded-md border border-red-500/30 bg-red-500/5 p-4"
                  >
                    <div className="flex items-start gap-3 text-sm text-red-500">
                      <AlertCircle className="mt-0.5 size-4 shrink-0" />

                      <div className="min-w-0">
                        <p className="font-medium">
                          Unable to get a response
                        </p>

                        <p className="mt-1 break-words text-xs leading-5">
                          {error}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {/* Conversation composer */}
          {messages.length > 0 && (
            <div className="shrink-0 border-t border-[var(--border)] bg-[var(--surface)] p-3 sm:p-5">
              <div className="mx-auto max-w-4xl">
                {error && (
                  <div className="mb-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        void handleSend();
                      }}
                      disabled={loading || !input.trim()}
                      className="text-xs font-medium hover:underline disabled:opacity-40"
                      style={{ color: ACCENT }}
                    >
                      Retry message
                    </button>
                  </div>
                )}

                <form
                  onSubmit={(event) => void handleSend(event)}
                  className="overflow-hidden rounded-md border border-[var(--border)] bg-[var(--background)] transition-colors focus-within:border-[#BA5A5A]/70"
                >
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask Reach AI anything..."
                    rows={2}
                    maxLength={4000}
                    disabled={loading}
                    aria-label="Message Reach AI"
                    className="max-h-40 min-h-14 w-full resize-y bg-transparent px-4 py-3 text-sm leading-6 text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] disabled:opacity-50 sm:px-5"
                  />

                  <div className="flex items-center justify-between gap-3 border-t border-[var(--border)] px-3 py-2">
                    <span className="text-[10px] text-[var(--muted)] sm:text-xs">
                      Shift + Enter for a new line
                      <span className="hidden sm:inline">
                        {" "}· {input.length}/4000
                      </span>
                    </span>

                    {loading ? (
                      <button
                        type="button"
                        onClick={cancelRequest}
                        aria-label="Cancel response"
                        className="flex size-9 items-center justify-center rounded-md border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--surface-secondary)]"
                      >
                        <X className="size-4" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={!input.trim()}
                        aria-label="Send message"
                        className="flex size-9 items-center justify-center rounded-md text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                        style={{ backgroundColor: ACCENT }}
                      >
                        <ArrowUp className="size-4" />
                      </button>
                    )}
                  </div>
                </form>

                <p className="mt-2 text-center text-[10px] text-[var(--muted)]">
                  Verify important governance decisions against official platform analysis.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {error && messages.length === 0 && (
        <p role="alert" className="mt-3 text-xs text-red-500">
          {error}
        </p>
      )}
    </main>
  );
}
