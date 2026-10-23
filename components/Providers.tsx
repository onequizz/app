"use client";

import { useEffect } from "react";
import { MotionConfig } from "framer-motion";
import { setSoundEnabled } from "@/lib/audio/sfx";
import { I18nProvider } from "@/lib/i18n/I18nProvider";
import type { Locale } from "@/lib/i18n/config";
import { useSettings } from "@/store/settings";
import { useStats } from "@/store/stats";

function applyTheme(theme: "system" | "light" | "dark") {
  const resolved =
    theme === "system"
      ? matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;
  document.documentElement.dataset.theme = resolved;
}

export function Providers({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const theme = useSettings((s) => s.theme);
  const sound = useSettings((s) => s.sound);

  useEffect(() => {
    void useSettings.persist.rehydrate();
    void useStats.persist.rehydrate();
  }, []);

  useEffect(() => {
    applyTheme(theme);
    if (theme !== "system") return;
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  useEffect(() => setSoundEnabled(sound), [sound]);

  return (
    <I18nProvider initialLocale={initialLocale}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </I18nProvider>
  );
}
