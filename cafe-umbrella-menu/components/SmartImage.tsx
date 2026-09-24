'use client';

import Image from 'next/image';
import { useState } from 'react';

interface SmartImageProps {
  src: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}

/**
 * next/image with a graceful on-brand fallback while loading or if an
 * image is missing (e.g. awaiting final asset generation).
 */
export default function SmartImage({ src, alt, sizes = '(max-width: 640px) 100vw, 50vw', priority, className = '' }: SmartImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[radial-gradient(120%_120%_at_50%_0%,#2e1218_0%,#171114_60%,#0a0a0a_100%)] ${className}`}
        role="img"
        aria-label={alt}
      >
        <span className="text-4xl drop-shadow-[0_0_18px_rgba(255,80,110,0.55)]">🍽️</span>
        <span className="font-display text-[10px] tracking-[0.3em] text-flame/70">FRESH FROM THE KITCHEN</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      quality={82}
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}
