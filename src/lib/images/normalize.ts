export function normalizeImageUrl(imageUrl: string | null | undefined, pageUrl: string): string | null {
  if (!imageUrl || imageUrl.trim() === "") return null;
  try {
    const absolute = new URL(imageUrl, pageUrl);
    if (absolute.protocol === "http:") absolute.protocol = "https:";
    return absolute.toString();
  } catch {
    return null;
  }
}
