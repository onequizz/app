/**
 * Effets sonores synthétisés avec la Web Audio API : aucun fichier audio à charger.
 */
let ctx: AudioContext | null = null;
let enabled = true;

export function setSoundEnabled(v: boolean) {
  enabled = v;
}

function audio(): AudioContext | null {
  if (!enabled || typeof window === "undefined") return null;
  ctx ??= new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(
  freq: number,
  { start = 0, duration = 0.12, type = "sine", gain = 0.12, slideTo }: {
    start?: number;
    duration?: number;
    type?: OscillatorType;
    gain?: number;
    slideTo?: number;
  } = {},
) {
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + start;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + duration);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(g).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

export const sfx = {
  tick: () => tone(1400, { duration: 0.035, type: "square", gain: 0.035 }),
  land: () => {
    tone(660, { duration: 0.1, type: "triangle" });
    tone(990, { start: 0.08, duration: 0.18, type: "triangle" });
  },
  click: () => tone(520, { duration: 0.06, type: "sine", gain: 0.08 }),
  miss: () => tone(220, { duration: 0.25, type: "sawtooth", gain: 0.06, slideTo: 140 }),
  success: () => {
    [523.25, 659.25, 783.99].forEach((f, i) =>
      tone(f, { start: i * 0.08, duration: 0.22, type: "triangle", gain: 0.11 }),
    );
  },
  combo: (level: number) => {
    const base = 600 + level * 80;
    [base, base * 1.25, base * 1.5, base * 2].forEach((f, i) =>
      tone(f, { start: i * 0.05, duration: 0.15, type: "square", gain: 0.05 }),
    );
  },
  reveal: () => {
    tone(392, { duration: 0.3, type: "triangle", gain: 0.1 });
    tone(311.13, { start: 0.22, duration: 0.45, type: "triangle", gain: 0.1 });
  },
  finish: () => {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
      tone(f, { start: i * 0.11, duration: 0.35, type: "triangle", gain: 0.1 }),
    );
  },
};
