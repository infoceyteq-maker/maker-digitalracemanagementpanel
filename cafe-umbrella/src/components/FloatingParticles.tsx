'use client';

import { useMemo } from 'react';

type ParticleKind = 'leaf' | 'chili' | 'spice';

interface Particle {
  kind: ParticleKind;
  left: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
  spin: number;
}

const KINDS: ParticleKind[] = ['leaf', 'chili', 'spice'];

/**
 * Deterministic pseudo-random particle field so the server and client render
 * identical markup (no hydration mismatch) while still looking scattered.
 */
function makeParticles(seed: number, count: number): Particle[] {
  let s = seed;
  const rand = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };

  return Array.from({ length: count }, (_, i) => ({
    kind: KINDS[Math.floor(rand() * KINDS.length)],
    left: Math.round(rand() * 92 + 2),
    size: Math.round(rand() * 5 + 3),
    duration: Math.round((rand() * 4 + 5) * 10) / 10,
    delay: Math.round(rand() * 6 * 10) / 10,
    drift: Math.round((rand() * 44 - 22) * 10) / 10,
    spin: Math.round(rand() * 540 - 90),
  }));
}

/**
 * Slow-drifting chili / curry-leaf / spice motes that keep the dish photography
 * feeling alive, as specified in the customer brief.
 */
export function FloatingParticles({ count = 7, seed = 17 }: { count?: number; seed?: number }) {
  const particles = useMemo(() => makeParticles(seed, count), [seed, count]);

  return (
    <span className="particles" aria-hidden="true">
      {particles.map((p, i) => (
        <span
          key={i}
          className={`particle particle--${p.kind}`}
          style={
            {
              left: `${p.left}%`,
              width: p.size,
              height: p.size,
              '--dur': `${p.duration}s`,
              '--delay': `${p.delay}s`,
              '--drift': `${p.drift}px`,
              '--spin': `${p.spin}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </span>
  );
}
