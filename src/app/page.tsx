import { RtspPastePlayer } from "@/components/RtspPastePlayer";
import { PackageGuide } from "@/components/PackageGuide";
import { SeoContent } from "@/components/SeoContent";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 90% 55% at 15% -5%, rgba(255,122,61,0.28), transparent 50%)," +
            "radial-gradient(ellipse 70% 45% at 95% 20%, rgba(56,140,255,0.18), transparent 45%)," +
            "linear-gradient(165deg, #07111f 0%, #0a1628 42%, #06101c 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.09]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(244,247,251,0.7) 1px, transparent 1px)," +
            "linear-gradient(90deg, rgba(244,247,251,0.7) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "linear-gradient(180deg, black 0%, transparent 65%)",
        }}
      />

      <RtspPastePlayer />
      <PackageGuide />
      <SeoContent />
    </main>
  );
}
