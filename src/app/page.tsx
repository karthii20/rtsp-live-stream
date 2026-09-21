import { RtspPastePlayer } from "@/components/RtspPastePlayer";
import { PackageGuide } from "@/components/PackageGuide";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Atmosphere: warm amber wash + grid — not a flat fill */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(232,165,75,0.18), transparent 55%)," +
            "radial-gradient(ellipse 55% 40% at 100% 45%, rgba(196,132,46,0.1), transparent 50%)," +
            "linear-gradient(180deg, #0e0f14 0%, #121018 45%, #0a0b10 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(242,239,232,0.55) 1px, transparent 1px)," +
            "linear-gradient(90deg, rgba(242,239,232,0.55) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "linear-gradient(180deg, black 0%, transparent 70%)",
        }}
      />

      <RtspPastePlayer />
      <PackageGuide />
    </main>
  );
}
