import { API_BASE } from "./client";

/** String variants we use in the UI */
export type InteractionKind = "LIKE" | "SAVE" | "DISCARD" | "REPORT";

/** Backend expects numeric enum: 0=LIKE, 1=SAVE, 2=DISCARD, 3=REPORT */
const TypeToNumber: Record<InteractionKind, number> = {
  LIKE: 0,
  SAVE: 1,
  DISCARD: 2,
  REPORT: 3,
};

export type PostInteractionRequest = {
  articleId: number;
  type: InteractionKind;
  reason?: string;
};

export async function postInteraction(
  body: PostInteractionRequest,
  accessToken?: string
) {
  // Send PascalCase keys to mirror your C# DTO:
  // public int ArticleId { get; init; }
  // public InteractionType Type { get; init; }
  // public string? Reason { get; init; }
  const payload = {
    ArticleId: body.articleId,
    Type: TypeToNumber[body.type],
    // Only include Reason when present (some backends dislike nulls)
    ...(body.reason ? { Reason: body.reason } : {}),
  };

  const res = await fetch(`${API_BASE}/api/interactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `POST /api/interactions failed: ${res.status}`);
  }

  // Your handler returns Result.Success(); often with empty body (200/204).
  // Be resilient to both JSON and empty responses.
  const ct = res.headers.get("content-type");
  if (res.status === 204 || !ct || !ct.includes("application/json")) {
    return null;
  }
  return res.json().catch(() => null);
}
