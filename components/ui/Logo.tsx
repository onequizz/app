import clsx from "clsx";

/** Logo : un « 1 » posé dans une cible, façon repère cartographique. */
export function Logo({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const px = { sm: 26, md: 32, lg: 48 }[size];
  return (
    <span
      dir="ltr"
      className={clsx("inline-flex items-center gap-2 font-display font-extrabold", className)}
    >
      <svg width={px} height={px} viewBox="0 0 48 48" aria-hidden>
        <circle cx="24" cy="24" r="21" fill="none" stroke="var(--accent)" strokeWidth="3" />
        <circle cx="24" cy="24" r="13" fill="none" stroke="var(--accent)" strokeWidth="2" opacity="0.45" />
        <path d="M21 16.5 L26.5 13 V35" fill="none" stroke="var(--text)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className={clsx({ sm: "text-lg", md: "text-xl", lg: "text-4xl" }[size])}>
        One<span className="text-accent">Quizz</span>
      </span>
    </span>
  );
}
