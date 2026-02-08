import { getRequestConfig } from "next-intl/server";

const SUPPORTED = ["en", "it"] as const;
type SupportedLocale = (typeof SUPPORTED)[number];

export default getRequestConfig(async ({ locale }) => {
  // Clamp locale to supported ones, default to "it"
  const l: SupportedLocale = SUPPORTED.includes(locale as SupportedLocale)
    ? (locale as SupportedLocale)
    : "it";

  // Dynamically import the right message bundle
  const messages = (await import(`../messages/${l}.json`)).default;

  return {
    locale: l,
    messages,
  };
});
