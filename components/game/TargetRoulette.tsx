"use client";

import { animate, motion, useMotionValue, useTransform, useVelocity } from "framer-motion";
import { Landmark, MapPin } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { sfx } from "@/lib/audio/sfx";
import { targetLabel, targetPool } from "@/lib/data/countries";
import { shuffle } from "@/lib/game/engine";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Target, TargetMode, Zone } from "@/lib/types";

// Assez haut pour un nom en arabe (Cairo, interligne 1,75) sans rogner les lettres.
const ITEM_H = 64;

function KindIcon({ kind, size = 20 }: { kind: Target["kind"]; size?: number }) {
  return kind === "capital" ? (
    <Landmark size={size} className="shrink-0 text-accent" />
  ) : (
    <MapPin size={size} className="shrink-0 text-accent" />
  );
}

/**
 * Machine à sous : une bande de cibles défile puis décélère jusqu'à la cible tirée.
 * Le flou de mouvement suit la vitesse de défilement.
 */
export function TargetRoulette({
  target,
  zone,
  mode,
  fast = false,
  spinning,
  onDone,
}: {
  target: Target;
  zone: Zone;
  mode: TargetMode;
  fast?: boolean;
  spinning: boolean;
  onDone: () => void;
}) {
  const { locale } = useI18n();
  const count = fast ? 10 : 26;

  const items = useMemo(() => {
    const pool = targetPool(zone, mode).filter((t) => t.code !== target.code || t.kind !== target.kind);
    const filler = shuffle(pool).slice(0, count);
    return [...filler, target];
    // Une nouvelle bande seulement quand la cible change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  const finalY = -(items.length - 1) * ITEM_H;
  const y = useMotionValue(spinning ? 0 : finalY);
  const velocity = useVelocity(y);
  const filter = useTransform(velocity, (v) => `blur(${Math.min(5, Math.abs(v) / 900)}px)`);
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  });

  useEffect(() => {
    if (!spinning) {
      y.set(finalY);
      return;
    }
    y.set(0);
    let lastIndex = 0;
    const controls = animate(y, finalY, {
      duration: fast ? 0.9 : 2.6,
      ease: [0.15, 0.85, 0.25, 1],
      onUpdate: (v) => {
        const idx = Math.round(-v / ITEM_H);
        if (idx !== lastIndex) {
          lastIndex = idx;
          sfx.tick();
        }
      },
      onComplete: () => {
        sfx.land();
        done.current();
      },
    });
    return () => controls.stop();
  }, [spinning, finalY, fast, y]);

  return (
    <div
      className="relative overflow-hidden"
      style={{
        height: ITEM_H,
        maskImage: spinning
          ? "linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)"
          : undefined,
      }}
    >
      <motion.ul style={{ y, filter }} className="will-change-transform">
        {items.map((t, i) => (
          <li
            key={`${t.kind}-${t.code}-${i}`}
            style={{ height: ITEM_H }}
            className="flex items-center justify-center gap-2.5 px-2"
          >
            <KindIcon kind={t.kind} size={22} />
            <span className="truncate font-display text-[clamp(1.4rem,5vw,2.25rem)] leading-none font-extrabold">
              {targetLabel(t, locale)}
            </span>
          </li>
        ))}
      </motion.ul>
    </div>
  );
}
