export type ProblemDetails = {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  // common non-ProblemDetails payload
  message?: string;
  // legacy / non-standard
  errorCode?: string;
  // ASP.NET ProblemDetails extensions
  extensions?: {
    errorCode?: string;
    errors?: Record<string, string[] | string>;
  };
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
    const code =
      (json.extensions?.errorCode as string | undefined) ??
      (json.errorCode as string | undefined) ??
      undefined;
    const message =
      json.detail ||
      json.title ||
      json.message ||
      code ||
      `Request failed (${status})`;

    return new ApiError(message, status, code, json);
  } catch {
    // Fallback: plain text
    return new ApiError(raw, status);
  }
}

export function getProblemDetailsFieldErrors(details: unknown): Record<string, string[]> {
  const pd = details as ProblemDetails | undefined;
  const errors = pd?.extensions?.errors;
  if (!errors || typeof errors !== "object") return {};

  const normalized: Record<string, string[]> = {};
  for (const [field, value] of Object.entries(errors)) {
    if (Array.isArray(value)) normalized[field] = value.filter((v) => typeof v === "string");
    else if (typeof value === "string") normalized[field] = [value];
  }
  return normalized;
}
