import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://hevc-player-demo.example.com";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/v1/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
