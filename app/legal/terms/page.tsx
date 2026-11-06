import type { Metadata } from "next";
import { LegalScreen } from "@/components/legal/LegalScreen";

export const metadata: Metadata = { title: "OneQuizz — Conditions d'utilisation" };

export default function Page() {
  return <LegalScreen doc="terms" />;
}
