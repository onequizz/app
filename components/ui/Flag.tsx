import clsx from "clsx";

/** Drapeau SVG local (public/flags), au format 3:2. */
export function Flag({ code, className, title }: { code: string; className?: string; title?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/flags/${code}.svg`}
      alt={title ?? ""}
      className={clsx("aspect-[3/2] rounded-[3px] object-cover shadow-sm ring-1 ring-black/10", className)}
    />
  );
}
