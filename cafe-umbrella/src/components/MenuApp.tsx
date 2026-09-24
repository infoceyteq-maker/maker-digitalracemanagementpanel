'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MapPin, Phone, Umbrella } from 'lucide-react';
import { CATEGORIES, DISHES, RESTAURANT, type CategoryId, type Dish } from '@/data/menu';
import { DishCard } from './DishCard';
import { DishDetail } from './DishDetail';

type Filter = CategoryId | 'all';

export function MenuApp() {
  const [active, setActive] = useState<Filter>('all');
  const [selected, setSelected] = useState<Dish | null>(null);

  const dishes = useMemo(
    () => (active === 'all' ? DISHES : DISHES.filter((dish) => dish.category === active)),
    [active]
  );

  return (
    <main className="shell">
      <header className="header">
        <div className="brand">
          <span className="brand-mark">
            <Umbrella size={22} strokeWidth={2.3} />
          </span>
          <span className="brand-text">
            <span className="brand-name">{RESTAURANT.name}</span>
            <span className="brand-sub">{RESTAURANT.location}</span>
          </span>
        </div>
        <div className="header-meta">
          <span className="live-dot" />
          Open now
        </div>
      </header>

      <section className="hero">
        <span className="hero-eyebrow">
          <Umbrella size={13} strokeWidth={2.4} /> Digital menu
        </span>
        <h1 className="hero-title">Highland plates, made to order.</h1>
        <p className="hero-copy">
          Wok-fired kottu, slow-cooked stews and roti straight off the griddle, served under the
          Ella umbrellas. Tap any dish for ingredients and preparation time.
        </p>
      </section>

      <div className="rail-wrap">
        <nav className="rail" aria-label="Menu categories">
          <button
            type="button"
            className="chip"
            data-active={active === 'all'}
            onClick={() => setActive('all')}
          >
            All
          </button>
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              type="button"
              className="chip"
              data-active={active === category.id}
              onClick={() => setActive(category.id)}
            >
              {category.name}
            </button>
          ))}
        </nav>
      </div>

      <motion.div layout className="grid">
        <AnimatePresence mode="popLayout">
          {dishes.map((dish) => (
            <DishCard
              key={dish.id}
              dish={dish}
              isSelected={selected?.id === dish.id}
              onSelect={() => setSelected(dish)}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      <p className="footer-note">
        <MapPin size={13} strokeWidth={2.2} style={{ display: 'inline', verticalAlign: '-2px' }} />{' '}
        {RESTAURANT.address}
        <br />
        <Phone size={13} strokeWidth={2.2} style={{ display: 'inline', verticalAlign: '-2px' }} />{' '}
        {RESTAURANT.phone} &middot; Prices in {RESTAURANT.currency} and include all taxes
      </p>

      <AnimatePresence>
        {selected ? <DishDetail dish={selected} onClose={() => setSelected(null)} /> : null}
      </AnimatePresence>
    </main>
  );
}
