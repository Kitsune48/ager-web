export type ProblemDetails = {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  errorCode?: string;
  traceId?: string;
};

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function parseApiError(res: Response): Promise<ApiError> {
  const status = res.status;

  const raw = await res.text().catch(() => "");
  if (!raw) return new ApiError(`Request failed (${status})`, status);

  // Try ProblemDetails JSON first
  try {
    const json = JSON.parse(raw) as ProblemDetails & Record<string, unknown>;
    const code = (json.errorCode as string | undefined) ?? undefined;
    const message =
      json.detail ||
      json.title ||
      code ||
      `Request failed (${status})`;

    return new ApiError(message, status, code, json);
  } catch {
    // Fallback: plain text
    return new ApiError(raw, status);
  }
}
