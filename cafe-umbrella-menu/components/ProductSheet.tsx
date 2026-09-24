'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Clock, Flame, Users, X } from 'lucide-react';
import SmartImage from './SmartImage';
import SteamPuffs from './SteamPuffs';
import { formatLKR, MenuItem, SPICE_LABELS } from '@/lib/menu';

interface ProductSheetProps {
  item: MenuItem;
  onClose: () => void;
  onOrder: (item: MenuItem) => void;
}

export default function ProductSheet({ item, onClose, onOrder }: ProductSheetProps) {
  const [added, setAdded] = useState(false);

  const handleOrder = () => {
    onOrder(item);
    setAdded(true);
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(14);
    window.setTimeout(() => setAdded(false), 1300);
  };

  return (
    <motion.div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label={item.name}>
      {/* dim backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/65 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={onClose}
      />

      {/* full-screen sheet */}
      <motion.div
        className="absolute inset-0 overflow-y-auto overscroll-contain bg-ink"
        initial={{ opacity: 0.4, y: 26, scale: 0.988 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.985 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* hero image — morphs from the grid card */}
        <div className="relative h-[46vh] min-h-[310px] w-full" style={{ perspective: 1200 }}>
          <motion.div
            layoutId={`dish-${item.id}`}
            className="absolute inset-0 overflow-hidden"
            style={{ borderRadius: 0 }}
          >
            <motion.div
              className="absolute inset-0"
              initial={{ rotateX: 13, scale: 1.16, y: 30 }}
              animate={{ rotateX: 0, scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 105, damping: 17, delay: 0.06 }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* idle 3D sway — the dish keeps gently rotating in space */}
              <motion.div
                className="relative h-full w-full"
                animate={{ rotateY: [-2.4, 2.4, -2.4] }}
                transition={{ duration: 7.5, repeat: Infinity, ease: 'easeInOut' }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                <motion.div
                  className="relative h-full w-full"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 5.6, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <SmartImage src={item.image} alt={item.name} sizes="100vw" priority className="scale-[1.07]" />
                </motion.div>
              </motion.div>
            </motion.div>
            <SteamPuffs large live />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-ink via-ink/55 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/45 to-transparent" />
          </motion.div>

          <motion.button
            onClick={onClose}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.25 } }}
            exit={{ opacity: 0 }}
            whileTap={{ scale: 0.88 }}
            aria-label="Close item details"
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/45 text-white/85 backdrop-blur-md"
          >
            <X size={18} />
          </motion.button>
        </div>

        {/* content */}
        <div className="relative mx-auto -mt-4 max-w-2xl px-5 pb-36">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex flex-wrap items-end justify-between gap-2">
              <h2 className="text-glow font-display text-[27px] font-extrabold leading-tight text-cream">
                {item.name}
              </h2>
              <p className="flame-text font-display text-[26px] font-extrabold drop-shadow-[0_0_18px_rgba(255,122,24,0.4)]">
                {formatLKR(item.price)}
              </p>
            </div>
            {/* fire-theme divider — brand flame on the detail page */}
            <span className="mt-2 block h-[3px] w-20 rounded-full bg-gradient-to-r from-sun via-flame to-cherry shadow-[0_0_12px_rgba(255,140,50,0.5)]" />

            {/* meta chips */}
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11.5px] font-semibold text-white/70">
                <Clock size={13} className="text-amber" /> {item.prepMins} Mins
              </span>
              <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11.5px] font-semibold text-white/70">
                <Users size={13} className="text-amber" /> Serves {item.serves}
              </span>
              <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11.5px] font-semibold text-white/70">
                <Flame size={13} className="text-ember" fill="currentColor" /> {SPICE_LABELS[item.spice]}
              </span>
            </div>

            {/* special offer — bouncing / pulsing tag */}
            {item.offer && (
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, type: 'spring', stiffness: 260, damping: 15 }}
                className="offer-tag mt-5 flex items-center gap-3 rounded-2xl border border-amber/35 bg-gradient-to-r from-amber/15 to-ember/15 px-4 py-3"
              >
                <span className="rounded-full bg-gradient-to-r from-amber to-ember px-2.5 py-1 font-display text-[9.5px] font-extrabold tracking-[0.14em] text-[#1c0f02]">
                  SPECIAL OFFER
                </span>
                <p className="text-[12.5px] font-semibold leading-snug text-amber">{item.offer}</p>
              </motion.div>
            )}

            <p className="mt-5 text-[14px] leading-relaxed text-white/60">{item.description}</p>

            {/* ingredients */}
            <h3 className="mt-7 font-display text-[11px] font-extrabold tracking-[0.3em] text-white/40">
              INGREDIENTS
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {item.ingredients.map((ing, i) => (
                <motion.span
                  key={ing}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.045, type: 'spring', stiffness: 320, damping: 20 }}
                  className="flex items-center gap-1.5 rounded-full border border-amber/15 bg-white/[0.045] px-3 py-1.5 text-[12px] font-medium text-white/75"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-br from-amber to-ember shadow-[0_0_8px_rgba(255,140,40,0.7)]" />
                  {ing}
                </motion.span>
              ))}
            </div>

            <p className="mt-5 text-[11px] leading-relaxed text-white/30">
              Prepared fresh to order in our open kitchen. Contains allergens — please ask our team for details.
            </p>
          </motion.div>
        </div>

        {/* sticky glowing order bar */}
        <motion.div
          initial={{ y: 90 }}
          animate={{ y: 0 }}
          exit={{ y: 90 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 260, damping: 26 }}
          className="sticky bottom-0 z-10 bg-gradient-to-t from-ink via-ink/92 to-transparent px-5 pb-[max(18px,env(safe-area-inset-bottom))] pt-5"
        >
          <div className="mx-auto max-w-2xl">
            <motion.button
              onClick={handleOrder}
              whileTap={{ scale: 0.965 }}
              className="order-btn flex h-[58px] w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-amber via-ember to-[#ff5e00] font-display text-[15px] font-extrabold tracking-[0.14em] text-[#1c0f02] shadow-[0_10px_44px_rgba(255,122,24,0.5),inset_0_1px_0_rgba(255,255,255,0.35)]"
            >
              {added ? (
                <motion.span
                  key="added"
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center gap-2"
                >
                  <Check size={19} strokeWidth={3} /> ADDED TO YOUR ORDER
                </motion.span>
              ) : (
                <>
                  ORDER NOW
                  <span className="text-[13px] font-bold opacity-70">·</span>
                  <span className="text-[15px] font-extrabold">{formatLKR(item.price)}</span>
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
