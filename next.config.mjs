// next.config.mjs
import createNextIntlPlugin from "next-intl/plugin";
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const baseConfig = {
  reactStrictMode: true,
  experimental: { serverActions: {} },
  images: {
    remotePatterns: [
      // The Vision
      { protocol: "https", hostname: "thevision.com" },
      { protocol: "https", hostname: "*.thevision.com" },

      // ANSA
      { protocol: "https", hostname: "*.ansa.it" },

      // Adnkronos
      { protocol: "https", hostname: "*.adnkronos.com" },
      { protocol: "https", hostname: "cdn.adnkronos.com" },

      // Il Post (site + CDN)
      { protocol: "https", hostname: "*.ilpost.it" },
      { protocol: "https", hostname: "static.ilpost.it" },
      { protocol: "https", hostname: "*.cdnilpost.com" },      // ← add this
      { protocol: "https", hostname: "static-prod.cdnilpost.com" }, // ← explicit host seen in your data

      // Internazionale
      { protocol: "https", hostname: "*.internazionale.it" },

      // Il Sole 24 Ore
      { protocol: "https", hostname: "*.res.24o.it" },

      // Common generic CDNs (optional)
      { protocol: "https", hostname: "*.cloudfront.net" },
      { protocol: "https", hostname: "*.akamaihd.net" }
    ]
  }
};

export default withNextIntl(baseConfig);
