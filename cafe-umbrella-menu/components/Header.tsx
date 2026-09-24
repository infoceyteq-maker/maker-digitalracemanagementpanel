'use client';

import { motion } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import BrandLogo from './BrandLogo';
import { BRAND } from '@/lib/menu';

export default function Header({ cartCount, onCart }: { cartCount: number; onCart: () => void }) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-ink/78 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {/* umbrella badge — top-left corner, exact 84×54 box (sticky, on every section) */}
          <div className="relative h-[54px] w-[84px] shrink-0">
            <BrandLogo fill priority sizes="84px" />
          </div>
          <div className="leading-none">
            <p className="font-display text-[14px] font-bold tracking-wide text-cream">
              CAFE UMBRELLA <span className="flame-text">· ELLA</span>
            </p>
            <p className="mt-1 text-[8.5px] font-extrabold tracking-[0.3em] text-sun/80">ROTI &amp; KOTTU HUB</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold text-white/60 sm:flex">
            <span className="status-dot h-1.5 w-1.5 rounded-full bg-green-400" />
            OPEN · {BRAND.hours}
          </span>
          <motion.button
            onClick={onCart}
            whileTap={{ scale: 0.9 }}
            aria-label={`Open your order (${cartCount} items)`}
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-sun/30 bg-flame/15 text-sun shadow-[0_0_18px_rgba(255,140,50,0.28)]"
          >
            <ShoppingBag size={17} strokeWidth={2.2} />
            {cartCount > 0 && (
              <motion.span
                key={cartCount}
                initial={{ scale: 0.4 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-br from-sun to-cherry px-1 text-[10px] font-extrabold text-[#2b060f] shadow-[0_0_12px_rgba(255,120,46,0.6)]"
              >
                {cartCount}
              </motion.span>
            )}
          </motion.button>
        </div>
      </div>
    </header>
  );
}
