'use client';

/**
 * MiniHearth — a tiny wood-fire (flames + embers + logs) that lives at the
 * top-left of the menu page. Canvas is tiny (72×58) so the cost is negligible;
 * pauses automatically when scrolled off-screen or the tab is hidden.
 */
import { useEffect, useRef } from 'react';

function sprite(size: number, r: number, g: number, b: number, a: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const x = c.getContext('2d');
  if (!x) return c;
  const grad = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, `rgba(${r},${g},${b},${a})`);
  grad.addColorStop(0.4, `rgba(${r},${g},${b},${a * 0.4})`);
  grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
  x.fillStyle = grad;
  x.fillRect(0, 0, size, size);
  return c;
}

interface FP {
  x: number;
  y: number;
  vy: number;
  w: number;
  life: number;
  max: number;
  a: number;
  core: boolean;
  swA: number;
  swF: number;
  ph: number;
}

const W = 72;
const H = 58;

export default function MiniHearth({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    const flame = sprite(64, 255, 110, 50, 0.6);
    const core = sprite(64, 255, 214, 150, 0.9);
    const ember = sprite(32, 255, 190, 70, 1);

    const flames: FP[] = [];
    const embers: FP[] = [];
    let raf = 0;
    let running = true;
    let t = 0;
    let last = performance.now();

    const spawnF = (pre = false) => {
      const max = 26 + Math.random() * 22;
      flames.push({
        x: 36 + ((Math.random() + Math.random()) - 1) * 20,
        y: H - 8 + Math.random() * 4,
        vy: -(0.5 + Math.random() * 0.65),
        w: 6 + Math.random() * 11,
        life: pre ? Math.random() * max : 0,
        max,
        a: 0.4 + Math.random() * 0.35,
        core: Math.random() < 0.5,
        swA: 2 + Math.random() * 4,
        swF: 0.03 + Math.random() * 0.05,
        ph: Math.random() * 6.28,
      });
    };
    const spawnE = (pre = false) => {
      const max = 60 + Math.random() * 60;
      embers.push({
        x: 36 + ((Math.random() + Math.random()) - 1) * 24,
        y: H - 8,
        vy: -(0.7 + Math.random() * 0.9),
        w: 1 + Math.random() * 1.6,
        life: pre ? Math.random() * max : 0,
        max,
        a: 0.5 + Math.random() * 0.5,
        core: false,
        swA: 3 + Math.random() * 6,
        swF: 0.02 + Math.random() * 0.04,
        ph: Math.random() * 6.28,
      });
    };
    for (let i = 0; i < 14; i++) spawnF(true);
    for (let i = 0; i < 5; i++) spawnE(true);

    const tick = (now: number) => {
      if (!running) return;
      const step = Math.min(48, now - last) / 16.7;
      last = now;
      t += step * 16.7;
      ctx.clearRect(0, 0, W, H);

      const flick = Math.max(0, 0.5 + 0.5 * Math.sin(t * 0.012) + 0.2 * Math.sin(t * 0.031));
      const g = ctx.createRadialGradient(36, H - 6, 0, 36, H - 6, 30);
      g.addColorStop(0, `rgba(255,110,46,${0.16 + 0.07 * flick})`);
      g.addColorStop(1, 'rgba(255,110,46,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      if (flames.length < 20 && Math.random() < 0.5) spawnF();
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
        const x = p.x + Math.sin(t * p.swF + p.ph) * p.swA;
        const fw = p.w * (1 - 0.3 * tt);
        const fh = p.w * 1.8 * (0.8 + 0.5 * (1 - tt));
        const fade = tt < 0.2 ? tt / 0.2 : 1 - tt;
        ctx.globalAlpha = p.a * fade;
        ctx.drawImage(flame, x - fw / 2, p.y - fh / 2, fw, fh);
        if (p.core) {
          ctx.globalAlpha = p.a * fade * 0.8;
          ctx.drawImage(core, x - fw * 0.2, p.y - fh * 0.6, fw * 0.4, fh * 0.5);
        }
      }
      if (embers.length < 7 && Math.random() < 0.1) spawnE();
      for (let i = embers.length - 1; i >= 0; i--) {
        const p = embers[i];
        p.life += step;
        const tt = p.life / p.max;
        if (tt >= 1) {
          embers.splice(i, 1);
          continue;
        }
        p.y += p.vy * step;
        const x = p.x + Math.sin(t * p.swF + p.ph) * p.swA;
        const tw = 0.6 + 0.4 * Math.sin(t * 0.05 + p.ph);
        const fade = tt < 0.15 ? tt / 0.15 : 1 - tt;
        ctx.globalAlpha = p.a * fade * tw;
        const s = p.w * 5;
        ctx.drawImage(ember, x - s / 2, p.y - s / 2, s, s);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !running) {
          running = true;
          last = performance.now();
          raf = requestAnimationFrame(tick);
        } else if (!e.isIntersecting && running) {
          running = false;
          cancelAnimationFrame(raf);
        }
      },
      { threshold: 0 },
    );
    io.observe(canvas);

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
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return (
    <div className={`relative h-[58px] w-[72px] shrink-0 ${className}`} aria-hidden="true">
      <canvas ref={ref} className="absolute inset-0" />
      <svg width="72" height="15" viewBox="0 0 72 15" className="absolute bottom-0 left-0 z-[1]">
        <rect x="4" y="8" width="64" height="6" rx="3" fill="#1b120b" stroke="rgba(255,160,70,0.35)" strokeWidth="1" />
        <rect
          x="15"
          y="4"
          width="45"
          height="5"
          rx="2.5"
          fill="#20150d"
          stroke="rgba(255,160,70,0.22)"
          strokeWidth="1"
          transform="rotate(-3 37 6)"
        />
        <circle cx="16" cy="12" r="1.4" fill="rgba(255,190,70,0.6)" />
        <circle cx="56" cy="11" r="1.2" fill="rgba(255,150,60,0.5)" />
      </svg>
    </div>
  );
}
