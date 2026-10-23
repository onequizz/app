import type { Metadata } from "next";
import { Suspense } from "react";
import { GameScreen } from "@/components/game/GameScreen";
import { Splash } from "@/components/ui/Splash";

export const metadata: Metadata = { title: "OneQuizz — Play" };

export default function PlayPage() {
  return (
    <Suspense fallback={<Splash />}>
      <GameScreen />
    </Suspense>
  );
}
