'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Bonfire from './Bonfire';

const SPLASH_MS = 4700;

/* ── Sprite helpers ─────────────────────────────────────── */

function makeSprite(size: number, r: number, g: number, b: number, a: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  if (!ctx) return c;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, `rgba(${r},${g},${b},${a})`);
  grad.addColorStop(0.35, `rgba(${r},${g},${b},${a * 0.42})`);
  grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return c;
}

interface P {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  life: number;
  max: number;
  a: number;
  grow: number;
  core: boolean;
  swayAmp: number;
  swayFreq: number;
  phase: number;
}

/* ── Natural wood-fire hearth (canvas): flames + embers + lit smoke ── */

function FireCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let running = true;
    let last = performance.now();
    let t = 0;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    const flameBody = makeSprite(128, 255, 110, 50, 0.6);   // red-orange flame
    const flameCore = makeSprite(128, 255, 214, 150, 0.9);  // yellow-hot core
    const smokeSprite = makeSprite(160, 236, 190, 170, 0.22); // fire-lit smoke
    const emberSprite = makeSprite(64, 255, 190, 70, 1);    // golden ember

    const flames: P[] = [];
    const smoke: P[] = [];
    const embers: P[] = [];

    const resize = () => {
      canvas.width = Math.floor(window.innerWidth * DPR);
      canvas.height = Math.floor(window.innerHeight * DPR);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const W = () => window.innerWidth;
    const H = () => window.innerHeight;

    const spawnFlame = (pre = false) => {
      const max = 34 + Math.random() * 42;
      flames.push({
        x: W() * 0.5 + ((Math.random() + Math.random() + Math.random()) / 1.5 - 1) * W() * 0.48,
        y: H() * (0.99 + Math.random() * 0.03),
        vx: 0,
        vy: -(0.9 + Math.random() * 1.2),
        w: 16 + Math.random() * 40,
        life: pre ? Math.random() * max : 0,
        max,
        a: 0.42 + Math.random() * 0.4,
        grow: 0,
        core: Math.random() < 0.55,
        swayAmp: 4 + Math.random() * 10,
        swayFreq: 0.02 + Math.random() * 0.05,
        phase: Math.random() * Math.PI * 2,
      });
    };

    const spawnSmoke = (pre = false) => {
      const max = 260 + Math.random() * 140;
      smoke.push({
        x: W() * 0.5 + ((Math.random() + Math.random() + Math.random()) / 1.5 - 1) * W() * 0.42,
        y: H() * (0.86 + Math.random() * 0.08),
        vx: 0,
        vy: -(0.45 + Math.random() * 0.5),
        w: 60 + Math.random() * 80,
        life: pre ? Math.random() * max : 0,
        max,
        a: 0.5 + Math.random() * 0.5,
        grow: 0.1 + Math.random() * 0.14,
        core: false,
        swayAmp: 14 + Math.random() * 26,
        swayFreq: 0.004 + Math.random() * 0.008,
        phase: Math.random() * Math.PI * 2,
      });
    };

    const spawnEmber = (pre = false) => {
      const max = 130 + Math.random() * 120;
      embers.push({
        x: W() * 0.5 + ((Math.random() + Math.random()) - 1) * W() * 0.4,
        y: H() * (0.97 + Math.random() * 0.04),
        vx: (Math.random() - 0.5) * 0.5,
        vy: -(1.3 + Math.random() * 1.7),
        w: 1.6 + Math.random() * 3.2,
        life: pre ? Math.random() * max : 0,
        max,
        a: 0.55 + Math.random() * 0.45,
        grow: 0,
        core: false,
        swayAmp: 8 + Math.random() * 18,
        swayFreq: 0.01 + Math.random() * 0.03,
        phase: Math.random() * Math.PI * 2,
      });
    };

    for (let i = 0; i < 46; i++) spawnFlame(true);
    for (let i = 0; i < 16; i++) spawnSmoke(true);
    for (let i = 0; i < 18; i++) spawnEmber(true);

    const tick = (now: number) => {
      if (!running) return;
      const dtMs = Math.min(48, now - last);
      last = now;
      t += dtMs;
      const step = dtMs / 16.7;
      const w = window.innerWidth;
      const h = window.innerHeight;

      ctx.clearRect(0, 0, w, h);

      const flick = Math.max(0, 0.55 + 0.45 * Math.sin(t * 0.011) + 0.25 * Math.sin(t * 0.027 + 1.7));
      const g1 = ctx.createRadialGradient(w / 2, h * 1.04, 0, w / 2, h * 1.04, h * 0.6);
      g1.addColorStop(0, `rgba(255,106,46,${0.16 + 0.05 * flick})`);
      g1.addColorStop(1, 'rgba(255,106,46,0)');
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, w, h);
      const g2 = ctx.createRadialGradient(w / 2, h, 0, w / 2, h, w * 0.34);
      g2.addColorStop(0, `rgba(255,201,61,${0.09 + 0.06 * flick})`);
      g2.addColorStop(1, 'rgba(255,201,61,0)');
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, w, h);

      if (flames.length < 64 && Math.random() < 0.75) spawnFlame();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = flames.length - 1; i >= 0; i--) {
        const p = flames[i];
        p.life += step;
        const tt = p.life / p.max;
        if (tt >= 1) {
          flames.splice(i, 1);
          continue;
        }
        p.y += p.vy * step;
        const x = p.x + Math.sin(t * p.swayFreq + p.phase) * p.swayAmp;
        const fw = p.w * (1 - 0.3 * tt);
        const fh = p.w * 1.7 * (0.8 + 0.5 * (1 - tt));
        const fade = tt < 0.18 ? tt / 0.18 : 1 - tt;
        ctx.globalAlpha = p.a * fade;
        ctx.drawImage(flameBody, x - fw / 2, p.y - fh / 2, fw, fh);
        if (p.core) {
          ctx.globalAlpha = p.a * fade * 0.85;
          ctx.drawImage(flameCore, x - fw * 0.22, p.y - fh * 0.62, fw * 0.44, fh * 0.55);
        }
      }
      ctx.globalCompositeOperation = 'source-over';

      if (smoke.length < 24 && Math.random() < 0.09) spawnSmoke();
      for (let i = smoke.length - 1; i >= 0; i--) {
        const p = smoke[i];
        p.life += step;
        const tt = p.life / p.max;
        if (tt >= 1) {
          smoke.splice(i, 1);
          continue;
        }
        p.y += p.vy * step;
        p.w += p.grow * step;
        const x = p.x + Math.sin(t * p.swayFreq + p.phase) * p.swayAmp;
        const fade = tt < 0.2 ? tt / 0.2 : 1 - (tt - 0.2) / 0.8;
        ctx.globalAlpha = p.a * fade;
        ctx.drawImage(smokeSprite, x - p.w / 2, p.y - p.w / 2, p.w, p.w * 1.25);
      }

      ctx.globalCompositeOperation = 'lighter';
      if (embers.length < 26 && Math.random() < 0.22) spawnEmber();
      for (let i = embers.length - 1; i >= 0; i--) {
        const p = embers[i];
        p.life += step;
        const tt = p.life / p.max;
        if (tt >= 1) {
          embers.splice(i, 1);
          continue;
        }
        p.y += p.vy * step;
        const x = p.x + Math.sin(t * p.swayFreq + p.phase) * p.swayAmp + p.vx * p.life;
        const twinkle = 0.6 + 0.4 * Math.sin(t * 0.03 + p.phase);
        const fade = tt < 0.12 ? tt / 0.12 : 1 - tt;
        ctx.globalAlpha = p.a * fade * twinkle;
        const s = p.w * 6;
        ctx.drawImage(emberSprite, x - s / 2, p.y - s / 2, s, s);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onVis = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else {
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0" aria-hidden="true" />;
}

/* ── Wooden logs silhouettes at the base of the fire ────── */

function LogsSvg() {
  return (
    <svg
      width="300"
      height="86"
      viewBox="0 0 300 86"
      className="absolute bottom-[-4px] left-1/2 z-[1] -translate-x-1/2 opacity-90"
      aria-hidden="true"
    >
      <rect x="34" y="54" width="232" height="17" rx="8.5" fill="#17100c" stroke="rgba(255,150,60,0.3)" strokeWidth="1.4" />
      <rect
        x="56"
        y="40"
        width="196"
        height="15"
        rx="7.5"
        fill="#1c1410"
        stroke="rgba(255,180,80,0.22)"
        strokeWidth="1.2"
        transform="rotate(-3.5 154 47)"
      />
      <circle cx="70" cy="63" r="3" fill="rgba(255,190,70,0.55)" />
      <circle cx="118" cy="66" r="2.2" fill="rgba(255,150,60,0.45)" />
      <circle cx="208" cy="64" r="2.6" fill="rgba(255,190,70,0.5)" />
      <circle cx="248" cy="61" r="2" fill="rgba(255,150,60,0.4)" />
    </svg>
  );
}

/* ── Faux QR pattern (pure decorative) ──────────────────── */

function FauxQR() {
  const cells: Array<[number, number]> = [];
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let y = 0; y < 13; y++) {
    for (let x = 0; x < 13; x++) {
      const inFinder = (x < 4 && y < 4) || (x > 8 && y < 4) || (x < 4 && y > 8);
      if (!inFinder && rand() > 0.52) cells.push([x, y]);
    }
  }
  const finder = (fx: number, fy: number) => (
    <g key={`f-${fx}-${fy}`}>
      <rect x={fx * 8 + 8} y={fy * 8 + 8} width={28} height={28} rx={4} fill="none" stroke="#ffc93d" strokeWidth={4} />
      <rect x={fx * 8 + 16} y={fy * 8 + 16} width={12} height={12} rx={2} fill="#ffc93d" />
    </g>
  );
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full">
      {cells.map(([x, y], i) => (
        <rect key={i} x={x * 8 + 8} y={y * 8 + 8} width={5.4} height={5.4} rx={1.4} fill="rgba(255,201,61,0.55)" />
      ))}
      {finder(0, 0)}
      {finder(9, 0)}
      {finder(0, 9)}
    </svg>
  );
}

