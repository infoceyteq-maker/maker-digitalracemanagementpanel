'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock3, Leaf, ShoppingBag, Sparkles, X } from 'lucide-react';
import { RESTAURANT, categoryName, type Dish } from '@/data/menu';
import { FloatingParticles } from './FloatingParticles';

interface DishDetailProps {
  dish: Dish;
  onClose: () => void;
}

/**
 * Full-screen detail view. The hero image reuses the card's `layoutId`, so the
 * transition morphs from the grid card rather than cross-fading, then eases into
 * a slow continuous 3D rotation.
 */
export function DishDetail({ dish, onClose }: DishDetailProps) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <motion.div
      className="scrim"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={dish.name}
    >
      <motion.div
        className="detail"
        initial={{ y: 44, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 28, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 28 }}
        onClick={(event) => event.stopPropagation()}
      >
        <motion.div
          className="detail-hero"
          initial={{ rotateY: 0, scale: 0.94 }}
          animate={{ rotateY: [0, 4.5, -4.5, 0], scale: 1 }}
          transition={{
            rotateY: { duration: 17, repeat: Infinity, ease: 'easeInOut' },
            scale: { type: 'spring', stiffness: 220, damping: 26 },
          }}
          style={{ transformPerspective: 1500 }}
        >
          <motion.img
            layoutId={`dish-img-${dish.id}`}
            src={dish.image}
            alt={dish.name}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
          />
          <FloatingParticles count={11} seed={dish.id.length * 13 + 5} />
        </motion.div>

        <button type="button" className="detail-close" onClick={onClose} aria-label="Close menu item">
          <X size={18} strokeWidth={2.4} />
        </button>

        <motion.div
          className="detail-panel"
          initial={{ y: 26, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 280, damping: 28 }}
        >
          <span className="detail-cat">{categoryName(dish.category)}</span>
          <h2 className="detail-name">{dish.name}</h2>
          <p className="detail-tagline">{dish.tagline}</p>

          <div className="detail-price-row">
            <span className="detail-price">
              {RESTAURANT.currency} {dish.price.toLocaleString()}
            </span>
            <span className="detail-prep">
              <Clock3 size={15} strokeWidth={2.2} /> {dish.prepTime} mins
            </span>
            {dish.isVegetarian ? (
              <span className="detail-prep">
                <Leaf size={15} strokeWidth={2.2} /> Vegetarian
              </span>
            ) : null}
          </div>

          <h3 className="section-label">Ingredients</h3>
          <div className="ingredients">
            {dish.ingredients.map((item) => (
              <span key={item} className="ingredient">
                {item}
              </span>
            ))}
          </div>

          {dish.specialOffer ? (
            <div className="offer">
              <span className="offer-icon">
                <Sparkles size={17} strokeWidth={2.3} />
              </span>
              <span className="offer-text">
                <span className="offer-label">Special offer</span>
                <span className="offer-value">{dish.specialOffer}</span>
              </span>
            </div>
          ) : null}

          <button type="button" className="order-btn">
            <ShoppingBag size={18} strokeWidth={2.4} />
            Order now
          </button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
