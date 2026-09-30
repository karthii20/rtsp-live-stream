import { siteUrl } from "@/lib/site";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/v1/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