/* ── Splash ─────────────────────────────────────────────── */

export default function Splash({ onDone }: { onDone: () => void }) {
  const [qrStage, setQrStage] = useState(true);
  const [logoIn, setLogoIn] = useState(false);
  const localDone = useRef(false);

  const finish = useCallback(() => {
    if (localDone.current) return;
    localDone.current = true;
    onDone();
  }, [onDone]);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t1 = window.setTimeout(() => setQrStage(false), 1000);
    const t2 = window.setTimeout(() => setLogoIn(true), 1100);
    const t3 = window.setTimeout(finish, reduced ? 1900 : SPLASH_MS);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [finish]);

  return (
    <motion.div
      className="fixed inset-0 z-50 overflow-hidden bg-ink"
      exit={{ opacity: 0, scale: 0.9, filter: 'blur(14px)' }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      role="status"
      aria-label="The Umbrella Ella — welcome"
    >
      <div className="ambient-glow pointer-events-none absolute inset-0" />
      <LogsSvg />
      <FireCanvas />
      <div className="grain pointer-events-none absolute inset-0" />

      <button
        onClick={finish}
        className="absolute right-4 top-4 z-10 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[11px] font-semibold tracking-[0.18em] text-white/50 backdrop-blur transition active:scale-95 hover:text-sun"
      >
        SKIP
      </button>

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6">
        {/* QR scan intro */}
        <motion.div
          className="absolute flex flex-col items-center gap-5"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={qrStage ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.06, filter: 'blur(10px)' }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        >
          <div
            className="relative h-[152px] w-[152px] rounded-2xl"
            style={{ ['--scan-h' as string]: '128px' }}
          >
            {(['-left-1 -top-1 border-l-2 border-t-2 rounded-tl-xl', '-right-1 -top-1 border-r-2 border-t-2 rounded-tr-xl', '-left-1 -bottom-1 border-l-2 border-b-2 rounded-bl-xl', '-right-1 -bottom-1 border-r-2 border-b-2 rounded-br-xl'] as const).map(
              (pos) => (
                <span key={pos} className={`absolute h-7 w-7 border-sun ${pos}`} />
              ),
            )}
            <div className="absolute inset-3 p-2">
              <FauxQR />
            </div>
            <span className="scanline" />
          </div>
          <p className="font-display text-[10px] font-semibold tracking-[0.42em] text-sun/70">
            SCAN · CRAVE · ORDER
          </p>
        </motion.div>

        {/* Logo reveal above the fire */}
        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0, scale: 0.94, filter: 'blur(16px)', y: 26 }}
          animate={
            logoIn
              ? { opacity: 1, scale: 1, filter: 'blur(0px)', y: 0 }
              : { opacity: 0, scale: 0.94, filter: 'blur(16px)', y: 26 }
          }
          transition={{ duration: 1.15, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="relative">
            <div className="absolute left-1/2 top-1/2 -z-10 h-52 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-flame/25 blur-3xl" />
            <div className="absolute left-1/2 top-1/2 -z-10 h-36 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sun/15 blur-2xl" />
            {/* a real wood fire — where the logo mark used to be */}
            <Bonfire />
          </div>
          <h1 className="text-glow mt-6 font-display text-[36px] font-extrabold leading-none tracking-[0.06em] text-cream">
            THE UMBRELLA <span className="flame-text">ELLA</span>
          </h1>
          <p className="mt-3 font-display text-[12px] font-extrabold tracking-[0.34em] text-sun drop-shadow-[0_0_16px_rgba(255,201,61,0.45)]">
            ROTI &amp; KOTTU HUB
          </p>
          <div className="mt-4 flex items-center gap-3">
            <span className="h-px w-10 bg-gradient-to-r from-transparent to-sun/70" />
            <p className="text-[11px] font-semibold italic tracking-[0.18em] text-white/55">
              Experience the taste of mountains!
            </p>
            <span className="h-px w-10 bg-gradient-to-l from-transparent to-sun/70" />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
