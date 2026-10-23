import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { Bricolage_Grotesque, Cairo, Manrope } from "next/font/google";
import { Providers } from "@/components/Providers";
import { Splash } from "@/components/ui/Splash";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE } from "@/lib/i18n/config";
import { SETTINGS_STORAGE_KEY } from "@/store/settings";
import "./globals.css";

const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const cairo = Cairo({ subsets: ["arabic", "latin"], variable: "--font-cairo" });

export const metadata: Metadata = {
  title: "OneQuizz — Find the Country / Capital",
  description: "Jeu de géographie : trouve les pays et les capitales sur une carte interactive.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f1ece1" },
    { media: "(prefers-color-scheme: dark)", color: "#070d18" },
  ],
};

/** Exécuté avant le premier rendu : langue, sens d'écriture et thème, sans flash. */
const BOOT_SCRIPT = `(function(){try{
var d=document.documentElement;
var m=document.cookie.match(/(?:^|; )${LOCALE_COOKIE}=(\\w+)/);
var l=m?m[1]:"${DEFAULT_LOCALE}";
d.lang=l;d.dir=l==="ar"?"rtl":"ltr";
var s=JSON.parse(localStorage.getItem("${SETTINGS_STORAGE_KEY}")||"{}");
var t=(s.state&&s.state.theme)||"system";
if(t==="system")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";
d.dataset.theme=t;
}catch(e){}})()`;

async function LocaleRoot({ children }: { children: React.ReactNode }) {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return <Providers initialLocale={isLocale(value) ? value : DEFAULT_LOCALE}>{children}</Providers>;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang={DEFAULT_LOCALE}
      dir="ltr"
      data-theme="dark"
      suppressHydrationWarning
      className={`${bricolage.variable} ${manrope.variable} ${cairo.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
      </head>
      <body>
        <Suspense fallback={<Splash />}>
          <LocaleRoot>{children}</LocaleRoot>
        </Suspense>
      </body>
    </html>
  );
}
