// Time-based animation helpers (spec Section 15.2). Everything is a pure function of time,
// so scrubbing backwards, seeking and export all give identical frames.

/** CSS-style cubic-bezier(x1, y1, x2, y2): Newton-Raphson, with bisection as a fallback. */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): (p: number) => number {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sy = (t: number) => ((ay * t + by) * t + cy) * t;
  const dx = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  const solve = (x: number) => {
    let t = x;
    for (let i = 0; i < 8; i++) {
      const err = sx(t) - x;
      if (Math.abs(err) < 1e-6) return t;
      const d = dx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= err / d;
    }
    let lo = 0, hi = 1;
    t = x;
    for (let i = 0; i < 30; i++) {
      const v = sx(t);
      if (Math.abs(v - x) < 1e-6) break;
      if (v < x) lo = t; else hi = t;
      t = (lo + hi) / 2;
    }
    return t;
  };
  return (p) => (p <= 0 ? 0 : p >= 1 ? 1 : sy(solve(p)));
}

export const EASE = {
  enter: cubicBezier(0.16, 1, 0.3, 1), // fast start, gentle landing (appearing)
  exit: cubicBezier(0.7, 0, 0.84, 0), // slow start, accelerates away
  move: cubicBezier(0.65, 0, 0.35, 1), // symmetric, for things moving on screen
  playful: cubicBezier(0.34, 1.56, 0.64, 1), // overshoots then settles
  linear: (p: number) => p,
};

export const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

/** 0→1 progress of an animation that starts at `start` and lasts `duration`, eased. */
export function progress(t: number, start: number, duration: number, ease: (p: number) => number = EASE.enter): number {
  return ease(clamp(duration <= 0 ? 1 : (t - start) / duration));
}

/** Delay for item `index` in a staggered list; the total spread never exceeds `cap` seconds. */
export function stagger(index: number, count: number, each: number, cap = 0.7): number {
  const step = count > 1 ? Math.min(each, cap / (count - 1)) : 0;
  return index * step;
}

/** Analytic damped spring from 0 to 1, evaluated at time t (no stepping). */
export function spring(t: number, { stiffness = 300, damping = 30, mass = 1 } = {}): number {
  if (t <= 0) return 0;
  const w0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  if (zeta < 1) {
    const wd = w0 * Math.sqrt(1 - zeta * zeta);
    return 1 - Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + ((zeta * w0) / wd) * Math.sin(wd * t));
  }
  return 1 - Math.exp(-w0 * t) * (1 + w0 * t); // critically damped (or over-damped, approximated)
}

/** Timing constants (spec Section 15.2), in seconds. */
export const TIMING = {
  pop: 0.18,
  card: 0.32,
  title: 0.6,
  exit: 0.25,
  move: 0.8,
  staggerEach: 0.06,
  anticipation: 0.08,
};
