
"use client";

import {
  AlertCircle,
  ArrowUp,
  Bot,
  MessageSquare,
  Plus,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";

import {
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
  sendAiMessage,
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

function createMessage(
  role: ChatMessage["role"],
  content: string,
): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    timestamp: new Date().toISOString(),
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

export default function ReachAiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

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

  async function handleSend(
    event?: FormEvent<HTMLFormElement>,
    suggestedMessage?: string,
  ) {
    event?.preventDefault();

    const message = (suggestedMessage ?? input).trim();

    if (!message || loading) return;

    setError(null);
    setInput("");

    const userMessage = createMessage("user", message);

    setMessages((previous) => [...previous, userMessage]);
    setLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await sendAiMessage(
        message,
        controller.signal,
      );

      if (!response.reply?.trim()) {
        throw new Error("Reach AI returned an empty response.");
      }

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response.reply,
        timestamp: response.timestamp || new Date().toISOString(),
      };

      setMessages((previous) => [
        ...previous,
        assistantMessage,
      ]);
    } catch (err) {
      if (controller.signal.aborted) return;

      const errorMessage =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Something went wrong. Please try again.";

      setError(errorMessage);
      setInput(message);
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

  function startNewChat() {
    if (loading) return;

    setMessages([]);
    setInput("");
    setError(null);
    textareaRef.current?.focus();
  }

  function cancelRequest() {
    abortRef.current?.abort();
  }

  const isEmpty = messages.length === 0;

  return (
    <main className="mx-auto flex min-h-[calc(100dvh-120px)] w-full max-w-[1400px] flex-col">
      <section className="flex min-h-[calc(100dvh-120px)] flex-1 flex-col overflow-hidden rounded-md border border-[var(--border)] bg-[var(--surface)]">

        {/* Header */}
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3.5 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex size-10 shrink-0 items-center justify-center rounded-md border"
              style={{
                borderColor: "rgba(186,90,90,0.35)",
                backgroundColor: "rgba(186,90,90,0.09)",
                color: ACCENT,
              }}
            >
              <Sparkles className="size-[19px]" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold text-[var(--foreground)]">
                  Reach AI
                </h1>
              </div>

              <p className="mt-0.5 text-xs text-[var(--muted)]">
                AI Governance Assistant
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={startNewChat}
            disabled={loading || isEmpty}
            className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md border border-[var(--border)] px-3 text-xs font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface-secondary)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="size-3.5" />
            <span>New chat</span>
          </button>
        </header>

        {/* Conversation area */}
        <div className="relative flex-1 overflow-y-auto">

          {isEmpty ? (
            <div className="relative flex min-h-[530px] flex-col items-center justify-center overflow-hidden px-4 py-12 sm:min-h-[600px] sm:px-8">

              {/* Subtle accent glow */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 top-[37%] size-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]"
                style={{
                  backgroundColor: "rgba(186,90,90,0.075)",
                }}
              />

              <div className="relative z-10 w-full max-w-3xl">

                {/* Welcome heading */}
                <div className="mb-9 text-center">
                  <div
                    className="mx-auto mb-6 flex size-14 items-center justify-center rounded-md border"
                    style={{
                      borderColor: "rgba(186,90,90,0.35)",
                      backgroundColor: "rgba(186,90,90,0.09)",
                      color: ACCENT,
                      boxShadow: "0 0 35px rgba(186,90,90,0.10)",
                    }}
                  >
                    <Sparkles className="size-7" />
                  </div>

                  <p
                    className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] sm:text-xs"
                    style={{ color: ACCENT }}
                  >
                    Intelligent Agent Governance
                  </p>

                  <h2 className="text-4xl font-semibold tracking-tight text-[var(--foreground)] sm:text-5xl">
                    Reach AI
                  </h2>

                  <p className="mt-4 text-sm text-[var(--muted-foreground)] sm:text-base">
                    Govern your AI ecosystem confidently.
                  </p>
                </div>

                {/* Main composer */}
                <form
                  onSubmit={(event) => void handleSend(event)}
                  className="overflow-hidden rounded-md border border-[var(--border)] bg-[var(--background)] transition-all focus-within:border-[#BA5A5A]/70"
                  style={{
                    boxShadow: "0 8px 45px rgba(186,90,90,0.055)",
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
                    className="max-h-48 min-h-28 w-full resize-y bg-transparent px-5 py-5 text-sm leading-7 text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] disabled:opacity-50 sm:min-h-36 sm:px-7 sm:py-6"
                  />

                  <div className="flex items-center justify-between gap-3 border-t border-[var(--border)] px-4 py-3 sm:px-5">
                    <p className="text-[11px] text-[var(--muted)]">
                      Enter to send
                      <span className="hidden sm:inline">
                        {" "}· Shift + Enter for new line
                      </span>
                    </p>

                    <div className="flex items-center gap-3">
                      <span className="hidden text-[11px] text-[var(--muted)] sm:inline">
                        {input.length}/4000
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
                  </div>
                </form>

                {/* Suggested questions */}
                <div className="mt-8">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                      Suggested questions
                    </p>

                    <span className="text-[10px] text-[var(--muted)]">
                      Select to start
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
                          className="group flex min-h-[112px] flex-col items-start rounded-md border border-[var(--border)] bg-[var(--background)] p-4 text-left transition-all hover:border-[#BA5A5A]/60 hover:bg-[var(--surface-secondary)] disabled:opacity-50"
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

                          <span className="text-sm font-semibold text-[var(--foreground)]">
                            {suggestion.title}
                          </span>

                          <span className="mt-1 text-xs leading-5 text-[var(--muted)]">
                            {suggestion.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <p className="mt-6 text-center text-[10px] leading-5 text-[var(--muted)]">
                  Verify important governance decisions against official platform analysis.
                </p>
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

              {/* AI loading state */}
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

                  <div className="min-w-0">
                    <div className="mb-2 text-xs font-semibold text-[var(--foreground)]">
                      Reach AI
                    </div>

                    <div
                      className="flex items-center gap-3 rounded-md border bg-[var(--background)] px-4 py-3"
                      style={{
                        borderColor: "rgba(186,90,90,0.3)",
                      }}
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className="size-2 animate-bounce rounded-full [animation-delay:-0.3s]"
                          style={{ backgroundColor: ACCENT }}
                        />
                        <span
                          className="size-2 animate-bounce rounded-full [animation-delay:-0.15s]"
                          style={{ backgroundColor: ACCENT }}
                        />
                        <span
                          className="size-2 animate-bounce rounded-full"
                          style={{ backgroundColor: ACCENT }}
                        />
                      </div>

                      <span className="text-xs text-[var(--muted-foreground)]">
                        Analyzing your request...
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Error message */}
              {error && (
                <div
                  role="alert"
                  className="ml-12 rounded-md border border-red-500/30 bg-red-500/5 p-4"
                >
                  <div className="flex items-start gap-3 text-sm text-red-500">
                    <AlertCircle className="mt-0.5 size-4 shrink-0" />

                    <div className="min-w-0 flex-1">
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
        {!isEmpty && (
          <div className="shrink-0 border-t border-[var(--border)] bg-[var(--surface)] p-3 sm:p-5">
            <div className="mx-auto max-w-4xl">

              {error && (
                <div className="mb-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      void handleSend();
                    }}
                    disabled={loading || !input.trim()}
                    className="text-xs font-medium transition-colors hover:underline disabled:opacity-40"
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
                      title="Cancel response"
                      className="flex size-9 items-center justify-center rounded-md border border-[var(--border)] text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-secondary)]"
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
                Reach AI may make mistakes. Verify important governance decisions.
              </p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
