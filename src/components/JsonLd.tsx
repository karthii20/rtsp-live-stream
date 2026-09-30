import { FAQS } from "@/lib/rtspFaq";

type JsonLdProps = {
  siteUrl: string;
};

/**
 * Describe the software and visible FAQs; rich-result display is not guaranteed.
 */
export function JsonLd({ siteUrl }: JsonLdProps) {
  const software = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "hevc-player",
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    description:
      "H.264 / H.265 (HEVC) WASM browser player with an FFmpeg RTSP remux gateway. Play IP camera streams in Chrome, Firefox, and Edge.",
    url: siteUrl,
    softwareVersion: "0.5.1",
    downloadUrl: "https://www.npmjs.com/package/hevc-player",
    codeRepository: "https://github.com/karthii20/rtsp-live-stream",
  };

  const webApp = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Play RTSP in Browser — hevc-player demo",
    url: siteUrl,
    description:
      "Free online demo to play RTSP camera streams in the browser with H.264, H.265, and AAC audio.",
    applicationCategory: "MultimediaApplication",
    browserRequirements: "Requires HTML5 and WebAssembly",
  };

  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(software).replace(/</g, "\\u003c") }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webApp).replace(/</g, "\\u003c") }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faq).replace(/</g, "\\u003c") }}
      />
    </>
  );
}
