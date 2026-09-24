'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { Clock, Flame, Plus } from 'lucide-react';
import SmartImage from './SmartImage';
import SteamPuffs from './SteamPuffs';
import { formatLKR, MenuItem, SPICE_LABELS } from '@/lib/menu';

const BADGE_STYLES: Record<NonNullable<MenuItem['badge']>, string> = {
  SIGNATURE: 'bg-gradient-to-r from-sun to-cherry text-[#2b060f] shadow-[0_0_16px_rgba(255,106,46,0.45)]',
  BESTSELLER: 'border border-flame/40 bg-flame/15 text-flame',
  "CHEF'S PICK": 'border border-yellow-200/40 bg-yellow-200/10 text-yellow-100',
  VEGETARIAN: 'border border-emerald-300/30 bg-emerald-400/10 text-emerald-200',
  NEW: 'border border-sky-300/30 bg-sky-400/10 text-sky-200',
};

interface FoodCardProps {
  item: MenuItem;
  priority?: boolean;
  active: boolean; // true while this item's detail view is open
  hidden: boolean;
  onSelect: (item: MenuItem) => void;
  onQuickAdd: (item: MenuItem) => void;
}

export default function FoodCard({ item, priority, active, hidden, onSelect, onQuickAdd }: FoodCardProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);
  const [canHover, setCanHover] = useState(false);

  // 3D tilt springs (whole card)
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 210, damping: 18, mass: 0.55 });
  const sry = useSpring(ry, { stiffness: 210, damping: 18, mass: 0.55 });

  // inner image parallax (moves deeper than the card for a 2.5D depth feel)
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const spx = useSpring(px, { stiffness: 150, damping: 20 });
  const spy = useSpring(py, { stiffness: 150, damping: 20 });

  useEffect(() => {
    setCanHover(window.matchMedia('(hover: hover) and (pointer: fine)').matches);
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: '90px', threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canHover) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    ry.set((nx - 0.5) * 11);
    rx.set(-(ny - 0.5) * 8.5);
    px.set((nx - 0.5) * 14);
    py.set((ny - 0.5) * 10);
    e.currentTarget.style.setProperty('--mx', `${nx * 100}%`);
    e.currentTarget.style.setProperty('--my', `${ny * 100}%`);
  };

  const onPointerLeave = () => {
    rx.set(0);
    ry.set(0);
    px.set(0);
    py.set(0);
  };

  // desynchronise the idle float per card
  const floatDelay = (((item.id.charCodeAt(0) + item.id.length * 7) % 6) * 0.55).toFixed(2);

  return (
    <motion.div
      ref={rootRef}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -30px 0px' }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      style={{ visibility: hidden ? 'hidden' : 'visible' }}
    >
      <motion.article
        role="button"
        tabIndex={0}
        aria-label={`${item.name}, ${formatLKR(item.price)}`}
        onClick={() => onSelect(item)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(item);
          }
        }}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        style={{ rotateX: srx, rotateY: sry, transformPerspective: 950 }}
        whileHover={canHover ? { scale: 1.028 } : undefined}
        className="group relative cursor-pointer overflow-hidden rounded-3xl border border-white/[0.07] bg-coal shadow-[0_10px_40px_rgba(0,0,0,0.5)] transition-shadow duration-300 hover:border-flame/25 hover:shadow-[0_16px_60px_rgba(255,106,46,0.14)]"
      >
        {/* food image — shared element with the detail view */}
        <motion.div
          layoutId={`dish-${item.id}`}
          style={{ borderRadius: 24 }}
          className="relative aspect-[4/3] w-full overflow-hidden"
        >
          {/* idle 3D float (continuously "breathing" dish) */}
          <div
            className="food-float absolute inset-0"
            style={{ ['--float-delay' as string]: `${floatDelay}s` }}
          >
            {/* pointer parallax layer — the dish glides inside the frame */}
            <motion.div
              className="absolute -inset-[4.5%] transition-[scale] duration-700 ease-out group-hover:scale-[1.09]"
              style={{ x: spx, y: spy }}
            >
              <SmartImage
                src={item.image}
                alt={item.name}
                priority={priority}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </motion.div>
          </div>

          {/* steam rises from the food */}
          <SteamPuffs live={inView && !active} />
          {/* bottom fade into card body */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-coal to-transparent" />
          {item.badge && (
            <span
              className={`absolute left-3 top-3 z-10 rounded-full px-2.5 py-1 font-display text-[9px] font-extrabold tracking-[0.16em] ${BADGE_STYLES[item.badge]}`}
            >
              {item.badge}
            </span>
          )}
        </motion.div>

        {/* pointer-following sheen */}
        {canHover && (
          <div className="card-sheen pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        )}

        {/* body */}
        <div className="relative -mt-1 p-4 pt-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display text-[15.5px] font-bold leading-snug text-cream">
              {item.name}
            </h3>
          </div>
          <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-white/50">
            {item.description}
          </p>

          <div className="mt-3 flex items-center justify-between">
            <span className="flame-text font-display text-[19px] font-extrabold drop-shadow-[0_0_14px_rgba(255,106,46,0.35)]">
              {formatLKR(item.price)}
            </span>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-white/45">
              <Clock size={12} className="text-flame/80" />
              {item.prepMins}m
              <span className="mx-0.5 text-white/15">·</span>
              {item.spice > 0 ? (
                <span className="flex items-center gap-0.5" title={SPICE_LABELS[item.spice]}>
                  {Array.from({ length: item.spice }).map((_, i) => (
                    <Flame key={i} size={11} className="text-cherry" fill="currentColor" />
                  ))}
                </span>
              ) : (
                <span className="text-white/35">mild</span>
              )}
            </div>
          </div>

          {/* quick add */}
          <motion.button
            whileTap={{ scale: 0.82 }}
            onClick={(e) => {
              e.stopPropagation();
              onQuickAdd(item);
            }}
            aria-label={`Add ${item.name} to order`}
            className="absolute -top-5 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sun via-flame to-cherry text-[#2b060f] shadow-[0_4px_22px_rgba(255,106,46,0.55)]"
          >
            <Plus size={19} strokeWidth={2.6} />
          </motion.button>
        </div>
      </motion.article>
    </motion.div>
  );
}
