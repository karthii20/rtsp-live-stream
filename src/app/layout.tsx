import type { Metadata } from "next";
import { JetBrains_Mono, Outfit } from "next/font/google";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { JsonLd } from "@/components/JsonLd";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "RTSP Browser Player — H.264 & H.265 | TheRTSP",
    template: "%s | hevc-player",
  },
  description:
    "Play RTSP in your browser with H.264/H.265 video and audio. Try the demo or self-host the open-source IP camera viewer with Docker, React, and hevc-player.",
  keywords: [
    "play RTSP in browser",
    "RTSP player browser",
    "RTSP to browser",
    "H.265 browser player",
    "HEVC web player",
    "H.264 H.265 player",
    "stream IP camera in browser",
    "RTSP H.265",
    "WASM video player",
    "hevc-player npm",
    "MPEG-TS browser player",
    "IP camera web viewer",
  ],
  authors: [{ name: "hevc-player" }],
  creator: "hevc-player",
  category: "technology",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "TheRTSP",
    images: [{ url: "/images/rtsp-browser-player.jpg", alt: "TheRTSP browser player demo" }],
    title: "Play RTSP in Browser | H.264 & H.265 Web Player",
    description:
      "Paste an RTSP URL and play H.264 / H.265 IP camera video with audio in Chrome, Firefox, and Edge. Free live demo of the hevc-player npm package.",
  },
  twitter: {
    card: "summary_large_image",
    images: ["/images/rtsp-browser-player.jpg"],
    title: "Play RTSP in Browser | H.264 & H.265 Web Player",
    description:
      "Live demo: stream RTSP cameras in the browser with WASM H.264 / H.265 + AAC. Built with hevc-player.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "V1vNryIJ3foPi0UDcm0iylTtZZnrY6tJnIgDvc5tMDI",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${jetbrains.variable} antialiased`}>
        <GoogleAnalytics />
        <JsonLd siteUrl={siteUrl} />
        {children}
      </body>
    </html>
  );
}
