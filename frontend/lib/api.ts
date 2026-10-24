const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080"
).replace(/\/+$/, "");

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
): Promise<T> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${normalizedPath}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      "Could not connect to the backend. Check that the Spring Boot server is running and the API URL is correct.",
      0,
    );
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
  return response.data;
}

export async function checkBackendHealth(): Promise<BackendHealth> {
  return apiRequest<BackendHealth>("/api/health");
}

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}