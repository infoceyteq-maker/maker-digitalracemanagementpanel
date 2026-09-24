'use client';

import { useRef } from 'react';
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { RESTAURANT, type Dish } from '@/data/menu';
import { FloatingParticles } from './FloatingParticles';

interface DishCardProps {
  dish: Dish;
  isSelected: boolean;
  onSelect: () => void;
}

const SPRING = { stiffness: 240, damping: 24, mass: 0.4 };

/**
 * Menu card with a pointer-driven 3D parallax tilt, a light glare sweep that
 * tracks the cursor, and a shared `layoutId` image so tapping the card morphs
 * straight into the full-screen detail view.
 */
export function DishCard({ dish, isSelected, onSelect }: DishCardProps) {
  const ref = useRef<HTMLButtonElement>(null);

  const px = useMotionValue(0);
  const py = useMotionValue(0);

  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [11, -11]), SPRING);
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-11, 11]), SPRING);

  const glareX = useTransform(px, [-0.5, 0.5], ['10%', '90%']);
  const glareY = useTransform(py, [-0.5, 0.5], ['10%', '90%']);
  const glare = useMotionTemplate`radial-gradient(340px circle at ${glareX} ${glareY}, rgba(255, 209, 102, 0.22), transparent 68%)`;

  const handleMove = (event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    px.set((event.clientX - rect.left) / rect.width - 0.5);
    py.set((event.clientY - rect.top) / rect.height - 0.5);
  };

  const handleLeave = () => {
    px.set(0);
    py.set(0);
  };

  return (
    <motion.button
      ref={ref}
      type="button"
      layout
      className="card"
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onClick={onSelect}
      aria-label={`View ${dish.name}`}
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      whileHover={{ scale: 1.025 }}
      whileTap={{ scale: 0.99 }}
      style={{ rotateX, rotateY, transformPerspective: 1200 }}
    >
      <span className="badge-row">
        {dish.isSignature ? <span className="badge badge--offer">Signature</span> : null}
        {dish.specialOffer && !dish.isSignature ? <span className="badge badge--offer">Offer</span> : null}
        {dish.isVegetarian ? <span className="badge badge--veg">Veg</span> : null}
        {dish.isSpicy ? <span className="badge badge--spicy">Spicy</span> : null}
      </span>

      <span className="card-media">
        {isSelected ? null : (
          <motion.img
            layoutId={`dish-img-${dish.id}`}
            src={dish.image}
            alt={dish.name}
            loading="lazy"
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
          />
        )}
        <FloatingParticles />
        <motion.span className="card-glare" style={{ backgroundImage: glare }} />
      </span>

      <span className="card-body">
        <span className="card-name">{dish.name}</span>
        <span className="card-tagline">{dish.tagline}</span>
        <span className="card-foot">
          <span className="price">
            <small>{RESTAURANT.currency}</small>
            {dish.price.toLocaleString()}
          </span>
          <span className="card-cta">
            View <ArrowUpRight size={15} strokeWidth={2.4} />
          </span>
        </span>
      </span>
    </motion.button>
  );
}
