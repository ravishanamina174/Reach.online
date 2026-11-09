const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080"
).replace(/\/+$/, "");
const REQUEST_TIMEOUT_MS = 15_000;
let tokenProvider: (() => Promise<string | null>) | null = null;
let selectedWorkspace: "demo" | "personal" = "demo";

export function setAuthTokenProvider(
  provider: (() => Promise<string | null>) | null,
) {
  tokenProvider = provider;
}

export function setWorkspace(workspace: "demo" | "personal") {
  selectedWorkspace = workspace;
}

export function getWorkspace() {
  return selectedWorkspace;
}

export type ApiResponse<T> = {
  data: T;
  timestamp: string;
};

export type ApiErrorResponse = {
  timestamp?: string;
  status?: number;
  error?: string;
  message?: string;
  path?: string;
  details?: string[];
};

export type BackendHealth = {
  status: string;
  application: string;
};

export class ApiError extends Error {
  readonly status: number;
  readonly details: string[];
  readonly path?: string;

  constructor(
    message: string,
    status: number,
    details: string[] = [],
    path?: string,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
    this.path = path;
  }
}

async function readError(response: Response): Promise<ApiError> {
  let body: ApiErrorResponse | null = null;

  try {
    body = (await response.json()) as ApiErrorResponse;
  } catch {
    // The backend may return an empty or non-JSON error response.
  }

  return new ApiError(
    body?.message ??
      body?.error ??
      `Request failed with status ${response.status}.`,
    response.status,
    Array.isArray(body?.details) ? body.details : [],
    body?.path,
  );
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  timeoutMs = REQUEST_TIMEOUT_MS,
): Promise<T> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const controller = new AbortController();
  const timeout = window.setTimeout(
  () => controller.abort(),
  timeoutMs,
);
  const externalAbort = () => controller.abort();

  if (init.signal) {
    if (init.signal.aborted) {
      throw new ApiError("The request was cancelled.", 0);
    }
    init.signal.addEventListener("abort", externalAbort, { once: true });
  }

  let response: Response;

  try {
    const token = tokenProvider ? await tokenProvider() : null;
    response = await fetch(`${API_BASE_URL}${normalizedPath}`, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "X-Reach-Workspace": selectedWorkspace,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
      cache: "no-store",
    });
  } catch {
    if (controller.signal.aborted) {
      throw new ApiError(
        init.signal?.aborted
          ? "The request was cancelled."
          : "The backend request timed out. Check that the Spring Boot server is running and try again.",
        0,
      );
    }

    throw new ApiError(
      "Could not connect to the backend. Check that the Spring Boot server is running and the API URL is correct.",
      0,
    );
  } finally {
    window.clearTimeout(timeout);
    init.signal?.removeEventListener("abort", externalAbort);
  }

  if (!response.ok) {
    throw await readError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError(
      "The backend returned a response that could not be read as JSON.",
      response.status,
    );
  }
}

/**
 * Use this when an endpoint returns ApiResponse<T>,
 * such as the agent, tool and dependency list endpoints.
 */
export function unwrapApiResponse<T>(
  response: ApiResponse<T>,
): T {
  if (
    !response ||
    typeof response !== "object" ||
    !("data" in response) ||
    !("timestamp" in response)
  ) {
    throw new ApiError(
      "The backend returned an unexpected response shape.",
      200,
    );
  }

  return response.data;
}

export async function checkBackendHealth(): Promise<BackendHealth> {
  return apiRequest<BackendHealth>("/api/health");
}

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

export type AiChatRequest = {
  message: string;
};

export type AiChatResponse = {
  reply: string;
  timestamp: string;
};

export async function sendAiMessage(
  message: string,
  signal?: AbortSignal,
): Promise<AiChatResponse> {
  return apiRequest<AiChatResponse>(
    "/api/ai/chat",
    {
      method: "POST",
      body: JSON.stringify({ message }),
      signal,
    },
    90_000,
  );
}


export type AiConversation = {
  id: string;
  title: string;
  workspace: "DEMO" | "PERSONAL";
  createdAt: string;
  updatedAt: string;
};

export type AiChatMessage = {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
};

export type AiSendMessageResponse = {
  conversationId: string;
  messages: AiChatMessage[];
};

export async function getAiConversations(): Promise<AiConversation[]> {
  return apiRequest<AiConversation[]>("/api/ai/conversations");
}

export async function createAiConversation(): Promise<AiConversation> {
  return apiRequest<AiConversation>("/api/ai/conversations", {
    method: "POST",
  });
}

export async function getAiConversationMessages(
  conversationId: string,
): Promise<AiChatMessage[]> {
  return apiRequest<AiChatMessage[]>(
    `/api/ai/conversations/${conversationId}/messages`,
  );
}

export async function sendAiConversationMessage(
  conversationId: string,
  message: string,
  signal?: AbortSignal,
): Promise<AiSendMessageResponse> {
  return apiRequest<AiSendMessageResponse>(
    `/api/ai/conversations/${conversationId}/messages`,
    {
      method: "POST",
      body: JSON.stringify({ message }),
      signal,
    },
  );
}

export async function renameAiConversation(
  conversationId: string,
  title: string,
): Promise<AiConversation> {
  return apiRequest<AiConversation>(
    `/api/ai/conversations/${conversationId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ title }),
    },
  );
}

export async function deleteAiConversation(
  conversationId: string,
): Promise<void> {
  return apiRequest<void>(
    `/api/ai/conversations/${conversationId}`,
    {
      method: "DELETE",
    },
  );
}
