'use client';

/**
 * Bonfire — a realistic centered wood fire (flames + embers + crossed logs)
 * used on the splash screen in place of the logo mark.
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

const W = 250;
const H = 195;

export default function Bonfire({ className = '' }: { className?: string }) {
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

    const flame = sprite(96, 255, 110, 50, 0.62);
    const core = sprite(96, 255, 218, 150, 0.92);
    const ember = sprite(32, 255, 195, 70, 1);

    const flames: FP[] = [];
    const embers: FP[] = [];
    let raf = 0;
    let running = true;
    let t = 0;
    let last = performance.now();

    const spawnF = (pre = false) => {
      const max = 30 + Math.random() * 26;
      flames.push({
        x: W / 2 + ((Math.random() + Math.random() + Math.random()) / 1.5 - 1) * 52,
        y: H - 22 + Math.random() * 6,
        vy: -(0.65 + Math.random() * 0.85),
        w: 15 + Math.random() * 30,
        life: pre ? Math.random() * max : 0,
        max,
        a: 0.45 + Math.random() * 0.38,
        core: Math.random() < 0.55,
        swA: 3 + Math.random() * 7,
        swF: 0.025 + Math.random() * 0.05,
        ph: Math.random() * 6.28,
      });
    };
    const spawnE = (pre = false) => {
      const max = 70 + Math.random() * 70;
      embers.push({
        x: W / 2 + ((Math.random() + Math.random()) - 1) * 56,
        y: H - 22,
        vy: -(0.9 + Math.random() * 1.1),
        w: 1.2 + Math.random() * 1.8,
        life: pre ? Math.random() * max : 0,
        max,
        a: 0.5 + Math.random() * 0.5,
        core: false,
        swA: 5 + Math.random() * 9,
        swF: 0.02 + Math.random() * 0.04,
        ph: Math.random() * 6.28,
      });
    };
    for (let i = 0; i < 22; i++) spawnF(true);
    for (let i = 0; i < 8; i++) spawnE(true);

    const tick = (now: number) => {
      if (!running) return;
      const step = Math.min(48, now - last) / 16.7;
      last = now;
      t += step * 16.7;
      ctx.clearRect(0, 0, W, H);

      const flick = Math.max(0, 0.55 + 0.45 * Math.sin(t * 0.013) + 0.22 * Math.sin(t * 0.033));
      const g = ctx.createRadialGradient(W / 2, H - 20, 0, W / 2, H - 20, 95);
      g.addColorStop(0, `rgba(255,110,46,${0.2 + 0.08 * flick})`);
      g.addColorStop(1, 'rgba(255,110,46,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      if (flames.length < 34 && Math.random() < 0.75) spawnF();
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
        const fw = p.w * (1 - 0.32 * tt);
        const fh = p.w * 1.9 * (0.8 + 0.5 * (1 - tt));
        const fade = tt < 0.2 ? tt / 0.2 : 1 - tt;
        ctx.globalAlpha = p.a * fade;
        ctx.drawImage(flame, x - fw / 2, p.y - fh / 2, fw, fh);
        if (p.core) {
          ctx.globalAlpha = p.a * fade * 0.82;
          ctx.drawImage(core, x - fw * 0.2, p.y - fh * 0.62, fw * 0.4, fh * 0.52);
        }
      }
      if (embers.length < 11 && Math.random() < 0.16) spawnE();
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
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return (
    <div className={`relative ${className}`} style={{ width: W, height: H }} aria-hidden="true">
      <canvas ref={ref} className="absolute inset-0" />
      {/* crossed wooden logs under the flames */}
      <svg width="210" height="34" viewBox="0 0 210 34" className="absolute bottom-0 left-1/2 z-[1] -translate-x-1/2">
        <rect x="18" y="16" width="176" height="12" rx="6" fill="#1c130c" stroke="rgba(255,160,70,0.32)" strokeWidth="1.3" />
        <rect x="34" y="7" width="142" height="11" rx="5.5" fill="#221709" stroke="rgba(255,160,70,0.22)" strokeWidth="1.1" transform="rotate(-4 105 12)" />
        <circle cx="38" cy="24" r="2" fill="rgba(255,195,70,0.6)" />
        <circle cx="105" cy="26" r="1.7" fill="rgba(255,150,60,0.5)" />
        <circle cx="168" cy="23" r="1.9" fill="rgba(255,195,70,0.55)" />
      </svg>
    </div>
  );
}
