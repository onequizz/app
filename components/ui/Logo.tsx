import clsx from "clsx";

/** Symbole du logo, dans la version adaptée au thème (clair ou sombre). */
export function LogoMark({ px, className }: { px: number; className?: string }) {
  const img = (src: string, theme: string) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" width={px} height={px} draggable={false} className={clsx("shrink-0 object-contain", theme, className)} />
  );
  return (
    <>
      {img("/brand/logo_clair.png", "dark:hidden")}
      {img("/brand/logo_sombre.png", "hidden dark:block")}
    </>
  );
}

/** Logo : symbole + nom « OneQuizz ». */
export function Logo({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const px = { sm: 28, md: 36, lg: 56 }[size];
  return (
    <span dir="ltr" className={clsx("inline-flex items-center gap-2 font-display font-extrabold", className)}>
      <LogoMark px={px} />
      <span className={clsx({ sm: "text-lg", md: "text-xl", lg: "text-4xl" }[size])}>
        One<span className="text-accent">Quizz</span>
      </span>
    </span>
  );
}
