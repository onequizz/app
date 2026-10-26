import type { Metadata } from "next";
import { ExploreScreen } from "@/components/explore/ExploreScreen";

export const metadata: Metadata = { title: "OneQuizz — Atlas" };

export default function ExplorePage() {
  return <ExploreScreen />;
}
