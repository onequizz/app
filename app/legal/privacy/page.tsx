import type { Metadata } from "next";
import { LegalScreen } from "@/components/legal/LegalScreen";

export const metadata: Metadata = { title: "OneQuizz — Confidentialité" };

export default function Page() {
  return <LegalScreen doc="privacy" />;
}
