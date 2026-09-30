/** Use one public origin for canonical URLs, social metadata, and crawl files. */
export const siteUrl = new URL(
  process.env.NEXT_PUBLIC_SITE_URL || "https://thertsp.in",
).origin;
