'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Facebook, Flame, Instagram, MapPin, Phone, Star } from 'lucide-react';
import CartSheet, { CartLine } from './CartSheet';
import BrandStrip from './BrandStrip';
import FoodCard from './FoodCard';
import Header from './Header';
import ProductSheet from './ProductSheet';
import Splash from './Splash';
import Toast from './Toast';
import WhatsAppIcon from './WhatsAppIcon';
import BrandLogo from './BrandLogo';
import { BRAND, CATEGORIES, MENU, MenuItem } from '@/lib/menu';

const buzz = (pattern: number | number[] = 10) => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      /* noop */
    }
  }
};

export default function MenuExperience() {
  const [splash, setSplash] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [activeCat, setActiveCat] = useState<string>(CATEGORIES[0].id);

  const toastTimer = useRef<number | null>(null);
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 1800);
  }, []);

  const waLink = `https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(
    'Hi Cafe Umbrella Ella! I would like to place an order.',
  )}`;

  /* ── cart ─────────────────────────────────────────────── */
  const addToCart = useCallback(
    (item: MenuItem, silent = false) => {
      setCart((c) => ({ ...c, [item.id]: (c[item.id] ?? 0) + 1 }));
      buzz(12);
      if (!silent) showToast(`${item.name} added`);
    },
    [showToast],
  );

  const changeQty = useCallback((id: string, delta: number) => {
    setCart((c) => {
      const q = (c[id] ?? 0) + delta;
      const next = { ...c };
      if (q <= 0) delete next[id];
      else next[id] = q;
      return next;
    });
  }, []);

  const cartCount = useMemo(() => Object.values(cart).reduce((a, b) => a + b, 0), [cart]);
  const cartLines: CartLine[] = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => ({ item: MENU.find((m) => m.id === id)!, qty }))
        .filter((l) => l.item),
    [cart],
  );

  const selectedItem = useMemo(() => MENU.find((m) => m.id === selectedId) ?? null, [selectedId]);

  /* ── scroll lock + escape ─────────────────────────────── */
  useEffect(() => {
    const locked = Boolean(selectedId) || cartOpen;
    document.body.style.overflow = locked ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedId, cartOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedId(null);
        setCartOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /* ── active category tracking ─────────────────────────── */
  useEffect(() => {
    if (splash) return;
    const sections = Array.from(document.querySelectorAll<HTMLElement>('section[data-cat]'));
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveCat((entry.target as HTMLElement).dataset.cat!);
        }
      },
      { rootMargin: '-30% 0px -60% 0px' },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [splash]);

  const scrollToCat = (id: string) => {
    setActiveCat(id);
    document.getElementById(`cat-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      {/* wood-fire hearth splash */}
      <AnimatePresence>{splash && <Splash key="splash" onDone={() => setSplash(false)} />}</AnimatePresence>

      <Toast message={toast} />

      {/* menu — mounted under the splash so images pre-warm the cache */}
      <motion.main
        initial={false}
        animate={
          splash
            ? { opacity: 0.4, scale: 1.055, filter: 'blur(9px)' }
            : { opacity: 1, scale: 1, filter: 'blur(0px)' }
        }
        transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
        aria-hidden={splash}
        className="relative min-h-screen"
        style={splash ? { pointerEvents: 'none' } : undefined}
      >
        <div className="ambient-glow pointer-events-none fixed inset-0" />
        <div className="grain pointer-events-none fixed inset-0" />

        <Header cartCount={cartCount} onCart={() => setCartOpen(true)} />

        {/* brand cover banner + contact strip */}
        <section className="mx-auto max-w-3xl xl:max-w-5xl px-4 pt-5">
          <motion.div
            initial={{ opacity: 0, y: 22, scale: 0.985 }}
            animate={splash ? {} : { opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.25, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="relative aspect-[16/9] sm:aspect-[16/7] w-full overflow-hidden rounded-3xl border border-white/10 shadow-[0_22px_80px_rgba(255,110,46,0.15)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/cover.jpg"
                alt="The Umbrella Ella — Roti & Kottu Hub · Nine Arch Bridge, Ella"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/55 to-transparent" />
              <span className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full border border-sun/35 bg-black/45 px-3 py-1.5 text-[10.5px] font-bold tracking-[0.14em] text-sun backdrop-blur-md">
                <span className="status-dot h-1.5 w-1.5 rounded-full bg-green-400" />
                NOW OPEN · {BRAND.hours}
              </span>
              {/* location pin — on the cover, links to Google Maps */}
              <a
                href={BRAND.links.maps}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open location in Google Maps"
                className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full border border-flame/45 bg-black/45 px-3 py-1.5 text-[10.5px] font-bold text-white/85 backdrop-blur-md transition active:scale-95"
              >
                <MapPin size={12} className="text-cherry" fill="currentColor" />
                Passara Road, Ella
              </a>
            </div>
          </motion.div>

          {/* name · address · social · whatsapp — right below the cover */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={splash ? {} : { opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="mt-3"
          >
            <BrandStrip />
          </motion.div>
        </section>

        {/* hero */}
        <section className="relative mx-auto max-w-3xl xl:max-w-5xl px-5 pb-2 pt-6">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={splash ? {} : { opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="font-display text-[10px] font-bold tracking-[0.42em] text-sun/70"
          >
            DIGITAL MENU — SCAN · CRAVE · ORDER
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={splash ? {} : { opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mt-2.5 font-display text-[34px] font-extrabold leading-[1.1] text-cream sm:text-4xl"
          >
            THE UMBRELLA <span className="flame-text text-glow">ELLA</span>
            <br />
            <span className="text-sun drop-shadow-[0_0_18px_rgba(255,201,61,0.4)]">ROTI &amp; KOTTU HUB</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={splash ? {} : { opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.7 }}
            className="mt-3 max-w-md text-[13.5px] leading-relaxed text-white/50"
          >
            <span className="font-semibold italic text-white/70">Experience the taste of mountains!</span>{' '}
            Legendary kottu, golden roti and hill-country warmth — every plate is chopped, seared and
            served the minute you order.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={splash ? {} : { opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.6 }}
            className="mt-4 flex flex-wrap items-center gap-2 text-[11px] font-semibold"
          >
            <span className="flex items-center gap-1.5 rounded-full border border-sun/30 bg-sun/10 px-3 py-1.5 text-sun">
              <Star size={12} fill="currentColor" /> {BRAND.rating} · 1.2k reviews
            </span>
            <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-white/60">
              <span className="status-dot h-1.5 w-1.5 rounded-full bg-green-400" /> OPEN · {BRAND.hours}
            </span>
            <a
              href={BRAND.links.maps}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-white/60 transition hover:border-sun/40 hover:text-sun"
            >
              <MapPin size={12} className="text-flame" /> Passara Road, Ella
            </a>
          </motion.div>
        </section>

        {/* category nav */}
        <nav className="sticky top-14 z-20 mt-4 border-y border-white/5 bg-ink/82 backdrop-blur-xl">
          <div className="no-scrollbar mx-auto flex max-w-3xl xl:max-w-5xl gap-2 overflow-x-auto px-4 py-2.5">
            {CATEGORIES.map((c) => {
              const active = activeCat === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => scrollToCat(c.id)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 font-display text-[12px] font-bold tracking-wide transition-all duration-300 ${
                    active
                      ? 'bg-gradient-to-r from-sun via-flame to-cherry text-[#2b060f] shadow-[0_0_22px_rgba(255,140,50,0.5)]'
                      : 'border border-white/10 bg-white/[0.04] text-white/55 hover:text-sun'
                  }`}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        </nav>

        {/* menu sections */}
        {CATEGORIES.map((cat) => {
          const items = MENU.filter((m) => m.category === cat.id);
          return (
            <section
              key={cat.id}
              id={`cat-${cat.id}`}
              data-cat={cat.id}
              className="mx-auto max-w-3xl xl:max-w-5xl scroll-mt-[116px] px-4 pt-9"
            >
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2 className="flex items-center gap-2 font-display text-[21px] font-extrabold text-cream">
                    <Flame size={16} className="text-flame" fill="currentColor" />
                    {cat.name}
                  </h2>
                  {/* fire-theme bar — every section carries the brand flame */}
                  <span className="mt-1.5 block h-[3px] w-14 rounded-full bg-gradient-to-r from-sun via-flame to-cherry shadow-[0_0_12px_rgba(255,140,50,0.55)]" />
                  <p className="mt-1 text-[11.5px] italic text-white/40">{cat.tagline}</p>
                </div>
                <span className="mb-0.5 shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-bold tracking-wider text-white/40">
                  {items.length} DISHES
                </span>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((item) => (
                  <FoodCard
                    key={item.id}
                    item={item}
                    priority={item.id === 'umbrella-legend-kottu'}
                    active={selectedId === item.id}
                    hidden={selectedId === item.id}
                    onSelect={(it) => setSelectedId(it.id)}
                    onQuickAdd={addToCart}
                  />
                ))}
              </div>
            </section>
          );
        })}

        {/* footer */}
        <footer className="mt-14 border-t border-white/5 bg-gradient-to-b from-transparent to-[#160c05]">
          <div className="mx-auto flex max-w-3xl xl:max-w-5xl flex-col items-center px-6 py-10 text-center">
            <BrandLogo className="w-[72px]" />
            <p className="mt-3 font-display text-lg font-extrabold text-cream">
              CAFE UMBRELLA <span className="flame-text">· ELLA</span>
            </p>
            <p className="mt-1 text-[9.5px] font-extrabold tracking-[0.4em] text-sun/80">ROTI &amp; KOTTU HUB</p>
            <p className="mt-2 text-[11px] italic text-white/40">Experience the taste of mountains!</p>

            <a
              href={BRAND.links.maps}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex items-center gap-1.5 text-[11.5px] font-medium text-white/55 transition hover:text-sun"
            >
              <MapPin size={12} className="text-flame" />
              {BRAND.address}
            </a>

            {/* social row — Google Maps · Facebook · Instagram */}
            <div className="mt-5 flex items-center justify-center gap-2.5">
              <a
                href={BRAND.links.maps}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Find us on Google Maps"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/60 transition hover:border-sun/40 hover:text-sun active:scale-90"
              >
                <MapPin size={15} />
              </a>
              <a
                href={BRAND.links.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Cafe Umbrella on Facebook"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/60 transition hover:border-[#1877f2]/50 hover:text-[#4d9bff] active:scale-90"
              >
                <Facebook size={15} />
              </a>
              <a
                href={BRAND.links.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Cafe Umbrella on Instagram"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/60 transition hover:border-[#e1306c]/50 hover:text-[#ff5f8f] active:scale-90"
              >
                <Instagram size={15} />
              </a>
            </div>

            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex h-12 items-center gap-2.5 rounded-full border border-green-400/40 bg-[#25d366]/12 px-6 font-display text-[12px] font-extrabold tracking-[0.1em] text-[#3ddc78] shadow-[0_0_28px_rgba(37,211,102,0.25)] transition active:scale-95"
            >
              <span className="wa-pulse">
                <WhatsAppIcon size={17} />
              </span>
              ORDER VIA WHATSAPP · {BRAND.phone}
            </a>

            <p className="mt-9 text-[10px] text-white/25">
              Powered by Digital Race · © {new Date().getFullYear()} Cafe Umbrella — Ella
            </p>
          </div>
        </footer>
      </motion.main>

      {/* floating animated WhatsApp bubble */}
      {!splash && !selectedId && !cartOpen && (
        <motion.a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1, type: 'spring', stiffness: 260, damping: 18 }}
          whileTap={{ scale: 0.9 }}
          aria-label="Chat with us on WhatsApp"
          className="fixed bottom-[max(18px,env(safe-area-inset-bottom))] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-[0_10px_34px_rgba(37,211,102,0.45)]"
        >
          <span className="wa-ring absolute inset-0 rounded-full" />
          <WhatsAppIcon size={26} />
        </motion.a>
      )}

      {/* product detail — card morphs into full screen */}
      <AnimatePresence>
        {selectedItem && (
          <ProductSheet
            key={selectedItem.id}
            item={selectedItem}
            onClose={() => setSelectedId(null)}
            onOrder={addToCart}
          />
        )}
      </AnimatePresence>

      {/* cart */}
      <AnimatePresence>
        {cartOpen && (
          <CartSheet
            lines={cartLines}
            onClose={() => setCartOpen(false)}
            onQty={changeQty}
            onCleared={() => {
              setCart({});
              setCartOpen(false);
              showToast('Enjoy your meal!');
              buzz([12, 50, 16]);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
