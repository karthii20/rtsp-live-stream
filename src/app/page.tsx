import { RtspPastePlayer } from "@/components/RtspPastePlayer";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-100 via-white to-teal-50 dark:from-zinc-950 dark:via-zinc-950 dark:to-teal-950/30">
      <RtspPastePlayer />
    </main>
  );
}
