import { Logo } from "./Logo";

export function Splash() {
  return (
    <div className="graticule-bg grid min-h-full place-items-center">
      <div className="animate-pulse">
        <Logo size="lg" />
      </div>
    </div>
  );
}
