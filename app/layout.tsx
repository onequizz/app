import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { cookies, headers } from "next/headers";
import { Bricolage_Grotesque, Cairo, Manrope } from "next/font/google";
import { Providers } from "@/components/Providers";
import { Splash } from "@/components/ui/Splash";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, LOCALES, negotiateLocale, parseAcceptLanguage } from "@/lib/i18n/config";
import { SETTINGS_STORAGE_KEY } from "@/store/settings";
import "./globals.css";

const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const cairo = Cairo({ subsets: ["arabic", "latin"], variable: "--font-cairo" });

export const metadata: Metadata = {
  title: "OneQuizz — Find the Country / Capital",
  description: "Jeu de géographie : trouve pays, capitales, fleuves, montagnes, déserts et mers sur une carte interactive.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f1ece1" },
    { media: "(prefers-color-scheme: dark)", color: "#070d18" },
  ],
};

/**
 * Exécuté avant le premier rendu : langue, sens d'écriture et thème, sans flash.
 * Sans choix enregistré, la langue est celle du navigateur et le thème celui du système.
 */
const BOOT_SCRIPT = `(function(){try{
var d=document.documentElement;
var m=document.cookie.match(/(?:^|; )${LOCALE_COOKIE}=(\\w+)/);
var L=${JSON.stringify(LOCALES)};
var l=m&&L.indexOf(m[1])>=0?m[1]:"${DEFAULT_LOCALE}";
if(!m){var n=navigator.languages||[navigator.language];for(var i=0;i<n.length;i++){var b=String(n[i]).split("-")[0].toLowerCase();if(L.indexOf(b)>=0){l=b;break;}}}
d.lang=l;d.dir=l==="ar"?"rtl":"ltr";
var s=JSON.parse(localStorage.getItem("${SETTINGS_STORAGE_KEY}")||"{}");
var t=(s.state&&s.state.theme)||"system";
if(t==="system")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";
d.dataset.theme=t;
}catch(e){}})()`;

async function LocaleRoot({ children }: { children: React.ReactNode }) {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale = isLocale(value)
    ? value
    : negotiateLocale(parseAcceptLanguage((await headers()).get("accept-language")));
  return <Providers initialLocale={locale}>{children}</Providers>;
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
