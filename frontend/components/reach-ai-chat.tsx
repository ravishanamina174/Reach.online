
"use client";

import {
  AlertCircle,
  ArrowUp,
  Bot,
  LoaderCircle,
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

const suggestions = [
  {
    title: "Analyze contract changes",
    description: "Compare two contract versions.",
    prompt:
      "Compare course_tool contract versions 1.2.0 and 1.3.0. Explain all added, removed and modified fields.",
    icon: MessageSquare,
  },
  {
    title: "Check dependency impact",
    description: "Find potentially affected agents.",
    prompt:
      "Analyze the dependency impact of course_tool changing from version 1.2.0 to 1.3.0. Which registered agents and tools may be affected?",
    icon: Bot,
  },
  {
    title: "Explain governance",
    description: "Understand policy decisions.",
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
  return new Date(timestamp).toLocaleTimeString([], {
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

      // Restore the question so the user can retry it.
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

  return (
    <div className="flex min-h-[calc(100dvh-190px)] flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)]">

      {/* Header */}
      <header className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
            <Sparkles className="size-5" />
          </div>

          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-[var(--foreground)]">
              Reach AI
            </h1>

            <p className="text-xs text-[var(--muted-foreground)]">
              AI Agent Governance Assistant
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={startNewChat}
          disabled={loading || messages.length === 0}
          className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-[var(--border)] px-3 text-xs font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface-hover)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="size-3.5" />
          <span className="hidden sm:inline">New chat</span>
        </button>
      </header>

      {/* Chat content */}
      <div className="flex-1 px-4 py-6 sm:px-6">

        {messages.length === 0 ? (
          <div className="mx-auto flex min-h-[420px] max-w-3xl flex-col justify-center">

            <div className="mb-8 text-center">
              <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
                <Sparkles className="size-7" />
              </div>

              <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] sm:text-3xl">
                How can I help you today?
              </h2>

              <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[var(--muted-foreground)]">
                Ask questions about your API contracts, agent
                dependencies and governance policies.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {suggestions.map((suggestion) => {
                const Icon = suggestion.icon;

                return (
                  <button
                    key={suggestion.title}
                    type="button"
                    disabled={loading}
                    onClick={() =>
                      void handleSend(undefined, suggestion.prompt)
                    }
                    className="group rounded-xl border border-[var(--border)] p-4 text-left transition-all hover:border-indigo-500/50 hover:bg-[var(--surface-hover)] disabled:opacity-50"
                  >
                    <div className="mb-4 flex size-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
                      <Icon className="size-4" />
                    </div>

                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      {suggestion.title}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">
                      {suggestion.description}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 flex items-center justify-center gap-2 text-xs text-[var(--muted-foreground)]">
              <ShieldCheck className="size-3.5" />
              Responses use your selected workspace's platform data.
            </div>
          </div>
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-7">

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === "user"
                    ? "flex-row-reverse"
                    : "flex-row"
                }`}
              >
                <div
                  className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                    message.role === "assistant"
                      ? "bg-indigo-500/10 text-indigo-500"
                      : "bg-[var(--surface-hover)] text-[var(--muted-foreground)]"
                  }`}
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
                  <div className="mb-1.5 flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                    <span className="font-medium text-[var(--foreground)]">
                      {message.role === "assistant"
                        ? "Reach AI"
                        : "You"}
                    </span>

                    <span>·</span>

                    <span>{formatTime(message.timestamp)}</span>
                  </div>

                  <div
                    className={`rounded-2xl px-4 py-3 text-left text-sm leading-7 ${
                      message.role === "user"
                        ? "rounded-tr-sm bg-indigo-600 text-white"
                        : "rounded-tl-sm border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)]"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-start gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
                  <Sparkles className="size-4" />
                </div>

                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                    <LoaderCircle className="size-4 animate-spin" />
                    Reach AI is thinking...
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="ml-11 rounded-xl border border-red-500/20 bg-red-500/5 p-3"
              >
                <div className="flex items-start gap-2 text-sm text-red-500">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <div>
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

      {/* Composer */}
      <div className="sticky bottom-0 border-t border-[var(--border)] bg-[var(--background)] p-3 sm:p-5">
        <div className="mx-auto max-w-3xl">

          {error && (
            <div className="mb-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  void handleSend();
                }}
                disabled={loading || !input.trim()}
                className="text-xs font-medium text-indigo-500 hover:text-indigo-400 disabled:opacity-40"
              >
                Retry message
              </button>
            </div>
          )}

          <form
            onSubmit={(event) => void handleSend(event)}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-sm transition-colors focus-within:border-indigo-500/50"
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message Reach AI..."
              rows={2}
              maxLength={4000}
              disabled={loading}
              aria-label="Message Reach AI"
              className="max-h-40 min-h-12 w-full resize-y bg-transparent px-3 py-2 text-sm leading-6 text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)] disabled:opacity-50"
            />

            <div className="flex items-center justify-between gap-3 px-2 pb-1">
              <div className="flex items-center gap-2 text-[11px] text-[var(--muted-foreground)]">
                <span>Shift + Enter for a new line</span>
                <span>·</span>
                <span>{input.length}/4000</span>
              </div>

              {loading ? (
                <button
                  type="button"
                  onClick={cancelRequest}
                  className="inline-flex size-9 items-center justify-center rounded-xl border border-[var(--border)] text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-hover)]"
                  aria-label="Cancel response"
                  title="Cancel response"
                >
                  <X className="size-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="inline-flex size-9 items-center justify-center rounded-xl bg-indigo-600 text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Send message"
                >
                  <ArrowUp className="size-4" />
                </button>
              )}
            </div>
          </form>

          <p className="mt-3 text-center text-[10px] leading-5 text-[var(--muted-foreground)]">
            Reach AI can make mistakes. Verify important governance
            decisions against the platform's official analysis.
          </p>
        </div>
      </div>
    </div>
  );
}
